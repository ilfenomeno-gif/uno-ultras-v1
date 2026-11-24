// ============================================================
// UNO ULTRA Server — Friends & Blocks REST Routes
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../../auth/middleware.js';
import {
  FRIEND_REQUEST_RATE_LIMIT_PER_DAY,
  acceptFriendRequest,
  createBlock,
  createFriendRequest,
  deleteBlock,
  deleteFriend,
  listBlocked,
  listFriends,
  listPendingIncoming,
  rejectFriendRequest,
} from '../../../persistence/postgres/repositories/friends.js';
import {
  findPlayerById,
  findPlayerByUsername,
} from '../../../persistence/postgres/repositories/players.js';
import {
  createFriendRequestNotification,
  createNotification,
} from '../../../persistence/postgres/repositories/notifications.js';
import { presenceService } from '../../../rooms/base/presence.js';
import { createRateLimiter } from '../../../security/rate-limiter.js';
import { logger } from '../../../config/logger.js';

export const friendsRouter = Router();

const friendRequestLimiter = createRateLimiter({
  scope: 'friend-req',
  max: FRIEND_REQUEST_RATE_LIMIT_PER_DAY,
  windowSeconds: 86_400,
  keyFn: (req) => req.user?.sub ?? req.ip ?? 'anon',
});

const FriendRequestBodySchema = z.object({
  targetUsername: z.string().trim().min(3).max(20),
});

const RespondBodySchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(['accept', 'reject']),
});

const BlockBodySchema = z
  .object({
    targetPlayerId: z.string().min(1).optional(),
    targetUsername: z.string().trim().min(3).max(20).optional(),
  })
  .refine((d) => Boolean(d.targetPlayerId || d.targetUsername), {
    message: 'Specificare targetPlayerId o targetUsername',
  });

friendsRouter.get('/', authRequired, async (req, res) => {
  const me = req.user?.sub;
  if (!me) {
    res.status(401).json({ error: 'Non autenticato' });
    return;
  }

  try {
    const [friends, pendingIncoming, blocked] = await Promise.all([
      listFriends(me),
      listPendingIncoming(me),
      listBlocked(me),
    ]);

    const presenceMap = await presenceService.listFriendsPresence(
      friends.map((f) => f.playerId)
    );

    const online: Array<{
      friendshipId: string;
      playerId: string;
      username: string;
      rankTier: string;
      mmr: number;
      presenceStatus: 'online' | 'ingame';
    }> = [];
    const offline: Array<{
      friendshipId: string;
      playerId: string;
      username: string;
      rankTier: string;
      mmr: number;
      presenceStatus: 'offline';
    }> = [];

    for (const f of friends) {
      const status = presenceMap.get(f.playerId) ?? 'offline';
      const base = {
        friendshipId: f.friendshipId,
        playerId: f.playerId,
        username: f.username,
        rankTier: f.rankTier,
        mmr: f.mmr,
      };
      if (status === 'online' || status === 'ingame') {
        online.push({ ...base, presenceStatus: status });
      } else {
        offline.push({ ...base, presenceStatus: 'offline' });
      }
    }

    res.status(200).json({
      online,
      offline,
      pendingIncoming: pendingIncoming.map((p) => ({
        requestId: p.requestId,
        playerId: p.playerId,
        username: p.username,
        rankTier: p.rankTier,
        mmr: p.mmr,
        createdAt: p.createdAt.toISOString(),
      })),
      blocked: blocked.map((b) => ({
        playerId: b.playerId,
        username: b.username,
        blockedAt: b.blockedAt.toISOString(),
      })),
    });
  } catch (err) {
    logger.error({ err }, 'Error loading friends list');
    res.status(500).json({ error: 'Errore interno nel recupero amici' });
  }
});

friendsRouter.post('/request', authRequired, friendRequestLimiter, async (req, res) => {
  const me = req.user?.sub;
  const myUsername = req.user?.username ?? 'Giocatore';
  if (!me) {
    res.status(401).json({ error: 'Non autenticato' });
    return;
  }

  const parsed = FriendRequestBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Username destinatario non valido' });
    return;
  }

  try {
    const target = await findPlayerByUsername(parsed.data.targetUsername);
    if (!target) {
      res.status(404).json({ error: 'Giocatore non trovato' });
      return;
    }
    if (target.id === me) {
      res.status(400).json({ error: 'Non puoi aggiungere te stesso agli amici' });
      return;
    }

    const row = await createFriendRequest(me, target.id);
    if (row.status === 'pending') {
      await createFriendRequestNotification(target.id, me, myUsername, row.id);
    } else if (row.status === 'accepted') {
      await createNotification(target.id, 'friend_accepted', {
        fromPlayerId: me,
        fromUsername: myUsername,
      });
    }

    res.status(201).json({
      friendshipId: row.id,
      status: row.status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.toLowerCase().includes('bloccato')) {
      res.status(403).json({ error: 'Operazione non consentita: utente bloccato' });
      return;
    }
    logger.error({ err }, 'Error creating friend request');
    res.status(500).json({ error: 'Errore interno nella richiesta di amicizia' });
  }
});

friendsRouter.post('/respond', authRequired, async (req, res) => {
  const me = req.user?.sub;
  const myUsername = req.user?.username ?? 'Giocatore';
  if (!me) {
    res.status(401).json({ error: 'Non autenticato' });
    return;
  }

  const parsed = RespondBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload risposta non valido' });
    return;
  }

  try {
    if (parsed.data.action === 'accept') {
      const updated = await acceptFriendRequest(parsed.data.requestId, me);
      await createNotification(updated.requester_id, 'friend_accepted', {
        fromPlayerId: me,
        fromUsername: myUsername,
      });
      res.status(200).json({ status: updated.status });
      return;
    }

    await rejectFriendRequest(parsed.data.requestId, me);
    res.status(200).json({ status: 'rejected' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('non trovata')) {
      res.status(404).json({ error: msg });
      return;
    }
    logger.error({ err }, 'Error responding to friend request');
    res.status(500).json({ error: 'Errore interno nella risposta alla richiesta' });
  }
});

friendsRouter.delete('/:friendId', authRequired, async (req, res) => {
  const me = req.user?.sub;
  const friendId = req.params['friendId'];
  if (!me) {
    res.status(401).json({ error: 'Non autenticato' });
    return;
  }
  if (!friendId) {
    res.status(400).json({ error: 'friendId mancante' });
    return;
  }

  try {
    await deleteFriend(me, friendId);
    res.status(200).json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'Error removing friend');
    res.status(500).json({ error: 'Errore interno nella rimozione amico' });
  }
});

friendsRouter.post('/block', authRequired, async (req, res) => {
  const me = req.user?.sub;
  if (!me) {
    res.status(401).json({ error: 'Non autenticato' });
    return;
  }

  const parsed = BlockBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Specificare un giocatore valido da bloccare' });
    return;
  }

  try {
    const target = parsed.data.targetPlayerId
      ? await findPlayerById(parsed.data.targetPlayerId)
      : await findPlayerByUsername(parsed.data.targetUsername!);

    if (!target) {
      res.status(404).json({ error: 'Giocatore non trovato' });
      return;
    }
    if (target.id === me) {
      res.status(400).json({ error: 'Non puoi bloccare te stesso' });
      return;
    }

    await createBlock(me, target.id);
    res.status(200).json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'Error blocking player');
    res.status(500).json({ error: 'Errore interno nel blocco giocatore' });
  }
});

friendsRouter.delete('/block/:blockedId', authRequired, async (req, res) => {
  const me = req.user?.sub;
  const blockedId = req.params['blockedId'];
  if (!me) {
    res.status(401).json({ error: 'Non autenticato' });
    return;
  }
  if (!blockedId) {
    res.status(400).json({ error: 'blockedId mancante' });
    return;
  }

  try {
    await deleteBlock(me, blockedId);
    res.status(200).json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'Error unblocking player');
    res.status(500).json({ error: 'Errore interno nello sblocco giocatore' });
  }
});
