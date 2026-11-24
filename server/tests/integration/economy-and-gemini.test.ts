// ============================================================
// UNO ULTRA Server — Integration tests: Gemini, Matchmaking, TURN/UDP & REST
// ============================================================

import dgram from 'node:dgram';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createInitialState,
  encodeBinary,
  startMatch,
  UDP_CHANNELS,
  type EngineState,
} from '@uno/shared';
import { adviseBotMove, buildPublicBotObservation } from '../../src/ai/gemini-bot-advisor.js';
import { MatchmakingQueue } from '../../src/matchmaking/queue.js';
import { buildTwoWingBracket } from '../../src/persistence/postgres/repositories/tournaments.js';
import { generateTurnCredentials } from '../../src/net/turn/coturn-client.js';
import { buildIceConfigurationForPlayer } from '../../src/net/turn/ice-config.js';
import { webrtcSignaling } from '../../src/net/udp/webrtc-signaling.js';
import { UdpTelemetryServer } from '../../src/net/udp/telemetry-udp.js';
import { createHttpApp } from '../../src/net/tcp/http-server.js';
import { signAccessToken } from '../../src/auth/jwt-service.js';
import { RoomActionThrottle } from '../../src/security/anti-cheat.js';
import { settleFinishedMatch } from '../../src/services/match-settlement.js';

function makePlayingState(): EngineState {
  const lobby = createInitialState({
    matchId: 'gm-1',
    players: [
      { id: 'bot-1', username: 'Bot1', isBot: true, aiProfile: 'STRAT' },
      { id: 'human-1', username: 'Human1', isBot: false },
    ],
    seed: 42,
  });
  const playing = startMatch(lobby);
  // Guarantee at least 2 playable red cards for deterministic Gemini multi-action branch testing
  const bot = playing.players.get('bot-1')!;
  bot.hand = [
    { id: 'red-3-a', color: 'red', kind: 'number', value: 3 },
    { id: 'red-7-a', color: 'red', kind: 'number', value: 7 },
  ];
  playing.discardPile = [{ id: 'red-1-b', color: 'red', kind: 'number', value: 1 }];
  playing.activeColor = 'red';
  return playing;
}

describe('GeminiBotAdvisor guardrails & privacy', () => {
  const originalFlag = process.env['ENABLE_GEMINI_BOTS'];
  const originalKey = process.env['GEMINI_API_KEY'];

  afterEach(() => {
    if (originalFlag === undefined) delete process.env['ENABLE_GEMINI_BOTS'];
    else process.env['ENABLE_GEMINI_BOTS'] = originalFlag;
    if (originalKey === undefined) delete process.env['GEMINI_API_KEY'];
    else process.env['GEMINI_API_KEY'] = originalKey;
  });

  it('never includes opponent hand cards in public bot observation', () => {
    const state = makePlayingState();
    const humanHandIds = state.players.get('human-1')!.hand.map((c) => c.id);
    const { observation } = buildPublicBotObservation(state, 'bot-1', 1500);
    const serialized = JSON.stringify(observation);
    for (const cid of humanHandIds) {
      expect(serialized).not.toContain(cid);
    }
    expect(observation.opponentCardCounts).toEqual([{ playerId: 'human-1', count: 7 }]);
  });

  it('stays on deterministic heuristic when ENABLE_GEMINI_BOTS is false or botMMR < 800', async () => {
    delete process.env['ENABLE_GEMINI_BOTS'];
    const fetchSpy = vi.fn();
    const state = makePlayingState();
    const res1 = await adviseBotMove(state, 'bot-1', { fetchImpl: fetchSpy as unknown as typeof fetch, botMMR: 1600 });
    expect(res1.decision.source).toBe('heuristic');
    expect(fetchSpy).not.toHaveBeenCalled();

    process.env['ENABLE_GEMINI_BOTS'] = 'true';
    process.env['GEMINI_API_KEY'] = 'fake-test-key';
    const res2 = await adviseBotMove(state, 'bot-1', { fetchImpl: fetchSpy as unknown as typeof fetch, botMMR: 500 });
    expect(res2.decision.source).toBe('heuristic');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uses Gemini response when enabled for MMR >= 800 and falls back on out-of-bounds index', async () => {
    process.env['ENABLE_GEMINI_BOTS'] = 'true';
    process.env['GEMINI_API_KEY'] = 'fake-test-key';
    const state = makePlayingState();

    const okFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"actionIndex":0,"reasoning":"best move"}' }] } }],
      }),
    });
    const res = await adviseBotMove(state, 'bot-1', {
      fetchImpl: okFetch as unknown as typeof fetch,
      botMMR: 1450,
    });
    expect(res.decision.source).toBe('gemini');
    expect(res.decision.actionIndex).toBe(0);

    const badFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"actionIndex":999}' }] } }],
      }),
    });
    const fallbackRes = await adviseBotMove(state, 'bot-1', {
      fetchImpl: badFetch as unknown as typeof fetch,
      botMMR: 1450,
    });
    expect(fallbackRes.decision.source).toBe('heuristic');
  });
});

describe('Matchmaking, Brackets, CoTURN/WebRTC & UDP Telemetry', () => {
  it('forms MMR-matched games and creates 2-wing UT32 bracket slots', () => {
    const q = new MatchmakingQueue();
    q.enqueue({ playerId: 'p1', username: 'A', mode: 'uno', ranked: true, mmr: 400, targetPlayers: 2 });
    q.enqueue({ playerId: 'p2', username: 'B', mode: 'uno', ranked: true, mmr: 950, targetPlayers: 2 });
    expect(q.popMatches(Date.now())).toHaveLength(0);

    // Expanding band after 40s allows matching
    const formed = q.popMatches(Date.now() + 45_000);
    expect(formed).toHaveLength(1);
    expect(formed[0]!.players).toHaveLength(2);

    const slots = buildTwoWingBracket(['A', 'B', 'C', 'D'], 32);
    expect(slots).toHaveLength(17); // 8 left + 8 right + 1 final
    expect(slots.filter((s) => s.wing === 'final')).toHaveLength(1);
  });

  it('generates CoTURN HMAC credentials, WebRTC signals and UDP telemetry roundtrip', async () => {
    const creds = generateTurnCredentials('u-alice', 'secret-key', 600);
    expect(creds.username).toContain(':u-alice');
    expect(creds.credential.length).toBeGreaterThan(10);

    const ice = buildIceConfigurationForPlayer('u-alice');
    expect(ice.iceServers.length).toBe(2);

    webrtcSignaling.enqueueSignal({
      roomId: 'r1',
      fromPlayerId: 'p1',
      toPlayerId: 'p2',
      kind: 'offer',
      payload: { sdp: 'v=0' },
    });
    expect(webrtcSignaling.drainSignals('r1', 'p2')).toHaveLength(1);
    expect(webrtcSignaling.drainSignals('r1', 'p2')).toHaveLength(0);

    const udp = new UdpTelemetryServer();
    const port = await udp.start(0);
    const sender = dgram.createSocket('udp4');
    try {
      const pkt = encodeBinary(UDP_CHANNELS.TELEMETRY, {
        matchId: 'm1',
        playerId: 'u-telemetry',
        rttMs: 18,
        packetLoss: 0,
        jitterMs: 2,
      });
      await new Promise<void>((resolve, reject) => {
        sender.send(pkt, port, '127.0.0.1', (err) => (err ? reject(err) : resolve()));
      });
      await new Promise((r) => setTimeout(r, 40));
      expect(udp.getLatestForPlayer('u-telemetry')?.rttMs).toBe(18);
    } finally {
      sender.close();
      await udp.stop();
    }
  });
});

describe('Express REST endpoints (shop, tournaments, sync presets, metrics)', () => {
  it('serves catalog, presets, metrics and detailed health', async () => {
    const app = createHttpApp();
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;
    const base = `http://127.0.0.1:${port}/api`;

    try {
      const catalogRes = await fetch(`${base}/shop/catalog`);
      expect(catalogRes.status).toBe(200);
      const catalog = (await catalogRes.json()) as { items: unknown[] };
      expect(catalog.items.length).toBeGreaterThanOrEqual(10);

      const presetsRes = await fetch(`${base}/tournaments/presets`);
      expect(presetsRes.status).toBe(200);
      const presets = (await presetsRes.json()) as { presets: unknown[] };
      expect(presets.presets).toHaveLength(5);

      const metricsRes = await fetch(`${base}/health/metrics`);
      expect(metricsRes.status).toBe(200);
      expect(await metricsRes.text()).toContain('gemini_advisor');

      // Non-admin user cannot create ucs-ssl tournament (P0/P1 guard)
      const token = signAccessToken({ sub: '00000000-0000-0000-0000-000000000099', username: 'RegularPlayer' });
      const sslRes = await fetch(`${base}/tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ kind: 'ucs-ssl' }),
      });
      expect(sslRes.status).toBe(403);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

describe('P0 Anti-Cheat RoomActionThrottle & MatchSettlement', () => {
  it('throttles flood actions beyond window limit and resets cleanly', () => {
    const throttle = new RoomActionThrottle(12, 2000);
    const t0 = 1_000_000;
    for (let i = 0; i < 12; i++) {
      expect(throttle.allow('p1', t0 + i * 10)).toBe(true);
    }
    expect(throttle.allow('p1', t0 + 200)).toBe(false);
    throttle.reset('p1');
    expect(throttle.allow('p1', t0 + 250)).toBe(true);
  });

  it('executes settleFinishedMatch without throwing for human+bot participants', async () => {
    await expect(
      settleFinishedMatch({
        matchId: '00000000-0000-0000-0000-000000000123',
        mode: 'uno',
        isRanked: false,
        winnerId: 'bot_1',
        turnCount: 14,
        durationSec: 45,
        participants: [
          { id: 'bot_1', username: 'UNO_BOT_1', isBot: true, score: 100 },
          { id: 'bot_2', username: 'UNO_BOT_2', isBot: true, score: 20 },
        ],
      }),
    ).resolves.toBeUndefined();
  });
});
