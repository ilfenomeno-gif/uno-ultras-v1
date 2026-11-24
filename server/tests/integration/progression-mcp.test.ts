import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import { signAccessToken } from '../../src/auth/jwt-service.js';
import { createHttpApp } from '../../src/net/tcp/http-server.js';
import {
  resolveModeMultiplier,
  settleFinishedMatchWithReceipts,
} from '../../src/services/match-settlement.js';

let server: http.Server;
let baseUrl = '';
let token = '';

describe('MCP Progression Hub (Rank, MMR, Modes, Challenges, Battle Card)', () => {
  beforeAll(async () => {
    const app = createHttpApp();
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
    token = signAccessToken({ sub: 'mcp_player_1', username: 'MCP_Tester' });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  });

  it('computes mode-aware and ranked progression multipliers cleanly', () => {
    expect(resolveModeMultiplier('uno', false)).toBe(1.0);
    expect(resolveModeMultiplier('uno', true)).toBe(1.2);
    expect(resolveModeMultiplier('poker-texas', true)).toBe(1.25);
    expect(resolveModeMultiplier('blackjack', false)).toBe(0.9);
  });

  it('settles finished UNO and mini-game matches returning structured MatchRewardReceipts', async () => {
    const receipts = await settleFinishedMatchWithReceipts({
      matchId: 'match_mcp_test_1',
      mode: 'poker-texas',
      variant: 'standard',
      isRanked: true,
      winnerId: 'mcp_player_1',
      turnCount: 12,
      durationSec: 95,
      participants: [
        { id: 'mcp_player_1', username: 'MCP_Tester', isBot: false, score: 1120, cardsPlayed: 8 },
        { id: 'bot_1', username: 'Bot_1', isBot: true, score: 880, cardsPlayed: 8 },
      ],
    });

    const r = receipts['mcp_player_1'];
    expect(r).toBeDefined();
    expect(r?.won).toBe(true);
    expect(r?.placement).toBe(1);
    expect(r?.modeMultiplier).toBe(1.25);
    expect(r?.vcardEarned).toBeGreaterThan(0);
    expect(r?.xpEarned).toBeGreaterThan(0);
    expect(r?.tournamentCreditsEarned).toBe(25);
  });

  it('settles mini-game outcomes via POST /api/progression/settle-match', async () => {
    const res = await fetch(`${baseUrl}/api/progression/settle-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        matchId: 'local_blackjack_101',
        mode: 'blackjack',
        isRanked: true,
        won: true,
        score: 21,
        opponentScore: 18,
        turnCount: 3,
        durationSec: 25,
        cardsPlayed: 3,
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      receipt: {
        mode: string;
        won: boolean;
        vcardEarned: number;
        xpEarned: number;
        tournamentCreditsEarned: number;
        modeMultiplier: number;
      };
    };
    expect(body.receipt.mode).toBe('blackjack');
    expect(body.receipt.won).toBe(true);
    expect(body.receipt.modeMultiplier).toBe(1.1);
    expect(body.receipt.vcardEarned).toBe(44);
    expect(body.receipt.xpEarned).toBe(275);
    expect(body.receipt.tournamentCreditsEarned).toBe(25);
  });

  it('protects GET /api/progression/snapshot with auth and returns unified snapshot', async () => {
    const unauth = await fetch(`${baseUrl}/api/progression/snapshot`);
    expect(unauth.status).toBe(401);

    const auth = await fetch(`${baseUrl}/api/progression/snapshot`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(auth.status).toBe(200);
    const body = (await auth.json()) as {
      playerId: string;
      rankTier: string;
      battleCard: { level: number };
      challenges: { total: number };
    };
    expect(body.playerId).toBe('mcp_player_1');
    expect(typeof body.rankTier).toBe('string');
    expect(body.battleCard.level).toBeGreaterThanOrEqual(1);
    expect(typeof body.challenges.total).toBe('number');
  });
});
