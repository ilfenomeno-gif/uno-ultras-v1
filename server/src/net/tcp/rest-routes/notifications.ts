// ============================================================
// UNO ULTRA Server — Notifications REST Routes
// ============================================================

import { Router } from 'express';
import { authRequired } from '../../../auth/middleware.js';
import {
  listUnread,
  markRead,
} from '../../../persistence/postgres/repositories/notifications.js';
import { logger } from '../../../config/logger.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', authRequired, async (req, res) => {
  const me = req.user?.sub;
  if (!me) {
    res.status(401).json({ error: 'Non autenticato' });
    return;
  }

  try {
    const rows = await listUnread(me);
    res.status(200).json({
      items: rows.map((r) => ({
        id: r.id,
        type: r.type,
        payload: r.payload,
        createdAt: r.created_at.toISOString(),
        expiresAt: r.expires_at ? r.expires_at.toISOString() : null,
      })),
    });
  } catch (err) {
    logger.error({ err }, 'Error listing notifications');
    res.status(500).json({ error: 'Errore interno nel recupero notifiche' });
  }
});

notificationsRouter.post('/:id/read', authRequired, async (req, res) => {
  const me = req.user?.sub;
  const id = req.params['id'];
  if (!me) {
    res.status(401).json({ error: 'Non autenticato' });
    return;
  }
  if (!id) {
    res.status(400).json({ error: 'ID notifica mancante' });
    return;
  }

  try {
    await markRead(id, me);
    res.status(200).json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'Error marking notification as read');
    res.status(500).json({ error: 'Errore interno nell aggiornamento notifica' });
  }
});
