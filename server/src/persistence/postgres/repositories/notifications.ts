// ============================================================
// UNO ULTRA Server — Notifications Repository (persistent TTL 24h)
// ============================================================

import { query } from '../client.js';

export const INVITE_NOTIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'party_invite'
  | 'system';

export interface NotificationRow {
  id: string;
  recipient_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
}

export async function createNotification(
  recipientId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
  expiresAt?: Date
): Promise<NotificationRow> {
  const res = await query<NotificationRow>(
    `INSERT INTO notifications (recipient_id, type, payload, expires_at)
     VALUES ($1, $2, $3::jsonb, $4)
     RETURNING id, recipient_id, type, payload, read_at, expires_at, created_at`,
    [recipientId, type, JSON.stringify(payload), expiresAt ?? null]
  );
  const row = res.rows[0];
  if (!row) {
    throw new Error('Failed to create notification');
  }
  return row;
}

export async function listUnread(recipientId: string): Promise<NotificationRow[]> {
  const res = await query<NotificationRow>(
    `SELECT id, recipient_id, type, payload, read_at, expires_at, created_at
       FROM notifications
      WHERE recipient_id = $1
        AND read_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC`,
    [recipientId]
  );
  return res.rows;
}

export async function markRead(notificationId: string, recipientId: string): Promise<void> {
  await query(
    `UPDATE notifications
        SET read_at = NOW()
      WHERE id = $1
        AND recipient_id = $2
        AND read_at IS NULL`,
    [notificationId, recipientId]
  );
}

export async function purgeExpired(): Promise<number> {
  const res = await query(
    `DELETE FROM notifications
      WHERE expires_at IS NOT NULL
        AND expires_at <= NOW()`
  );
  return res.rowCount ?? 0;
}

export async function createFriendRequestNotification(
  recipientId: string,
  fromPlayerId: string,
  fromUsername: string,
  requestId: string
): Promise<NotificationRow> {
  return createNotification(recipientId, 'friend_request', {
    fromPlayerId,
    fromUsername,
    requestId,
  });
}

export async function createPartyInviteNotification(
  recipientId: string,
  fromPlayerId: string,
  fromUsername: string,
  roomId: string,
  mode: string,
  ttlMs: number = INVITE_NOTIFICATION_TTL_MS
): Promise<NotificationRow> {
  const expiresAt = new Date(Date.now() + ttlMs);
  return createNotification(
    recipientId,
    'party_invite',
    {
      fromPlayerId,
      fromUsername,
      roomId,
      mode,
    },
    expiresAt
  );
}
