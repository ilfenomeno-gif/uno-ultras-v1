// ============================================================
// UNO ULTRA Server — MCP Progression Hub REST Router
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import {
  GAME_MODES,
  getRankFromMMR,
  getSubDivision,
  PLACEMENT_MATCHES_REQUIRED,
  type MatchRewardReceipt,
  type PlaylistRankEntry,
} from '@uno/shared';
import { authRequired } from '../../../auth/middleware.js';
import { logger } from '../../../config/logger.js';
import { getOrCreateBattleCard } from '../../../persistence/postgres/repositories/battle-card.js';
import { getOrInitPlayerChallenges } from '../../../persistence/postgres/repositories/challenges.js';
import { getActiveMatchmakingBan } from '../../../persistence/postgres/repositories/matchmaking-bans.js';
import { listPlayerPlaylistRanks } from '../../../persistence/postgres/repositories/playlist-ranks.js';
import { findPlayerById } from '../../../persistence/postgres/repositories/players.js';
import { getPlayerBalances } from '../../../persistence/postgres/repositories/transactions.js';
import { createRateLimiter } from '../../../security/rate-limiter.js';
import {
  resolveModeMultiplier,
  settleFinishedMatchWithReceipts,
} from '../../../services/match-settlement.js';

export const progressionRouter = Router();

const settleLimiter = createRateLimiter({ scope: 'progression_settle', max: 30, windowSeconds: 60 });

const SettleMatchSchema = z.object({
  matchId: z.string().trim().min(3).max(80),
  mode: z.enum(GAME_MODES),
  variant: z.string().trim().min(1).max(40).default('standard'),
  playerCount: z.number().int().min(2).max(4).default(2),
  isRanked: z.boolean().default(false),
  won: z.boolean(),
  score: z.number().int().min(-5000).max(50000).default(0),
  opponentScore: z.number().int().min(-5000).max(50000).default(0),
  turnCount: z.number().int().min(1).max(2000).default(1),
  durationSec: z.number().int().min(1).max(7200).default(10),
  cardsPlayed: z.number().int().min(0).max(500).default(1),
});

progressionRouter.post('/settle-match', authRequired, settleLimiter, async (req, res) => {
  const parsed = SettleMatchSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload chiusura partita non valido' });
    return;
  }

  const playerId = req.user!.sub;
  const username = req.user!.username;
  const d = parsed.data;
  const botParticipants = Array.from({ length: Math.max(1, d.playerCount - 1) }, (_, idx) => ({
    id: `bot_${idx + 1}`,
    username: `Bot_${idx + 1}`,
    isBot: true,
    score: idx === 0 ? d.opponentScore : Math.max(0, d.opponentScore - (idx + 1) * 10),
    cardsPlayed: 1,
  }));

  try {
    const receipts = await settleFinishedMatchWithReceipts({
      matchId: d.matchId,
      mode: d.mode,
      variant: d.variant,
      playerCount: d.playerCount,
      isRanked: d.isRanked,
      winnerId: d.won ? playerId : 'bot_1',
      turnCount: d.turnCount,
      durationSec: d.durationSec,
      participants: [
        {
          id: playerId,
          username,
          isBot: false,
          score: d.score,
          cardsPlayed: d.cardsPlayed,
        },
        ...botParticipants,
      ],
    });

    const mult = resolveModeMultiplier(d.mode, d.isRanked);
    const receipt: MatchRewardReceipt = receipts[playerId] ?? {
      matchId: d.matchId,
      mode: d.mode,
      variant: d.variant,
      isRanked: d.isRanked,
      won: d.won,
      placement: d.won ? 1 : 2,
      score: d.score,
      mmrBefore: 400,
      mmrAfter: 400,
      mmrDelta: 0,
      rankBefore: getRankFromMMR(400),
      rankAfter: getRankFromMMR(400),
      rankPromoted: false,
      xpEarned: Math.round((d.won ? 250 : 110) * mult),
      battleCardLevelAfter: 1,
      vcardEarned: Math.round((d.won ? 40 : 15) * mult),
      vcardBalanceAfter: Math.round((d.won ? 40 : 15) * mult),
      tournamentCreditsEarned: d.isRanked ? (d.won ? 25 : 5) : 0,
      challengesProgressed: d.won ? 3 : 2,
      modeMultiplier: mult,
    };

    res.status(200).json({ receipt });
  } catch (err) {
    logger.warn({ err, playerId, matchId: d.matchId }, 'Error settling progression match');
    res.status(500).json({ error: 'Errore aggiornamento progressione partita' });
  }
});

progressionRouter.get('/snapshot', authRequired, async (req, res) => {
  const playerId = req.user!.sub;
  try {
    const [player, balances, battleCard, challenges, rawPlaylistRanks, activeBan] = await Promise.all([
      findPlayerById(playerId),
      getPlayerBalances(playerId).catch(() => ({ vcard: 0, tournamentCredits: 0 })),
      getOrCreateBattleCard(playerId),
      getOrInitPlayerChallenges(playerId),
      listPlayerPlaylistRanks(playerId).catch(() => ({} as Record<string, PlaylistRankEntry>)),
      getActiveMatchmakingBan(playerId).catch(() => null),
    ]);
    const playlistRanks: Record<string, PlaylistRankEntry> = {};
    for (const [k, entry] of Object.entries(rawPlaylistRanks)) {
      const matchesPlayed = entry.wins + entry.losses;
      playlistRanks[k] = {
        ...entry,
        matchesPlayed,
        placementRequired: PLACEMENT_MATCHES_REQUIRED,
        placementComplete: matchesPlayed >= PLACEMENT_MATCHES_REQUIRED,
        subDivision: getSubDivision(entry.mmr),
      };
    }
    const mmr = Number(player?.mmr ?? 400);
    const activeChallenges = challenges.filter((c) => !c.claimed).length;
    const claimableChallenges = challenges.filter(
      (c) => !c.claimed && c.progress >= c.definition.target,
    ).length;

    res.status(200).json({
      playerId,
      username: player?.username ?? req.user!.username,
      mmr,
      rankTier: player?.rank_tier ?? getRankFromMMR(mmr),
      playlistRanks,
      activeBan,
      vcardBalance: Number(player?.vcard ?? balances.vcard),
      tournamentCredits: balances.tournamentCredits,
      battleCard: {
        tier: battleCard.tier,
        level: battleCard.level,
        xp: battleCard.xp,
      },
      challenges: {
        total: challenges.length,
        active: activeChallenges,
        claimable: claimableChallenges,
      },
    });
  } catch (err) {
    logger.warn({ err, playerId }, 'Progression snapshot fallback (DB unavailable)');
    res.status(200).json({
      playerId,
      username: req.user!.username,
      mmr: 400,
      rankTier: getRankFromMMR(400),
      playlistRanks: {},
      vcardBalance: 0,
      tournamentCredits: 0,
      battleCard: { tier: 'free', level: 1, xp: 0 },
      challenges: { total: 0, active: 0, claimable: 0 },
    });
  }
});
