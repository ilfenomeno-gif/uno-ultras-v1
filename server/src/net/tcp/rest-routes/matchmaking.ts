// ============================================================
// UNO ULTRA Server — Matchmaking Queue REST Router
// ============================================================

import { Router } from 'express';
import { matchMaker } from 'colyseus';
import { z } from 'zod';
import {
  checkPartyRankDisparity,
  computeWeightedPartyMMR,
  GAME_MODES,
  type GameMode,
} from '@uno/shared';
import { authRequired } from '../../../auth/middleware.js';
import { matchmakingQueue } from '../../../matchmaking/queue.js';
import {
  pushRedisQueueMember,
  removeRedisQueueMembers,
} from '../../../matchmaking/redis-queue.js';
import { getActiveMatchmakingBan } from '../../../persistence/postgres/repositories/matchmaking-bans.js';
import { getPlayerPlaylistRank } from '../../../persistence/postgres/repositories/playlist-ranks.js';
import {
  cacheMatchmakingTicket,
  getMatchmakingTicket,
} from '../../../persistence/redis/matchmaking-cache.js';
import { createRateLimiter } from '../../../security/rate-limiter.js';

export const matchmakingRouter = Router();

const mmLimiter = createRateLimiter({ scope: 'matchmaking', max: 20, windowSeconds: 60 });

const EnqueueSchema = z.object({
  mode: z.enum(GAME_MODES).default('uno'),
  ranked: z.boolean().default(false),
  targetPlayers: z.number().int().min(2).max(4).default(4),
  variant: z.enum(['standard', 'blitz', 'chaos', 'team', 'custom']).optional(),
  partyMemberIds: z.array(z.string().min(1).max(80)).max(3).optional(),
  partyMemberMmrs: z.array(z.number().min(0).max(10000)).max(3).optional(),
  isTournament: z.boolean().optional(),
});

matchmakingRouter.post('/enqueue', authRequired, mmLimiter, async (req, res) => {
  const parsed = EnqueueSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Parametri coda matchmaking non validi' });
    return;
  }

  const playerId = req.user!.sub;
  const username = req.user!.username;

  if (parsed.data.ranked) {
    const activeBan = await getActiveMatchmakingBan(playerId).catch(() => null);
    if (activeBan) {
      res.status(403).json({
        error: `Ban dal matchmaking attivo (${Math.ceil(activeBan.remainingSeconds / 60)} min rimanenti): ${activeBan.reason}`,
        ban: activeBan,
      });
      return;
    }
  }

  let mmr = 0;
  try {
    const playlistEntry = await getPlayerPlaylistRank(
      playerId,
      parsed.data.mode,
      parsed.data.targetPlayers,
    );
    mmr = playlistEntry.mmr;
  } catch {
    // Fallback mmr 0 se DB non raggiungibile in unit test
  }

  const partyMmrs: number[] = [mmr];
  if (parsed.data.partyMemberIds?.length) {
    const fetched = await Promise.all(
      parsed.data.partyMemberIds.map((id) =>
        getPlayerPlaylistRank(id, parsed.data.mode, parsed.data.targetPlayers)
          .then((r) => r.mmr)
          .catch(() => 0),
      ),
    );
    partyMmrs.push(...fetched);
  }
  if (parsed.data.partyMemberMmrs?.length) {
    partyMmrs.push(...parsed.data.partyMemberMmrs);
  }

  const disparity = checkPartyRankDisparity({
    memberMmrs: partyMmrs,
    targetPlayers: parsed.data.targetPlayers,
    mode: parsed.data.mode,
    ranked: parsed.data.ranked,
    ...(parsed.data.isTournament !== undefined
      ? { isTournament: parsed.data.isTournament }
      : {}),
  });
  if (!disparity.allowed) {
    res.status(403).json({
      error: disparity.reason ?? 'Dislivello di grado eccessivo nel gruppo',
      disparity,
    });
    return;
  }

  const effectiveMmr = computeWeightedPartyMMR(partyMmrs, { ranked: parsed.data.ranked });

  const ticket = matchmakingQueue.enqueue({
    playerId,
    username,
    mode: parsed.data.mode,
    ranked: parsed.data.ranked,
    mmr: effectiveMmr,
    targetPlayers: parsed.data.targetPlayers,
  });

  await pushRedisQueueMember(parsed.data.mode, parsed.data.ranked, playerId, effectiveMmr);
  await cacheMatchmakingTicket(ticket.ticketId, {
    status: 'searching',
    ticketId: ticket.ticketId,
    playerId,
    mode: parsed.data.mode,
    ranked: parsed.data.ranked,
    mmr: effectiveMmr,
  });

  const formed = matchmakingQueue.popMatches();
  let matchedResponse: Record<string, unknown> | null = null;

  for (const match of formed) {
    let roomId: string | undefined;
    if (match.mode === 'uno') {
      try {
        const created = await matchMaker.createRoom('uno', {
          maxPlayers: match.players.length,
          ranked: match.ranked,
          fillWithBots: false,
          variant: parsed.data.variant ?? 'standard',
          matchmade: true,
        });
        roomId = created.roomId;
      } catch {
        // Fallback when running HTTP-only unit tests without Colyseus server booted
      }
    }

    for (const member of match.players) {
      await removeRedisQueueMembers(match.mode, match.ranked, [member.playerId]);
      await cacheMatchmakingTicket(member.ticketId, {
        status: 'matched',
        matchId: match.matchId,
        ...(roomId ? { roomId } : {}),
        mode: match.mode,
        ranked: match.ranked,
        averageMMR: match.averageMMR,
        players: match.players.map((p) => ({ playerId: p.playerId, username: p.username })),
      });
    }

    if (match.players.some((p) => p.playerId === playerId)) {
      matchedResponse = {
        ...match,
        ...(roomId ? { roomId } : {}),
      };
    }
  }

  res.status(200).json({
    ticket,
    effectivePartyMmr: effectiveMmr,
    disparity,
    matched: matchedResponse,
    queueSize: matchmakingQueue.size(),
  });
});

matchmakingRouter.get('/status/:ticketId', authRequired, async (req, res) => {
  const ticketId = String(req.params['ticketId'] ?? '').trim();
  if (!ticketId) {
    res.status(400).json({ error: 'ticketId mancante' });
    return;
  }
  const ticket = await getMatchmakingTicket(ticketId);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket matchmaking scaduto o non trovato' });
    return;
  }
  res.status(200).json(ticket);
});

matchmakingRouter.delete('/cancel', authRequired, async (req, res) => {
  const playerId = req.user!.sub;
  const cancelled = matchmakingQueue.cancel(playerId);
  const mode = (GAME_MODES as readonly string[]).includes(String(req.query['mode']))
    ? (req.query['mode'] as GameMode)
    : 'uno';
  await removeRedisQueueMembers(mode, req.query['ranked'] === 'true', [playerId]);
  res.status(200).json({ cancelled });
});
