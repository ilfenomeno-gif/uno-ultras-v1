// ============================================================
// UNO ULTRA Server — Authoritative MCP Match Progression Hub
// (Coordina Rank, Match, MMR, Modalità, Sfide, Battle Card & Valute)
// ============================================================

import {
  formatPlaylistKey,
  GAME_MODES,
  getRankFromMMR,
  normalizePlaylistPlayerCount,
  type GameMode,
  type MatchRewardReceipt,
} from '@uno/shared';
import { logger } from '../config/logger.js';
import { settleRankedMatchForPlayers } from '../matchmaking/mmr.js';
import { addBattleCardXp } from '../persistence/postgres/repositories/battle-card.js';
import { incrementChallengeMetricsBatch } from '../persistence/postgres/repositories/challenges.js';
import {
  recordFinishedMatch,
  type MatchParticipantRecord,
} from '../persistence/postgres/repositories/matches.js';
import { getPlayerPlaylistRank } from '../persistence/postgres/repositories/playlist-ranks.js';
import { findPlayerById } from '../persistence/postgres/repositories/players.js';
import { applyBalanceDelta } from '../persistence/postgres/repositories/transactions.js';
import { metrics } from '../observability/metrics.js';

export interface FinishedParticipantInput {
  readonly id: string;
  readonly username: string;
  readonly isBot: boolean;
  readonly score: number;
  readonly cardsPlayed?: number;
  readonly unoCalls?: number;
  readonly drawStacks?: number;
}

export interface SettleFinishedMatchInput {
  readonly matchId: string;
  readonly mode: string;
  readonly variant?: string;
  readonly playerCount?: number;
  readonly isRanked: boolean;
  readonly winnerId: string;
  readonly turnCount: number;
  readonly durationSec: number;
  readonly participants: readonly FinishedParticipantInput[];
  readonly replaySeed?: number;
  readonly replayEvents?: readonly Record<string, unknown>[];
}

export const MODE_REWARD_MULTIPLIERS: Readonly<Record<string, number>> = {
  uno: 1.0,
  blackjack: 0.9,
  scala40: 1.0,
  scopa: 0.9,
  'ruba-mazzetto': 0.9,
  'poker-texas': 1.05,
  burraco: 1.05,
  'mille-miglia': 0.95,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function resolveModeMultiplier(mode: string, isRanked: boolean): number {
  const base = MODE_REWARD_MULTIPLIERS[mode] ?? 1.0;
  return Number((base + (isRanked ? 0.2 : 0)).toFixed(2));
}

export async function settleFinishedMatchWithReceipts(
  input: SettleFinishedMatchInput,
): Promise<Record<string, MatchRewardReceipt>> {
  const receipts: Record<string, MatchRewardReceipt> = {};
  const variant = input.variant ?? 'standard';
  const modeMultiplier = resolveModeMultiplier(input.mode, input.isRanked);
  const resolvedMode: GameMode = (GAME_MODES as readonly string[]).includes(input.mode)
    ? (input.mode as GameMode)
    : 'uno';
  const bucketCount = normalizePlaylistPlayerCount(
    input.playerCount ?? input.participants.length,
  );
  const playlistKey = formatPlaylistKey(resolvedMode, bucketCount);

  try {
    const rankedHumans = new Map<
      string,
      { mmr: number; username: string; vcard: number; rankTier: string; battleCardLevel: number }
    >();

    for (const p of input.participants) {
      if (p.isBot || !UUID_RE.test(p.id)) continue;
      try {
        const [row, playlistRank] = await Promise.all([
          findPlayerById(p.id),
          getPlayerPlaylistRank(p.id, resolvedMode, bucketCount),
        ]);
        if (row) {
          rankedHumans.set(p.id, {
            mmr: Number(playlistRank.mmr),
            username: row.username,
            vcard: Number(row.vcard),
            rankTier: playlistRank.rankTier,
            battleCardLevel: Number(row.battle_card_level),
          });
        }
      } catch {
        // Ignore individual DB lookup failure
      }
    }

    const mmrUpdates = new Map<
      string,
      { before: number; after: number; delta: number; rankTier: string }
    >();
    if (input.isRanked && rankedHumans.size > 0) {
      const humanMmrs = [...rankedHumans.values()].map((h) => h.mmr);
      const avgHumanMmr =
        humanMmrs.length > 0
          ? Math.round(humanMmrs.reduce((s, v) => s + v, 0) / humanMmrs.length)
          : 400;
      const settlements = await settleRankedMatchForPlayers({
        winnerId: input.winnerId,
        playlistMultiplier: modeMultiplier,
        mode: resolvedMode,
        playerCount: bucketCount,
        participants: input.participants.map((p) => {
          const isHuman = !p.isBot && UUID_RE.test(p.id) && rankedHumans.has(p.id);
          return {
            playerId: p.id,
            username: rankedHumans.get(p.id)?.username ?? p.username,
            mmr: isHuman ? rankedHumans.get(p.id)!.mmr : avgHumanMmr,
            isBot: !isHuman,
          };
        }),
      });
      for (const s of settlements) {
        mmrUpdates.set(s.playerId, {
          before: s.mmrBefore,
          after: s.mmrAfter,
          delta: s.delta,
          rankTier: s.rankTier,
        });
      }
    }

    const sorted = [...input.participants].sort((a, b) => {
      if (a.id === input.winnerId) return -1;
      if (b.id === input.winnerId) return 1;
      return b.score - a.score;
    });

    const participantRecords: MatchParticipantRecord[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i]!;
      const placement = i + 1;
      const won = p.id === input.winnerId;
      const humanSnapshot = rankedHumans.get(p.id);
      const isPersistedHuman = !p.isBot && UUID_RE.test(p.id) && humanSnapshot !== undefined;
      const isHumanInput = !p.isBot;

      const vcardEarned = isHumanInput ? Math.round((won ? 40 : 15) * modeMultiplier) : 0;
      const xpEarned = isHumanInput ? Math.round((won ? 250 : 110) * modeMultiplier) : 0;
      const tournamentCreditsEarned =
        isHumanInput && input.isRanked ? (won ? 25 : 5) : 0;

      const baseMmr = humanSnapshot?.mmr ?? 400;
      const mmrInfo = mmrUpdates.get(p.id);
      const mmrBefore = mmrInfo?.before ?? baseMmr;
      const mmrAfter = mmrInfo?.after ?? baseMmr;
      const mmrDelta = mmrInfo?.delta ?? 0;
      const rankBefore = humanSnapshot?.rankTier ?? getRankFromMMR(mmrBefore);
      const rankAfter = mmrInfo?.rankTier ?? getRankFromMMR(mmrAfter);
      const rankPromoted = rankAfter !== rankBefore && mmrAfter > mmrBefore;

      let vcardBalanceAfter = (humanSnapshot?.vcard ?? 0) + vcardEarned;
      let battleCardLevelAfter = humanSnapshot?.battleCardLevel ?? 1;
      let challengesProgressed = 0;

      participantRecords.push({
        ...(isPersistedHuman ? { playerId: p.id } : { botName: p.username }),
        isBot: !isPersistedHuman,
        placement,
        score: p.score,
        mmrBefore: mmrInfo?.before ?? 0,
        mmrAfter: mmrInfo?.after ?? 0,
        mmrDelta,
        vcardEarned: isPersistedHuman ? vcardEarned : 0,
        xpEarned: isPersistedHuman ? xpEarned : 0,
      });

      if (isPersistedHuman) {
        try {
          const vcardRes = await applyBalanceDelta({
            playerId: p.id,
            txType: 'match_reward',
            currency: 'vcard',
            delta: vcardEarned,
            referenceId: `${input.mode}:${input.matchId}`,
            idempotencyKey: `match:${input.matchId}:${p.id}:vcard`,
          });
          vcardBalanceAfter = vcardRes.balanceAfter;
        } catch (err) {
          logger.warn({ err, playerId: p.id, matchId: input.matchId }, 'V-Card match reward failed');
        }

        if (tournamentCreditsEarned > 0) {
          try {
            await applyBalanceDelta({
              playerId: p.id,
              txType: 'match_reward',
              currency: 'tournament_credits',
              delta: tournamentCreditsEarned,
              referenceId: `${input.mode}:${input.matchId}`,
              idempotencyKey: `match:${input.matchId}:${p.id}:tcredits`,
            });
          } catch (err) {
            logger.warn({ err, playerId: p.id, matchId: input.matchId }, 'Tournament credits match reward failed');
          }
        }

        try {
          const bcState = await addBattleCardXp(p.id, xpEarned);
          battleCardLevelAfter = bcState.level;
        } catch (err) {
          logger.warn({ err, playerId: p.id, matchId: input.matchId }, 'Battle Card XP update failed');
        }

        try {
          const metricDeltas = {
            matches_played: 1,
            matches_won: won ? 1 : 0,
            cards_played: p.cardsPlayed ?? 0,
            uno_calls: p.unoCalls ?? 0,
            draw_stacks: p.drawStacks ?? 0,
          };
          challengesProgressed = Object.values(metricDeltas).filter((v) => v > 0).length;
          await incrementChallengeMetricsBatch(p.id, metricDeltas);
        } catch (err) {
          logger.warn({ err, playerId: p.id, matchId: input.matchId }, 'Challenge increment failed');
        }
      }

      if (isHumanInput) {
        receipts[p.id] = {
          matchId: input.matchId,
          mode: input.mode,
          variant,
          isRanked: input.isRanked,
          won,
          placement,
          score: p.score,
          mmrBefore,
          mmrAfter,
          mmrDelta,
          rankBefore,
          rankAfter,
          rankPromoted,
          xpEarned,
          battleCardLevelAfter,
          vcardEarned,
          vcardBalanceAfter,
          tournamentCreditsEarned,
          challengesProgressed,
          modeMultiplier,
          playerCount: bucketCount,
          playlistKey,
        };
      }
    }

    const winnerObj = input.participants.find((p) => p.id === input.winnerId);
    const persistedWinnerId =
      winnerObj && !winnerObj.isBot && UUID_RE.test(winnerObj.id) && rankedHumans.has(winnerObj.id)
        ? winnerObj.id
        : undefined;

    await recordFinishedMatch({
      mode: input.mode,
      variant,
      isRanked: input.isRanked,
      ...(persistedWinnerId !== undefined ? { winnerId: persistedWinnerId } : {}),
      winnerLabel: winnerObj?.username ?? input.winnerId,
      turnCount: input.turnCount,
      durationSec: input.durationSec,
      participants: participantRecords,
      ...(input.replaySeed !== undefined ? { replaySeed: input.replaySeed } : {}),
      ...(input.replayEvents !== undefined ? { replayEvents: input.replayEvents } : {}),
    });

    metrics.inc('matches_settled_total');
  } catch (err) {
    logger.warn({ err, matchId: input.matchId }, 'settleFinishedMatch failed (non-fatal)');
  }

  return receipts;
}

export async function settleFinishedMatch(input: SettleFinishedMatchInput): Promise<void> {
  await settleFinishedMatchWithReceipts(input);
}
