import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Client } from 'colyseus';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const { createRoomMock, queryRoomsMock } = vi.hoisted(() => ({
  createRoomMock: vi.fn(),
  queryRoomsMock: vi.fn().mockResolvedValue([]),
}));

vi.mock('colyseus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('colyseus')>();
  return {
    ...actual,
    matchMaker: {
      ...actual.matchMaker,
      createRoom: createRoomMock,
      query: queryRoomsMock,
    },
  };
});

import { signAccessToken } from '../../src/auth/jwt-service.js';
import { matchmakingQueue } from '../../src/matchmaking/queue.js';
import { apiErrorHandler, createHttpApp } from '../../src/net/tcp/http-server.js';
import { recoverOrphanedMatchmakingTickets } from '../../src/net/tcp/rest-routes/matchmaking.js';
import { canUseDevFallback } from '../../src/persistence/postgres/dev-store.js';
import { recordMatchAbandonment } from '../../src/persistence/postgres/repositories/matchmaking-bans.js';
import {
  cacheMatchmakingTicket,
  getMatchmakingTicket,
} from '../../src/persistence/redis/matchmaking-cache.js';
import { UnoRoom } from '../../src/rooms/uno/uno-room.js';
import { clearMemoryRateLimits } from '../../src/security/rate-limiter.js';

let server: http.Server;
let baseUrl = '';

const playerAId = '11111111-1111-4111-8111-111111111111';
const playerBId = '22222222-2222-4222-8222-222222222222';
const intruderId = '33333333-3333-4333-8333-333333333333';
const capTesterId = '55555555-5555-4555-8555-555555555555';

let tokenA = '';
let tokenB = '';
let tokenIntruder = '';
let tokenCapTester = '';

const originalBotFallbackEnv = process.env['MATCHMAKING_BOT_FALLBACK_MS'];
const originalMaxRoomsEnv = process.env['MAX_ACTIVE_MATCHMADE_ROOMS'];

function createTestUnoRoom(roomId: string): {
  room: UnoRoom;
  broadcasts: Array<{ type: string; payload: unknown }>;
  disconnectSpy: ReturnType<typeof vi.fn>;
  setPrivateSpy: ReturnType<typeof vi.fn>;
} {
  const room = new UnoRoom();
  const broadcasts: Array<{ type: string; payload: unknown }> = [];
  const disconnectSpy = vi.fn().mockResolvedValue(undefined);
  const setPrivateSpy = vi.fn().mockResolvedValue(undefined);

  const internals = room as unknown as Record<string, unknown>;
  internals['roomId'] = roomId;
  internals['roomName'] = 'uno';
  internals['clock'] = {
    setTimeout(fn: () => void, ms: number) {
      const handle = setTimeout(fn, ms);
      return { clear: () => clearTimeout(handle) };
    },
    clear() {
      // handled per timer
    },
  };
  internals['setPrivate'] = setPrivateSpy;
  internals['disconnect'] = disconnectSpy;
  internals['lock'] = vi.fn().mockResolvedValue(undefined);
  internals['broadcast'] = (type: string, payload: unknown) => {
    broadcasts.push({ type, payload });
  };

  return { room, broadcasts, disconnectSpy, setPrivateSpy };
}

function createFakeClient(sessionId: string): Client {
  return {
    sessionId,
    send: vi.fn(),
    leave: vi.fn(),
  } as unknown as Client;
}

describe('Matchmaking Hardening & Negative Paths', () => {
  beforeAll(async () => {
    const app = createHttpApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}/api`;

    tokenA = signAccessToken({ sub: playerAId, username: 'MM_Hard_A' });
    tokenB = signAccessToken({ sub: playerBId, username: 'MM_Hard_B' });
    tokenIntruder = signAccessToken({ sub: intruderId, username: 'MM_Intruder' });
    tokenCapTester = signAccessToken({ sub: capTesterId, username: 'MM_CapTester' });
  });

  afterEach(() => {
    createRoomMock.mockReset();
    queryRoomsMock.mockReset();
    queryRoomsMock.mockResolvedValue([]);
    matchmakingQueue.cancel(playerAId);
    matchmakingQueue.cancel(playerBId);
    matchmakingQueue.cancel(intruderId);
    matchmakingQueue.cancel(capTesterId);
    if (originalBotFallbackEnv === undefined) {
      delete process.env['MATCHMAKING_BOT_FALLBACK_MS'];
    } else {
      process.env['MATCHMAKING_BOT_FALLBACK_MS'] = originalBotFallbackEnv;
    }
    if (originalMaxRoomsEnv === undefined) {
      delete process.env['MAX_ACTIVE_MATCHMADE_ROOMS'];
    } else {
      process.env['MAX_ACTIVE_MATCHMADE_ROOMS'] = originalMaxRoomsEnv;
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  });

  it('reserves seats via UnoRoom.onAuth and rejects unauthorized intruders even when knowing roomId', async () => {
    const { room, setPrivateSpy } = createTestUnoRoom('mm_auth_room_1');
    room.onCreate({
      maxPlayers: 2,
      ranked: false,
      fillWithBots: false,
      variant: 'blitz',
      matchmade: true,
      allowedPlayerIds: [playerAId, playerBId],
      noShowTimeoutMs: 5000,
    });

    try {
      expect(setPrivateSpy).toHaveBeenCalledWith(true);
      await expect(
        room.onAuth(createFakeClient('sess_intruder'), { token: tokenIntruder }),
      ).rejects.toThrow(/Accesso negato/i);

      await expect(
        room.onAuth(createFakeClient('sess_a'), { token: tokenA }),
      ).resolves.toBe(true);
    } finally {
      room.onDispose();
    }
  });

  it('prevents ghost match when player A cancels right before player B enqueues', async () => {
    createRoomMock.mockResolvedValue({ roomId: 'room_human_should_not_exist' });

    const enqA = await fetch(`${baseUrl}/matchmaking/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ mode: 'uno', ranked: false, targetPlayers: 2, variant: 'blitz' }),
    });
    expect(enqA.status).toBe(200);
    const bodyA = (await enqA.json()) as { ticket: { ticketId: string } };

    const cancelRes = await fetch(`${baseUrl}/matchmaking/cancel?mode=uno&ranked=false`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(cancelRes.status).toBe(200);
    const cancelBody = (await cancelRes.json()) as { cancelled: boolean };
    expect(cancelBody.cancelled).toBe(true);

    const enqB = await fetch(`${baseUrl}/matchmaking/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ mode: 'uno', ranked: false, targetPlayers: 2, variant: 'blitz' }),
    });
    expect(enqB.status).toBe(200);
    const bodyB = (await enqB.json()) as { matched: unknown };
    expect(bodyB.matched).toBeNull();
    expect(createRoomMock).not.toHaveBeenCalled();

    const statusA = await fetch(`${baseUrl}/matchmaking/status/${bodyA.ticket.ticketId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(statusA.status).toBe(200);
    const statusBodyA = (await statusA.json()) as { status: string };
    expect(statusBodyA.status).toBe('cancelled');
  });

  it('fires server-side bot fallback timer autonomously without GET /status side-effects', async () => {
    process.env['MATCHMAKING_BOT_FALLBACK_MS'] = '40';
    createRoomMock.mockResolvedValue({ roomId: 'room_bot_fallback_1' });

    const enqA = await fetch(`${baseUrl}/matchmaking/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ mode: 'uno', ranked: false, targetPlayers: 2, variant: 'blitz' }),
    });
    expect(enqA.status).toBe(200);
    const bodyA = (await enqA.json()) as { ticket: { ticketId: string }; matched: unknown };
    expect(bodyA.matched).toBeNull();

    // Attende lo scadere del timer lato server SENZA effettuare alcun polling prima
    await new Promise((r) => setTimeout(r, 90));
    expect(createRoomMock).toHaveBeenCalledTimes(1);
    expect(createRoomMock).toHaveBeenCalledWith(
      'uno',
      expect.objectContaining({
        fillWithBots: true,
        matchmade: true,
        allowedPlayerIds: [playerAId],
      }),
    );

    // GET /status legge in modo puro il risultato già prodotto dal timer
    const statusA = await fetch(`${baseUrl}/matchmaking/status/${bodyA.ticket.ticketId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(statusA.status).toBe(200);
    const fallbackBody = (await statusA.json()) as {
      status: string;
      matchType?: string;
      roomId?: string;
      allowedPlayerIds?: string[];
    };
    expect(fallbackBody.status).toBe('matched');
    expect(fallbackBody.matchType).toBe('bot_fallback');
    expect(fallbackBody.roomId).toBe('room_bot_fallback_1');
    expect(fallbackBody.allowedPlayerIds).toEqual([playerAId]);
    expect(createRoomMock).toHaveBeenCalledTimes(1);

    // Un secondo giocatore che entra dopo il fallback non viene mai accoppiato con A
    const enqB = await fetch(`${baseUrl}/matchmaking/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ mode: 'uno', ranked: false, targetPlayers: 2, variant: 'blitz' }),
    });
    expect(enqB.status).toBe(200);
    const bodyB = (await enqB.json()) as { matched: unknown };
    expect(bodyB.matched).toBeNull();
  });

  it('rejects enqueue with 503 when active matchmade room cap is reached', async () => {
    process.env['MAX_ACTIVE_MATCHMADE_ROOMS'] = '1';
    queryRoomsMock.mockResolvedValue([{ roomId: 'existing_uno_room_1' }]);

    const res = await fetch(`${baseUrl}/matchmaking/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCapTester}` },
      body: JSON.stringify({ mode: 'uno', ranked: false, targetPlayers: 2 }),
    });
    expect(res.status).toBe(503);
    expect(createRoomMock).not.toHaveBeenCalled();
  });

  it('handles no-show timeouts in UnoRoom (fills partial lobby with bots, disconnects empty room)', async () => {
    const partial = createTestUnoRoom('mm_noshow_partial');
    partial.room.onCreate({
      maxPlayers: 2,
      ranked: false,
      fillWithBots: false,
      variant: 'blitz',
      matchmade: true,
      allowedPlayerIds: [playerAId, playerBId],
      noShowTimeoutMs: 50,
    });
    try {
      await partial.room.onJoin(createFakeClient('sess_a'), { token: tokenA });
      expect(partial.room.state.phase).toBe('lobby');
      await new Promise((r) => setTimeout(r, 90));
      expect(partial.broadcasts.some((b) => b.type === 'no_show_fallback')).toBe(true);
      expect(partial.room.state.phase).toBe('playing');
      expect(partial.room.state.players.size).toBe(2);
    } finally {
      partial.room.onDispose();
    }

    const empty = createTestUnoRoom('mm_noshow_empty');
    empty.room.onCreate({
      maxPlayers: 2,
      ranked: false,
      fillWithBots: false,
      variant: 'blitz',
      matchmade: true,
      allowedPlayerIds: [playerAId, playerBId],
      noShowTimeoutMs: 40,
    });
    try {
      await new Promise((r) => setTimeout(r, 80));
      expect(empty.disconnectSpy).toHaveBeenCalledTimes(1);
    } finally {
      empty.room.onDispose();
    }
  });

  it('returns 404 on unknown ticket, 403 on cross-player ticket read, and 403 for banned ranked enqueue', async () => {
    const missing = await fetch(`${baseUrl}/matchmaking/status/non-existent-ticket-id`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(missing.status).toBe(404);

    const enqA = await fetch(`${baseUrl}/matchmaking/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ mode: 'uno', ranked: false, targetPlayers: 2 }),
    });
    const { ticket } = (await enqA.json()) as { ticket: { ticketId: string } };

    const crossRead = await fetch(`${baseUrl}/matchmaking/status/${ticket.ticketId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(crossRead.status).toBe(403);

    const banUser = `MMBan_${Date.now().toString(36)}`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: banUser,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    expect(regRes.status).toBe(201);
    const regBody = (await regRes.json()) as { token: string; profile: { id: string } };

    await recordMatchAbandonment({
      playerId: regBody.profile.id,
      username: banUser,
      matchId: 'match-ban-test-1',
      mode: 'uno',
      playerCount: 2,
      opponentMmr: 500,
      isFirstLeaver: true,
    });

    const bannedEnq = await fetch(`${baseUrl}/matchmaking/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${regBody.token}` },
      body: JSON.stringify({ mode: 'uno', ranked: true, targetPlayers: 2 }),
    });
    expect(bannedEnq.status).toBe(403);
  });

  it('fails closed in NODE_ENV=production (disables dev fallback and returns 503 on DB error)', () => {
    const prevNodeEnv = process.env['NODE_ENV'];
    try {
      process.env['NODE_ENV'] = 'production';
      expect(canUseDevFallback({ code: 'ECONNREFUSED' })).toBe(false);
      expect(canUseDevFallback({ code: '42P01' })).toBe(false);

      const statusSpy = vi.fn();
      const jsonSpy = vi.fn();
      statusSpy.mockReturnValue({ json: jsonSpy });
      const fakeRes = { status: statusSpy } as unknown as Parameters<typeof apiErrorHandler>[2];

      apiErrorHandler(
        Object.assign(new Error('relation "players" does not exist'), { code: '42P01' }),
        {} as Parameters<typeof apiErrorHandler>[1],
        fakeRes,
        vi.fn(),
      );

      expect(statusSpy).toHaveBeenCalledWith(503);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Database temporaneamente non disponibile',
      });
    } finally {
      if (prevNodeEnv === undefined) {
        delete process.env['NODE_ENV'];
      } else {
        process.env['NODE_ENV'] = prevNodeEnv;
      }
    }
  });

  it('configures trust proxy = 1 and isolates /status polling limiter from /enqueue quota', async () => {
    clearMemoryRateLimits();
    try {
      const app = createHttpApp();
      expect(app.get('trust proxy')).toBe(1);

      const enqRes = await fetch(`${baseUrl}/matchmaking/enqueue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ mode: 'uno', ranked: false, targetPlayers: 2 }),
      });
      expect(enqRes.status).toBe(200);
      const { ticket } = (await enqRes.json()) as { ticket: { ticketId: string } };

      // 15 polling consecutivi (> limite 12/min di enqueueLimiter) devono passare tutti con 200
      for (let i = 0; i < 15; i++) {
        const pollRes = await fetch(`${baseUrl}/matchmaking/status/${ticket.ticketId}`, {
          headers: { Authorization: `Bearer ${tokenA}` },
        });
        expect(pollRes.status).toBe(200);
      }

      // enqueueLimiter resta indipendente e permette ancora un nuovo enqueue
      const secondEnq = await fetch(`${baseUrl}/matchmaking/enqueue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ mode: 'uno', ranked: false, targetPlayers: 2 }),
      });
      expect(secondEnq.status).toBe(200);
    } finally {
      clearMemoryRateLimits();
    }
  });

  it('recovers and expires orphaned searching tickets on server startup', async () => {
    const orphanedId = `orphan_ticket_${Date.now()}`;
    await cacheMatchmakingTicket(orphanedId, {
      status: 'searching',
      ticketId: orphanedId,
      playerId: playerAId,
      mode: 'uno',
      ranked: false,
      fallbackAtMs: Date.now() - 5000,
    });

    const recoveredCount = await recoverOrphanedMatchmakingTickets();
    expect(recoveredCount).toBeGreaterThanOrEqual(1);

    const updated = await getMatchmakingTicket(orphanedId);
    expect(updated?.['status']).toBe('cancelled');
    expect(updated?.['reason']).toBe('server_restarted_expired');
  });
});
