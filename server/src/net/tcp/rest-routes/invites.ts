// ============================================================
// UNO ULTRA Server — Party Invites REST Routes (online + offline)
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../../auth/middleware.js';
import {
  INVITE_RATE_LIMIT_PER_MINUTE,
  isBlockedBy,
} from '../../../persistence/postgres/repositories/friends.js';
import {
  findPlayerById,
  findPlayerByUsername,
} from '../../../persistence/postgres/repositories/players.js';
import { createPartyInviteNotification } from '../../../persistence/postgres/repositories/notifications.js';
import { presenceService } from '../../../rooms/base/presence.js';
import { createRateLimiter } from '../../../security/rate-limiter.js';
import { logger } from '../../../config/logger.js';

export const invitesRouter = Router();

const inviteLimiter = createRateLimiter({
  scope: 'invite',
  max: INVITE_RATE_LIMIT_PER_MINUTE,
  windowSeconds: 60,
  keyFn: (req) => req.user?.sub ?? req.ip ?? 'anon',
});

const SendInviteSchema = z
  .object({
    targetPlayerId: z.string().min(1).optional(),
    targetUsername: z.string().trim().min(3).max(20).optional(),
    roomId: z.string().min(1).max(64),
    mode: z.string().min(1).max(32),
  })
  .refine((d) => Boolean(d.targetPlayerId || d.targetUsername), {
    message: 'Specificare targetPlayerId o targetUsername',
  });

invitesRouter.post('/send', authRequired, inviteLimiter, async (req, res) => {
  const me = req.user?.sub;
  const myUsername = req.user?.username ?? 'Giocatore';
  if (!me) {
    res.status(401).json({ error: 'Non autenticato' });
    return;
  }

  const parsed = SendInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dati invito non validi' });
    return;
  }

  try {
    const target = parsed.data.targetPlayerId
      ? await findPlayerById(parsed.data.targetPlayerId)
      : await findPlayerByUsername(parsed.data.targetUsername!);

    if (!target) {
      res.status(404).json({ error: 'Giocatore destinatario non trovato' });
      return;
    }
    if (target.id === me) {
      res.status(400).json({ error: 'Non puoi invitare te stesso' });
      return;
    }

    const [blockedTarget, blockedSender] = await Promise.all([
      isBlockedBy(me, target.id),
      isBlockedBy(target.id, me),
    ]);
    if (blockedTarget || blockedSender) {
      res.status(403).json({ error: 'Impossibile invitare questo giocatore' });
      return;
    }

    const notif = await createPartyInviteNotification(
      target.id,
      me,
      myUsername,
      parsed.data.roomId,
      parsed.data.mode
    );

    const status = await presenceService.getStatus(target.id);
    res.status(201).json({
      inviteId: notif.id,
      deliveredOnline: status !== 'offline',
      expiresAt: notif.expires_at ? notif.expires_at.toISOString() : null,
    });
  } catch (err) {
    logger.error({ err }, 'Error sending party invite');
    res.status(500).json({ error: 'Errore interno nell invio invito' });
  }
});
