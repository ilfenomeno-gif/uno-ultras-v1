// ============================================================
// UNO ULTRA Server — Matchmaking Queue REST Router
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { GAME_MODES, type GameMode } from '@uno/shared';
import { authRequired } from '../../../auth/middleware.js';
import { matchmakingQueue } from '../../../matchmaking/queue.js';
import {
  pushRedisQueueMember,
  removeRedisQueueMembers,
} from '../../../matchmaking/redis-queue.js';
import { findPlayerById } from '../../../persistence/postgres/repositories/players.js';
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
});

matchmakingRouter.post('/enqueue', authRequired, mmLimiter, async (req, res) => {
  const parsed = EnqueueSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Parametri coda matchmaking non validi' });
    return;
  }

  const playerId = req.user!.sub;
  const username = req.user!.username;
  let mmr = 0;
  try {
    const player = await findPlayerById(playerId);
    if (player) mmr = Number(player.mmr);
  } catch {
    // Fallback mmr 0 se DB non raggiungibile in unit test
  }

  const ticket = matchmakingQueue.enqueue({
    playerId,
    username,
    mode: parsed.data.mode,
    ranked: parsed.data.ranked,
    mmr,
    targetPlayers: parsed.data.targetPlayers,
  });

  await pushRedisQueueMember(parsed.data.mode, parsed.data.ranked, playerId, mmr);
  await cacheMatchmakingTicket(ticket.ticketId, {
    status: 'searching',
    ticketId: ticket.ticketId,
    playerId,
    mode: parsed.data.mode,
    ranked: parsed.data.ranked,
    mmr,
  });

  const formed = matchmakingQueue.popMatches();
  const myMatch = formed.find((m) => m.players.some((p) => p.playerId === playerId)) ?? null;

  if (myMatch) {
    for (const member of myMatch.players) {
      await removeRedisQueueMembers(myMatch.mode, myMatch.ranked, [member.playerId]);
      await cacheMatchmakingTicket(member.ticketId, {
        status: 'matched',
        matchId: myMatch.matchId,
        mode: myMatch.mode,
        ranked: myMatch.ranked,
        averageMMR: myMatch.averageMMR,
        players: myMatch.players.map((p) => ({ playerId: p.playerId, username: p.username })),
      });
    }
  }

  res.status(200).json({
    ticket,
    matched: myMatch,
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
