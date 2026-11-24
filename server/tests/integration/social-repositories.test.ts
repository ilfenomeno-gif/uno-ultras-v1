// ============================================================
// UNO ULTRA Server — Integration tests: Social DB & Repositories
// ============================================================

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory PostgreSQL simulation matching 0003_social.sql constraints
interface MemPlayer {
  id: string;
  username: string;
  rank_tier: string;
  mmr: number;
  deleted_at: Date | null;
}

interface MemFriendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: Date;
  updated_at: Date;
}

interface MemBlock {
  blocker_id: string;
  blocked_id: string;
  created_at: Date;
}

interface MemNotification {
  id: string;
  recipient_id: string;
  type: 'friend_request' | 'friend_accepted' | 'party_invite' | 'system';
  payload: Record<string, unknown>;
  read_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
}

const memDb = {
  players: new Map<string, MemPlayer>([
    ['u-alice', { id: 'u-alice', username: 'Alice', rank_tier: 'Bronze I', mmr: 0, deleted_at: null }],
    ['u-bob', { id: 'u-bob', username: 'Bob', rank_tier: 'Silver I', mmr: 420, deleted_at: null }],
    ['u-carol', { id: 'u-carol', username: 'Carol', rank_tier: 'Gold I', mmr: 650, deleted_at: null }],
  ]),
  friendships: [] as MemFriendship[],
  blocks: [] as MemBlock[],
  notifications: [] as MemNotification[],
};

function executeSql(sql: string, params: unknown[] = []) {
  const s = sql.replace(/\s+/g, ' ').trim();

  if (s === 'BEGIN' || s === 'COMMIT' || s === 'ROLLBACK') {
    return { rows: [], rowCount: 0 };
  }

  // BLOCKS
  if (s.startsWith('SELECT blocker_id FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR')) {
    const [a, b] = params as [string, string];
    const found = memDb.blocks.filter(
      (bl) => (bl.blocker_id === a && bl.blocked_id === b) || (bl.blocker_id === b && bl.blocked_id === a)
    );
    return { rows: found.slice(0, 1), rowCount: found.length > 0 ? 1 : 0 };
  }
  if (s.startsWith('SELECT blocker_id FROM blocks WHERE blocker_id = $1 AND blocked_id = $2')) {
    const [blocker, blocked] = params as [string, string];
    const found = memDb.blocks.filter((bl) => bl.blocker_id === blocker && bl.blocked_id === blocked);
    return { rows: found.slice(0, 1), rowCount: found.length > 0 ? 1 : 0 };
  }
  if (s.startsWith('INSERT INTO blocks')) {
    const [blocker, blocked] = params as [string, string];
    if (!memDb.blocks.some((bl) => bl.blocker_id === blocker && bl.blocked_id === blocked)) {
      memDb.blocks.push({ blocker_id: blocker, blocked_id: blocked, created_at: new Date() });
    }
    return { rows: [], rowCount: 1 };
  }
  if (s.startsWith('DELETE FROM blocks')) {
    const [blocker, blocked] = params as [string, string];
    const before = memDb.blocks.length;
    memDb.blocks = memDb.blocks.filter((bl) => !(bl.blocker_id === blocker && bl.blocked_id === blocked));
    return { rows: [], rowCount: before - memDb.blocks.length };
  }

  // FRIENDSHIPS
  if (s.startsWith('DELETE FROM friendships')) {
    const [a, b] = params as [string, string];
    const before = memDb.friendships.length;
    memDb.friendships = memDb.friendships.filter(
      (f) => !((f.requester_id === a && f.addressee_id === b) || (f.requester_id === b && f.addressee_id === a))
    );
    return { rows: [], rowCount: before - memDb.friendships.length };
  }
  if (s.startsWith('SELECT status FROM friendships WHERE')) {
    const [a, b] = params as [string, string];
    const found = memDb.friendships.find(
      (f) => (f.requester_id === a && f.addressee_id === b) || (f.requester_id === b && f.addressee_id === a)
    );
    return { rows: found ? [{ status: found.status }] : [], rowCount: found ? 1 : 0 };
  }
  if (s.includes('FROM friendships WHERE (requester_id = $1 AND addressee_id = $2) OR')) {
    const [a, b] = params as [string, string];
    const found = memDb.friendships.find(
      (f) => (f.requester_id === a && f.addressee_id === b) || (f.requester_id === b && f.addressee_id === a)
    );
    return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
  }
  if (s.includes('FROM friendships WHERE id = $1 AND addressee_id = $2')) {
    const [id, addr] = params as [string, string];
    const found = memDb.friendships.find((f) => f.id === id && f.addressee_id === addr);
    return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
  }
  if (s.startsWith('INSERT INTO friendships')) {
    const [req, addr] = params as [string, string];
    const now = new Date();
    const row: MemFriendship = {
      id: crypto.randomUUID(),
      requester_id: req,
      addressee_id: addr,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };
    memDb.friendships.push(row);
    return { rows: [row], rowCount: 1 };
  }
  if (s.startsWith("UPDATE friendships SET status = 'accepted'")) {
    const [id] = params as [string];
    const row = memDb.friendships.find((f) => f.id === id);
    if (!row) return { rows: [], rowCount: 0 };
    row.status = 'accepted';
    row.updated_at = new Date();
    return { rows: [row], rowCount: 1 };
  }
  if (s.startsWith('UPDATE friendships SET requester_id = $2')) {
    const [id, req, addr] = params as [string, string, string];
    const row = memDb.friendships.find((f) => f.id === id);
    if (!row) return { rows: [], rowCount: 0 };
    row.requester_id = req;
    row.addressee_id = addr;
    row.status = 'pending';
    row.updated_at = new Date();
    return { rows: [row], rowCount: 1 };
  }
  if (s.startsWith("UPDATE friendships SET status = 'rejected'")) {
    const [id, addr] = params as [string, string];
    const row = memDb.friendships.find(
      (f) => f.id === id && f.addressee_id === addr && f.status === 'pending'
    );
    if (!row) return { rows: [], rowCount: 0 };
    row.status = 'rejected';
    row.updated_at = new Date();
    return { rows: [], rowCount: 1 };
  }
  if (s.startsWith('SELECT f.id AS friendship_id')) {
    const [pid] = params as [string];
    const rows = memDb.friendships
      .filter((f) => (f.requester_id === pid || f.addressee_id === pid) && f.status === 'accepted')
      .map((f) => {
        const otherId = f.requester_id === pid ? f.addressee_id : f.requester_id;
        const p = memDb.players.get(otherId)!;
        return {
          friendship_id: f.id,
          friend_id: p.id,
          username: p.username,
          rank_tier: p.rank_tier,
          mmr: p.mmr,
          updated_at: f.updated_at,
        };
      });
    return { rows, rowCount: rows.length };
  }

  // NOTIFICATIONS
  if (s.startsWith('INSERT INTO notifications')) {
    const [recipientId, type, payloadJson, expiresAt] = params as [
      string,
      MemNotification['type'],
      string,
      Date | null,
    ];
    const row: MemNotification = {
      id: crypto.randomUUID(),
      recipient_id: recipientId,
      type,
      payload: JSON.parse(payloadJson) as Record<string, unknown>,
      read_at: null,
      expires_at: expiresAt,
      created_at: new Date(),
    };
    memDb.notifications.push(row);
    return { rows: [row], rowCount: 1 };
  }
  if (s.startsWith('SELECT id, recipient_id, type, payload, read_at, expires_at, created_at FROM notifications')) {
    const [recipientId] = params as [string];
    const now = Date.now();
    const rows = memDb.notifications.filter(
      (n) =>
        n.recipient_id === recipientId &&
        n.read_at === null &&
        (n.expires_at === null || n.expires_at.getTime() > now)
    );
    return { rows, rowCount: rows.length };
  }
  if (s.startsWith('UPDATE notifications SET read_at = NOW()')) {
    const [id, recipientId] = params as [string, string];
    const row = memDb.notifications.find(
      (n) => n.id === id && n.recipient_id === recipientId && n.read_at === null
    );
    if (!row) return { rows: [], rowCount: 0 };
    row.read_at = new Date();
    return { rows: [], rowCount: 1 };
  }
  if (s.startsWith('DELETE FROM notifications WHERE expires_at IS NOT NULL')) {
    const now = Date.now();
    const before = memDb.notifications.length;
    memDb.notifications = memDb.notifications.filter(
      (n) => !(n.expires_at !== null && n.expires_at.getTime() <= now)
    );
    return { rows: [], rowCount: before - memDb.notifications.length };
  }

  throw new Error(`Unhandled SQL in mock: ${s}`);
}

vi.mock('../../src/persistence/postgres/client.js', () => ({
  query: async (sql: string, params: unknown[] = []) => executeSql(sql, params),
  getPostgresPool: () => ({
    connect: async () => ({
      query: async (sql: string, params: unknown[] = []) => executeSql(sql, params),
      release: () => undefined,
    }),
  }),
}));

import {
  acceptFriendRequest,
  createBlock,
  createFriendRequest,
  deleteFriend,
  getFriendStatus,
  isBlockedBy,
  listFriends,
} from '../../src/persistence/postgres/repositories/friends.js';
import {
  INVITE_NOTIFICATION_TTL_MS,
  createFriendRequestNotification,
  createNotification,
  createPartyInviteNotification,
  listUnread,
  markRead,
  purgeExpired,
} from '../../src/persistence/postgres/repositories/notifications.js';

describe('Social Repositories & 0003_social.sql (IMP-006a)', () => {
  beforeEach(() => {
    memDb.friendships = [];
    memDb.blocks = [];
    memDb.notifications = [];
  });

  it('createFriendRequest crea richiesta in stato pending', async () => {
    const row = await createFriendRequest('u-alice', 'u-bob');
    expect(row.status).toBe('pending');
    expect(row.requester_id).toBe('u-alice');
    expect(row.addressee_id).toBe('u-bob');
    expect(await getFriendStatus('u-alice', 'u-bob')).toBe('pending');
  });

  it('acceptFriendRequest passa a accepted e listFriends espone entrambe le direzioni', async () => {
    const req = await createFriendRequest('u-alice', 'u-bob');
    const accepted = await acceptFriendRequest(req.id, 'u-bob');
    expect(accepted.status).toBe('accepted');

    const aliceFriends = await listFriends('u-alice');
    const bobFriends = await listFriends('u-bob');
    expect(aliceFriends.map((f) => f.playerId)).toEqual(['u-bob']);
    expect(bobFriends.map((f) => f.playerId)).toEqual(['u-alice']);

    await deleteFriend('u-alice', 'u-bob');
    expect(await listFriends('u-alice')).toHaveLength(0);
  });

  it('richiesta incrociata (A->B poi B->A) attiva auto-accept senza duplicati', async () => {
    const first = await createFriendRequest('u-alice', 'u-bob');
    expect(first.status).toBe('pending');

    const cross = await createFriendRequest('u-bob', 'u-alice');
    expect(cross.id).toBe(first.id);
    expect(cross.status).toBe('accepted');
    expect(memDb.friendships).toHaveLength(1);
  });

  it('isBlockedBy ritorna true dopo createBlock e getFriendStatus ritorna blocked', async () => {
    await createBlock('u-bob', 'u-carol');
    expect(await isBlockedBy('u-carol', 'u-bob')).toBe(true);
    expect(await isBlockedBy('u-bob', 'u-carol')).toBe(false);
    expect(await getFriendStatus('u-carol', 'u-bob')).toBe('blocked');
  });

  it('createBlock rimuove eventuale richiesta pendente e blocca nuove richieste', async () => {
    await createFriendRequest('u-carol', 'u-alice');
    expect(memDb.friendships).toHaveLength(1);

    await createBlock('u-alice', 'u-carol');
    expect(memDb.friendships).toHaveLength(0);
    await expect(createFriendRequest('u-carol', 'u-alice')).rejects.toThrow(/bloccato/i);
  });

  it('notifications.create + listUnread + helper friend_request / party_invite (TTL 24h)', async () => {
    const n1 = await createFriendRequestNotification('u-bob', 'u-alice', 'Alice', 'req-1');
    const n2 = await createPartyInviteNotification('u-bob', 'u-carol', 'Carol', 'room-7', 'uno');

    expect(n1.type).toBe('friend_request');
    expect(n2.type).toBe('party_invite');
    expect(n2.expires_at).not.toBeNull();
    const diff = n2.expires_at!.getTime() - n2.created_at.getTime();
    expect(diff).toBeGreaterThanOrEqual(INVITE_NOTIFICATION_TTL_MS - 1000);

    const unread = await listUnread('u-bob');
    expect(unread).toHaveLength(2);
  });

  it('notifications.markRead esclude la notifica da listUnread', async () => {
    const n = await createNotification('u-alice', 'system', { msg: 'Benvenuto' });
    expect(await listUnread('u-alice')).toHaveLength(1);

    await markRead(n.id, 'u-alice');
    expect(await listUnread('u-alice')).toHaveLength(0);
  });

  it('notifications.purgeExpired rimuove solo le notifiche scadute', async () => {
    const past = new Date(Date.now() - 60_000);
    const future = new Date(Date.now() + 60_000);

    await createNotification('u-alice', 'party_invite', { roomId: 'old' }, past);
    await createNotification('u-alice', 'party_invite', { roomId: 'active' }, future);
    await createNotification('u-alice', 'system', { msg: 'forever' });

    const purged = await purgeExpired();
    expect(purged).toBe(1);
    const remaining = await listUnread('u-alice');
    expect(remaining).toHaveLength(2);
  });

  it('0003_social.sql definisce tutte le 3 tabelle e tutti gli indici richiesti', async () => {
    const sqlPath = path.resolve(
      import.meta.dirname,
      '../../src/persistence/postgres/migrations/0003_social.sql'
    );
    const sql = await fs.readFile(sqlPath, 'utf8');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS friendships');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS blocks');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS notifications');
    expect(sql).toContain('idx_friendships_unique_pair');
    expect(sql).toContain('idx_friendships_addressee_status');
    expect(sql).toContain('idx_friendships_requester_status');
    expect(sql).toContain('idx_blocks_blocked');
    expect(sql).toContain('idx_notifications_recipient_unread');
    expect(sql).toContain('idx_notifications_expires');
  });
});
