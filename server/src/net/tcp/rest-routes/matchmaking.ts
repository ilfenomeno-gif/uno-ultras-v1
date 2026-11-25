// ============================================================
// UNO ULTRA Server — Matchmaking Queue REST Router
// ============================================================

import { randomUUID } from 'node:crypto';
import { Router, type Request } from 'express';
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
  claimRedisQueueMember,
  pushRedisQueueMember,
  removeRedisQueueMembers,
} from '../../../matchmaking/redis-queue.js';
import { getActiveMatchmakingBan } from '../../../persistence/postgres/repositories/matchmaking-bans.js';
import { getPlayerPlaylistRank } from '../../../persistence/postgres/repositories/playlist-ranks.js';
import {
  cacheMatchmakingTicket,
  getMatchmakingTicket,
  listSearchingMatchmakingTickets,
} from '../../../persistence/redis/matchmaking-cache.js';
import { createRateLimiter } from '../../../security/rate-limiter.js';

export const matchmakingRouter = Router();

const mmKeyFn = (req: Request): string =>
  req.user?.sub ?? req.ip ?? req.socket.remoteAddress ?? 'unknown';

const enqueueLimiter = createRateLimiter({
  scope: 'mm_enqueue',
  max: 12,
  windowSeconds: 60,
  keyFn: mmKeyFn,
});
const statusLimiter = createRateLimiter({
  scope: 'mm_status',
  max: 180,
  windowSeconds: 60,
  keyFn: mmKeyFn,
});
const cancelLimiter = createRateLimiter({
  scope: 'mm_cancel',
  max: 30,
  windowSeconds: 60,
  keyFn: mmKeyFn,
});
const fallbackTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearFallbackTimer(ticketId: string): void {
  const existing = fallbackTimers.get(ticketId);
  if (existing) {
    clearTimeout(existing);
    fallbackTimers.delete(ticketId);
  }
}

async function isMatchmadeRoomCapReached(): Promise<boolean> {
  const maxRooms = Math.max(1, Number(process.env['MAX_ACTIVE_MATCHMADE_ROOMS'] ?? 200));
  try {
    const rooms = await matchMaker.query({ name: 'uno' });
    return rooms.length >= maxRooms;
  } catch {
    return false;
  }
}

async function runServerBotFallback(playerId: string, ticketId: string): Promise<void> {
  const claimed = matchmakingQueue.claimForBotFallback(playerId, ticketId);
  if (!claimed) return;

  const claimedRedis = await claimRedisQueueMember(
    claimed.mode,
    claimed.ranked,
    claimed.playerId,
  );
  if (!claimedRedis) return;

  if (await isMatchmadeRoomCapReached()) {
    await cacheMatchmakingTicket(ticketId, {
      status: 'cancelled',
      reason: 'room_cap_reached',
      ticketId,
      playerId,
      mode: claimed.mode,
      ranked: claimed.ranked,
    });
    return;
  }

  let roomId: string | undefined;
  if (claimed.mode === 'uno') {
    try {
      const created = await matchMaker.createRoom('uno', {
        maxPlayers: claimed.targetPlayers,
        ranked: claimed.ranked,
        fillWithBots: true,
        variant: claimed.variant ?? 'standard',
        matchmade: true,
        allowedPlayerIds: [claimed.playerId],
      });
      roomId = created.roomId;
    } catch {
      // Fallback when running HTTP-only unit tests without Colyseus server booted
    }
  }

  await cacheMatchmakingTicket(ticketId, {
    status: 'matched',
    matchType: 'bot_fallback',
    matchId: randomUUID(),
    ticketId,
    playerId,
    mode: claimed.mode,
    ranked: claimed.ranked,
    targetPlayers: claimed.targetPlayers,
    variant: claimed.variant ?? 'standard',
    allowedPlayerIds: [claimed.playerId],
    ...(roomId ? { roomId } : {}),
  });
}

const EnqueueSchema = z.object({
  mode: z.enum(GAME_MODES).default('uno'),
  ranked: z.boolean().default(false),
  targetPlayers: z.number().int().min(2).max(4).default(4),
  variant: z.enum(['standard', 'blitz', 'chaos', 'team', 'custom']).optional(),
  partyMemberIds: z.array(z.string().min(1).max(80)).max(3).optional(),
  partyMemberMmrs: z.array(z.number().min(0).max(10000)).max(3).optional(),
  isTournament: z.boolean().optional(),
});

matchmakingRouter.post('/enqueue', authRequired, enqueueLimiter, async (req, res) => {
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

  if (await isMatchmadeRoomCapReached()) {
    res.status(503).json({ error: 'Capacità massima stanze raggiunta, riprova tra poco' });
    return;
  }

  const prevTicket = matchmakingQueue.cancelAndGetTicket(playerId);
  if (prevTicket) {
    clearFallbackTimer(prevTicket.ticketId);
    await removeRedisQueueMembers(prevTicket.mode, prevTicket.ranked, [playerId]);
  }

  const effectiveMmr = computeWeightedPartyMMR(partyMmrs, { ranked: parsed.data.ranked });
  const fallbackDelayMs = Math.max(20, Number(process.env['MATCHMAKING_BOT_FALLBACK_MS'] ?? 3500));
  const fallbackAtMs = Date.now() + fallbackDelayMs;
  const selectedVariant = parsed.data.variant ?? 'standard';

  const ticket = matchmakingQueue.enqueue({
    playerId,
    username,
    mode: parsed.data.mode,
    ranked: parsed.data.ranked,
    mmr: effectiveMmr,
    targetPlayers: parsed.data.targetPlayers,
    variant: selectedVariant,
    fallbackAtMs,
  });

  await pushRedisQueueMember(parsed.data.mode, parsed.data.ranked, playerId, effectiveMmr);
  await cacheMatchmakingTicket(ticket.ticketId, {
    status: 'searching',
    ticketId: ticket.ticketId,
    playerId,
    mode: parsed.data.mode,
    ranked: parsed.data.ranked,
    mmr: effectiveMmr,
    targetPlayers: parsed.data.targetPlayers,
    variant: selectedVariant,
    fallbackAtMs,
  });

  const formed = matchmakingQueue.popMatches();
  let matchedResponse: Record<string, unknown> | null = null;

  for (const match of formed) {
    const allowedPlayerIds = match.players.map((p) => p.playerId);
    const matchVariant = match.players[0]?.variant ?? selectedVariant;
    let roomId: string | undefined;
    if (match.mode === 'uno') {
      try {
        const created = await matchMaker.createRoom('uno', {
          maxPlayers: match.players.length,
          ranked: match.ranked,
          fillWithBots: false,
          variant: matchVariant,
          matchmade: true,
          allowedPlayerIds,
        });
        roomId = created.roomId;
      } catch {
        // Fallback when running HTTP-only unit tests without Colyseus server booted
      }
    }

    for (const member of match.players) {
      clearFallbackTimer(member.ticketId);
      await removeRedisQueueMembers(match.mode, match.ranked, [member.playerId]);
      await cacheMatchmakingTicket(member.ticketId, {
        status: 'matched',
        matchType: 'human',
        matchId: match.matchId,
        ...(roomId ? { roomId } : {}),
        allowedPlayerIds,
        mode: match.mode,
        ranked: match.ranked,
        averageMMR: match.averageMMR,
        players: match.players.map((p) => ({ playerId: p.playerId, username: p.username })),
      });
    }

    if (match.players.some((p) => p.playerId === playerId)) {
      matchedResponse = {
        ...match,
        matchType: 'human',
        allowedPlayerIds,
        ...(roomId ? { roomId } : {}),
      };
    }
  }

  if (!matchedResponse) {
    const timer = setTimeout(() => {
      fallbackTimers.delete(ticket.ticketId);
      void runServerBotFallback(playerId, ticket.ticketId);
    }, fallbackDelayMs);
    timer.unref();
    fallbackTimers.set(ticket.ticketId, timer);
  }

  res.status(200).json({
    ticket,
    effectivePartyMmr: effectiveMmr,
    disparity,
    matched: matchedResponse,
    queueSize: matchmakingQueue.size(),
  });
});

matchmakingRouter.get('/status/:ticketId', authRequired, statusLimiter, async (req, res) => {
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
  if (typeof ticket['playerId'] === 'string' && ticket['playerId'] !== req.user!.sub) {
    res.status(403).json({ error: 'Ticket non appartenente a questo giocatore' });
    return;
  }

  res.status(200).json(ticket);
});

matchmakingRouter.delete('/cancel', authRequired, cancelLimiter, async (req, res) => {
  const playerId = req.user!.sub;
  const removed = matchmakingQueue.cancelAndGetTicket(playerId);
  const queryMode = (GAME_MODES as readonly string[]).includes(String(req.query['mode']))
    ? (req.query['mode'] as GameMode)
    : 'uno';
  if (removed) {
    clearFallbackTimer(removed.ticketId);
    await cacheMatchmakingTicket(removed.ticketId, {
      status: 'cancelled',
      ticketId: removed.ticketId,
      playerId,
      mode: removed.mode,
      ranked: removed.ranked,
    });
  }
  await removeRedisQueueMembers(
    removed?.mode ?? queryMode,
    removed?.ranked ?? req.query['ranked'] === 'true',
    [playerId],
  );
  res.status(200).json({
    cancelled: Boolean(removed),
    ...(removed ? { ticketId: removed.ticketId } : {}),
  });
});

export async function recoverOrphanedMatchmakingTickets(): Promise<number> {
  const searching = await listSearchingMatchmakingTickets();
  const now = Date.now();
  let recovered = 0;

  for (const t of searching) {
    const ticketId = typeof t['ticketId'] === 'string' ? t['ticketId'] : '';
    const playerId = typeof t['playerId'] === 'string' ? t['playerId'] : '';
    if (!ticketId || !playerId || fallbackTimers.has(ticketId)) continue;

    const mode = (GAME_MODES as readonly string[]).includes(String(t['mode']))
      ? (t['mode'] as GameMode)
      : 'uno';
    const ranked = Boolean(t['ranked']);
    const fallbackAtMs = typeof t['fallbackAtMs'] === 'number' ? t['fallbackAtMs'] : 0;

    if (fallbackAtMs > now) {
      const mmr = typeof t['mmr'] === 'number' ? t['mmr'] : 0;
      const targetPlayers = typeof t['targetPlayers'] === 'number' ? t['targetPlayers'] : 4;
      const variant = typeof t['variant'] === 'string' ? t['variant'] : 'standard';
      matchmakingQueue.enqueue({
        ticketId,
        playerId,
        username: typeof t['username'] === 'string' ? t['username'] : `Player_${playerId.slice(0, 6)}`,
        mode,
        ranked,
        mmr,
        targetPlayers,
        variant,
        fallbackAtMs,
      });
      const remainingMs = Math.max(20, fallbackAtMs - now);
      const timer = setTimeout(() => {
        fallbackTimers.delete(ticketId);
        void runServerBotFallback(playerId, ticketId);
      }, remainingMs);
      timer.unref();
      fallbackTimers.set(ticketId, timer);
    } else {
      await claimRedisQueueMember(mode, ranked, playerId);
      await cacheMatchmakingTicket(ticketId, {
        ...t,
        status: 'cancelled',
        reason: 'server_restarted_expired',
      });
    }
    recovered += 1;
  }

  return recovered;
}
