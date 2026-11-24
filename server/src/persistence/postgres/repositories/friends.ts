// ============================================================
// UNO ULTRA Server — Friends & Blocks Repository (ACID SQL)
// ============================================================

import { getPostgresPool, query } from '../client.js';

export const FRIEND_REQUEST_RATE_LIMIT_PER_DAY = 20;
export const INVITE_RATE_LIMIT_PER_MINUTE = 5;

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';
export type FriendRelationStatus = 'none' | 'pending' | 'accepted' | 'blocked';

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: Date;
  updated_at: Date;
}

export interface FriendRecord {
  friendshipId: string;
  playerId: string;
  username: string;
  rankTier: string;
  mmr: number;
  since: Date;
}

interface FriendJoinRow {
  friendship_id: string;
  friend_id: string;
  username: string;
  rank_tier: string;
  mmr: number;
  updated_at: Date;
}

export async function listFriends(playerId: string): Promise<FriendRecord[]> {
  const res = await query<FriendJoinRow>(
    `SELECT f.id AS friendship_id,
            p.id AS friend_id,
            p.username,
            p.rank_tier,
            p.mmr,
            f.updated_at
       FROM friendships f
       JOIN players p
         ON p.id = CASE
                     WHEN f.requester_id = $1 THEN f.addressee_id
                     ELSE f.requester_id
                   END
      WHERE (f.requester_id = $1 OR f.addressee_id = $1)
        AND f.status = 'accepted'
        AND p.deleted_at IS NULL
      ORDER BY p.username ASC`,
    [playerId]
  );

  return res.rows.map((r) => ({
    friendshipId: r.friendship_id,
    playerId: r.friend_id,
    username: r.username,
    rankTier: r.rank_tier,
    mmr: r.mmr,
    since: r.updated_at,
  }));
}

export async function isBlockedBy(blockedId: string, blockerId: string): Promise<boolean> {
  const res = await query<{ blocker_id: string }>(
    `SELECT blocker_id
       FROM blocks
      WHERE blocker_id = $1
        AND blocked_id = $2
      LIMIT 1`,
    [blockerId, blockedId]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function getFriendStatus(a: string, b: string): Promise<FriendRelationStatus> {
  if (a === b) return 'none';

  const blockedRes = await query<{ blocker_id: string }>(
    `SELECT blocker_id
       FROM blocks
      WHERE (blocker_id = $1 AND blocked_id = $2)
         OR (blocker_id = $2 AND blocked_id = $1)
      LIMIT 1`,
    [a, b]
  );
  if ((blockedRes.rowCount ?? 0) > 0) {
    return 'blocked';
  }

  const res = await query<{ status: FriendshipStatus }>(
    `SELECT status
       FROM friendships
      WHERE (requester_id = $1 AND addressee_id = $2)
         OR (requester_id = $2 AND addressee_id = $1)
      LIMIT 1`,
    [a, b]
  );
  const status = res.rows[0]?.status;
  if (status === 'accepted' || status === 'pending' || status === 'blocked') {
    return status;
  }
  return 'none';
}

export async function createFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<FriendshipRow> {
  if (requesterId === addresseeId) {
    throw new Error('Non puoi inviare una richiesta di amicizia a te stesso');
  }

  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');

    const blockCheck = await client.query<{ blocker_id: string }>(
      `SELECT blocker_id
         FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = $2)
           OR (blocker_id = $2 AND blocked_id = $1)
        LIMIT 1`,
      [requesterId, addresseeId]
    );
    if ((blockCheck.rowCount ?? 0) > 0) {
      throw new Error('Operazione non consentita: utente bloccato');
    }

    // Lock della coppia (in entrambe le direzioni) per prevenire race incrociate
    const existingRes = await client.query<FriendshipRow>(
      `SELECT id, requester_id, addressee_id, status, created_at, updated_at
         FROM friendships
        WHERE (requester_id = $1 AND addressee_id = $2)
           OR (requester_id = $2 AND addressee_id = $1)
        FOR UPDATE`,
      [requesterId, addresseeId]
    );

    const existing = existingRes.rows[0];
    if (existing) {
      if (existing.status === 'accepted') {
        await client.query('COMMIT');
        return existing;
      }
      if (existing.status === 'pending') {
        if (existing.requester_id === addresseeId && existing.addressee_id === requesterId) {
          // Richiesta inversa già pendente -> auto-accept atomico
          const acceptedRes = await client.query<FriendshipRow>(
            `UPDATE friendships
                SET status = 'accepted', updated_at = NOW()
              WHERE id = $1
              RETURNING id, requester_id, addressee_id, status, created_at, updated_at`,
            [existing.id]
          );
          await client.query('COMMIT');
          return acceptedRes.rows[0]!;
        }
        await client.query('COMMIT');
        return existing;
      }
      // Se in precedenza era 'rejected', riapre come nuova richiesta da requesterId
      const reopenedRes = await client.query<FriendshipRow>(
        `UPDATE friendships
            SET requester_id = $2,
                addressee_id = $3,
                status = 'pending',
                updated_at = NOW()
          WHERE id = $1
          RETURNING id, requester_id, addressee_id, status, created_at, updated_at`,
        [existing.id, requesterId, addresseeId]
      );
      await client.query('COMMIT');
      return reopenedRes.rows[0]!;
    }

    const insertRes = await client.query<FriendshipRow>(
      `INSERT INTO friendships (requester_id, addressee_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, requester_id, addressee_id, status, created_at, updated_at`,
      [requesterId, addresseeId]
    );
    await client.query('COMMIT');
    return insertRes.rows[0]!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function acceptFriendRequest(
  requestId: string,
  addresseeId: string
): Promise<FriendshipRow> {
  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query<FriendshipRow>(
      `SELECT id, requester_id, addressee_id, status, created_at, updated_at
         FROM friendships
        WHERE id = $1
          AND addressee_id = $2
        FOR UPDATE`,
      [requestId, addresseeId]
    );

    const row = existing.rows[0];
    if (!row || row.status !== 'pending') {
      throw new Error('Richiesta di amicizia non trovata o non più pendente');
    }

    const updated = await client.query<FriendshipRow>(
      `UPDATE friendships
          SET status = 'accepted', updated_at = NOW()
        WHERE id = $1
        RETURNING id, requester_id, addressee_id, status, created_at, updated_at`,
      [requestId]
    );
    await client.query('COMMIT');
    return updated.rows[0]!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function rejectFriendRequest(
  requestId: string,
  addresseeId: string
): Promise<void> {
  const res = await query(
    `UPDATE friendships
        SET status = 'rejected', updated_at = NOW()
      WHERE id = $1
        AND addressee_id = $2
        AND status = 'pending'`,
    [requestId, addresseeId]
  );
  if ((res.rowCount ?? 0) === 0) {
    throw new Error('Richiesta di amicizia non trovata o non più pendente');
  }
}

export async function deleteFriend(a: string, b: string): Promise<void> {
  await query(
    `DELETE FROM friendships
      WHERE (requester_id = $1 AND addressee_id = $2)
         OR (requester_id = $2 AND addressee_id = $1)`,
    [a, b]
  );
}

export async function createBlock(blockerId: string, blockedId: string): Promise<void> {
  if (blockerId === blockedId) {
    throw new Error('Non puoi bloccare te stesso');
  }

  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    // Rimuove eventuali amicizie o richieste pendenti tra i due utenti
    await client.query(
      `DELETE FROM friendships
        WHERE (requester_id = $1 AND addressee_id = $2)
           OR (requester_id = $2 AND addressee_id = $1)`,
      [blockerId, blockedId]
    );
    await client.query(
      `INSERT INTO blocks (blocker_id, blocked_id)
       VALUES ($1, $2)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
      [blockerId, blockedId]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteBlock(blockerId: string, blockedId: string): Promise<void> {
  await query(
    `DELETE FROM blocks
      WHERE blocker_id = $1
        AND blocked_id = $2`,
    [blockerId, blockedId]
  );
}

export interface PendingRequestRecord {
  requestId: string;
  playerId: string;
  username: string;
  rankTier: string;
  mmr: number;
  createdAt: Date;
}

interface PendingJoinRow {
  request_id: string;
  player_id: string;
  username: string;
  rank_tier: string;
  mmr: number;
  created_at: Date;
}

export async function listPendingIncoming(
  playerId: string
): Promise<PendingRequestRecord[]> {
  const res = await query<PendingJoinRow>(
    `SELECT f.id AS request_id,
            p.id AS player_id,
            p.username,
            p.rank_tier,
            p.mmr,
            f.created_at
       FROM friendships f
       JOIN players p ON p.id = f.requester_id
      WHERE f.addressee_id = $1
        AND f.status = 'pending'
        AND p.deleted_at IS NULL
      ORDER BY f.created_at DESC`,
    [playerId]
  );

  return res.rows.map((r) => ({
    requestId: r.request_id,
    playerId: r.player_id,
    username: r.username,
    rankTier: r.rank_tier,
    mmr: r.mmr,
    createdAt: r.created_at,
  }));
}

export interface BlockedUserRecord {
  playerId: string;
  username: string;
  blockedAt: Date;
}

interface BlockedJoinRow {
  player_id: string;
  username: string;
  created_at: Date;
}

export async function listBlocked(playerId: string): Promise<BlockedUserRecord[]> {
  const res = await query<BlockedJoinRow>(
    `SELECT p.id AS player_id,
            p.username,
            b.created_at
       FROM blocks b
       JOIN players p ON p.id = b.blocked_id
      WHERE b.blocker_id = $1
        AND p.deleted_at IS NULL
      ORDER BY b.created_at DESC`,
    [playerId]
  );

  return res.rows.map((r) => ({
    playerId: r.player_id,
    username: r.username,
    blockedAt: r.created_at,
  }));
}
