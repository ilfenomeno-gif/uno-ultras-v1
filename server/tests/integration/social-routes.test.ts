// ============================================================
// UNO ULTRA Server — Integration tests: Social REST Routes
// ============================================================

import crypto from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const playersStore = new Map([
  [
    'u-alice',
    {
      id: 'u-alice',
      username: 'Alice',
      password_hash: 'x',
      email: null,
      rank_tier: 'Bronze I',
      mmr: 120,
      vcard: 0,
      battle_card_level: 3,
      created_at: new Date('2026-11-01T10:00:00Z'),
      updated_at: new Date('2026-11-01T10:00:00Z'),
    },
  ],
  [
    'u-bob',
    {
      id: 'u-bob',
      username: 'Bob',
      password_hash: 'x',
      email: null,
      rank_tier: 'Gold II',
      mmr: 680,
      vcard: 200,
      battle_card_level: 12,
      created_at: new Date('2026-11-02T10:00:00Z'),
      updated_at: new Date('2026-11-02T10:00:00Z'),
    },
  ],
]);

const blockedPairs = new Set<string>();
const createdNotifications: Array<{ id: string; recipientId: string; type: string }> = [];

vi.mock('../../src/persistence/postgres/repositories/players.js', () => ({
  findPlayerById: async (id: string) => playersStore.get(id) ?? null,
  findPlayerByUsername: async (name: string) => {
    const low = name.toLowerCase();
    for (const p of playersStore.values()) {
      if (p.username.toLowerCase() === low) return p;
    }
    return null;
  },
  isUsernameReserved: async () => false,
  createPlayer: async () => playersStore.get('u-alice')!,
}));

vi.mock('../../src/persistence/postgres/repositories/friends.js', () => ({
  FRIEND_REQUEST_RATE_LIMIT_PER_DAY: 20,
  INVITE_RATE_LIMIT_PER_MINUTE: 5,
  listFriends: async () => [],
  listPendingIncoming: async () => [],
  listBlocked: async () => [],
  isBlockedBy: async (blockedId: string, blockerId: string) =>
    blockedPairs.has(`${blockerId}:${blockedId}`),
  createFriendRequest: async (reqId: string, addrId: string) => ({
    id: crypto.randomUUID(),
    requester_id: reqId,
    addressee_id: addrId,
    status: 'pending' as const,
    created_at: new Date(),
    updated_at: new Date(),
  }),
  acceptFriendRequest: async (id: string, addrId: string) => ({
    id,
    requester_id: 'u-bob',
    addressee_id: addrId,
    status: 'accepted' as const,
    created_at: new Date(),
    updated_at: new Date(),
  }),
  rejectFriendRequest: async () => undefined,
  deleteFriend: async () => undefined,
  createBlock: async (blocker: string, blocked: string) => {
    blockedPairs.add(`${blocker}:${blocked}`);
  },
  deleteBlock: async (blocker: string, blocked: string) => {
    blockedPairs.delete(`${blocker}:${blocked}`);
  },
}));

vi.mock('../../src/persistence/postgres/repositories/notifications.js', () => ({
  INVITE_NOTIFICATION_TTL_MS: 86_400_000,
  createNotification: async (recipientId: string, type: string) => {
    const id = crypto.randomUUID();
    createdNotifications.push({ id, recipientId, type });
    return {
      id,
      recipient_id: recipientId,
      type,
      payload: {},
      read_at: null,
      expires_at: null,
      created_at: new Date(),
    };
  },
  createFriendRequestNotification: async (recipientId: string) => {
    const id = crypto.randomUUID();
    createdNotifications.push({ id, recipientId, type: 'friend_request' });
    return {
      id,
      recipient_id: recipientId,
      type: 'friend_request' as const,
      payload: {},
      read_at: null,
      expires_at: null,
      created_at: new Date(),
    };
  },
  createPartyInviteNotification: async (recipientId: string) => {
    const id = crypto.randomUUID();
    createdNotifications.push({ id, recipientId, type: 'party_invite' });
    return {
      id,
      recipient_id: recipientId,
      type: 'party_invite' as const,
      payload: {},
      read_at: null,
      expires_at: new Date(Date.now() + 86_400_000),
      created_at: new Date(),
    };
  },
  listUnread: async () => [],
  markRead: async () => undefined,
}));

import { createHttpApp } from '../../src/net/tcp/http-server.js';
import { signAccessToken } from '../../src/auth/jwt-service.js';
import { presenceService } from '../../src/rooms/base/presence.js';
import { clearMemoryRateLimits } from '../../src/security/rate-limiter.js';

describe('Social & Profile REST Routes (IMP-007a)', () => {
  let server: http.Server;
  let baseUrl: string;
  let aliceToken: string;

  beforeAll(async () => {
    server = http.createServer(createHttpApp());
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
    aliceToken = signAccessToken({ sub: 'u-alice', username: 'Alice' });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  beforeEach(() => {
    blockedPairs.clear();
    createdNotifications.length = 0;
    presenceService.clearMemoryStore();
    clearMemoryRateLimits();
  });

  it('POST /api/friends/request crea richiesta e notifica, e ritorna 404 per utente ignoto', async () => {
    const res = await fetch(`${baseUrl}/api/friends/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({ targetUsername: 'Bob' }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('pending');
    expect(createdNotifications.some((n) => n.recipientId === 'u-bob' && n.type === 'friend_request')).toBe(
      true
    );

    const notFound = await fetch(`${baseUrl}/api/friends/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({ targetUsername: 'GhostUser' }),
    });
    expect(notFound.status).toBe(404);
  });

  it('POST /api/invites/send supporta sia destinatario offline sia online', async () => {
    const offlineRes = await fetch(`${baseUrl}/api/invites/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({ targetPlayerId: 'u-bob', roomId: 'lobby', mode: 'uno' }),
    });
    expect(offlineRes.status).toBe(201);
    const offlineJson = (await offlineRes.json()) as { deliveredOnline: boolean };
    expect(offlineJson.deliveredOnline).toBe(false);

    await presenceService.setOnline('u-bob');
    const onlineRes = await fetch(`${baseUrl}/api/invites/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({ targetPlayerId: 'u-bob', roomId: 'room-42', mode: 'uno' }),
    });
    expect(onlineRes.status).toBe(201);
    const onlineJson = (await onlineRes.json()) as { deliveredOnline: boolean };
    expect(onlineJson.deliveredOnline).toBe(true);
  });

  it('POST /api/invites/send restituisce 403 se il destinatario ha bloccato il mittente', async () => {
    blockedPairs.add('u-bob:u-alice');
    const res = await fetch(`${baseUrl}/api/invites/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({ targetPlayerId: 'u-bob', roomId: 'lobby', mode: 'uno' }),
    });
    expect(res.status).toBe(403);
  });

  it('POST /api/invites/send applica rate-limit 5/min e blocca la 6a richiesta con 429', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await fetch(`${baseUrl}/api/invites/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aliceToken}`,
        },
        body: JSON.stringify({ targetPlayerId: 'u-bob', roomId: 'lobby', mode: 'uno' }),
      });
      expect(r.status).toBe(201);
    }

    const sixth = await fetch(`${baseUrl}/api/invites/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({ targetPlayerId: 'u-bob', roomId: 'lobby', mode: 'uno' }),
    });
    expect(sixth.status).toBe(429);
  });

  it('GET /api/players/:username/profile restituisce profilo e presenceStatus aggiornato', async () => {
    await presenceService.setInGame('u-bob', 'room-9');
    const res = await fetch(`${baseUrl}/api/players/Bob/profile`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      username: string;
      rank: string;
      mmr: number;
      presenceStatus: string;
    };
    expect(json.username).toBe('Bob');
    expect(json.rank).toBe('Gold II');
    expect(json.mmr).toBe(680);
    expect(json.presenceStatus).toBe('ingame');
  });
});
