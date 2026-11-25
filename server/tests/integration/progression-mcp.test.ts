import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import { signAccessToken } from '../../src/auth/jwt-service.js';
import { createHttpApp } from '../../src/net/tcp/http-server.js';
import { recordMatchAbandonment } from '../../src/persistence/postgres/repositories/matchmaking-bans.js';
import { upsertPlayerPlaylistRank } from '../../src/persistence/postgres/repositories/playlist-ranks.js';
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

  it('keeps rank and MMR completely isolated per (mode, playerCount) playlist', async () => {
    const reg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `Iso_${Date.now().toString(36)}`,
        password: 'TestPassword!1',
        confirmPassword: 'TestPassword!1',
      }),
    });
    expect(reg.status).toBe(201);
    const { token: userToken } = (await reg.json()) as { token: string };

    const winUno2p = await fetch(`${baseUrl}/api/progression/settle-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        matchId: `iso_uno_2p_${Date.now()}`,
        mode: 'uno',
        playerCount: 2,
        isRanked: true,
        won: true,
        score: 120,
        opponentScore: 20,
        turnCount: 8,
        durationSec: 25,
        cardsPlayed: 7,
      }),
    });
    expect(winUno2p.status).toBe(200);
    const body2p = (await winUno2p.json()) as {
      receipt: { playlistKey: string; mmrAfter: number; playerCount: number };
    };
    expect(body2p.receipt.playlistKey).toBe('uno:2p');
    expect(body2p.receipt.playerCount).toBe(2);
    expect(body2p.receipt.mmrAfter).toBeGreaterThan(0);

    // Winning uno:2p must NOT alter uno:3p or scala40:2p!
    const loseUno3p = await fetch(`${baseUrl}/api/progression/settle-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        matchId: `iso_uno_3p_${Date.now()}`,
        mode: 'uno',
        playerCount: 3,
        isRanked: true,
        won: false,
        score: 10,
        opponentScore: 90,
        turnCount: 6,
        durationSec: 20,
        cardsPlayed: 5,
      }),
    });
    expect(loseUno3p.status).toBe(200);
    const body3p = (await loseUno3p.json()) as {
      receipt: { playlistKey: string; mmrBefore: number; mmrAfter: number; rankAfter: string };
    };
    expect(body3p.receipt.playlistKey).toBe('uno:3p');
    expect(body3p.receipt.mmrBefore).toBe(0);
    expect(body3p.receipt.mmrAfter).toBe(0);
    expect(body3p.receipt.rankAfter).toBe('Bronze I');

    const snapRes = await fetch(`${baseUrl}/api/progression/snapshot`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(snapRes.status).toBe(200);
    const snap = (await snapRes.json()) as {
      playlistRanks: Record<string, { mmr: number; rankTier: string }>;
    };
    expect(snap.playlistRanks['uno:2p']?.mmr).toBe(body2p.receipt.mmrAfter);
    expect(snap.playlistRanks['uno:3p']?.mmr).toBe(0);
    expect(snap.playlistRanks['uno:3p']?.rankTier).toBe('Bronze I');
    expect(snap.playlistRanks['scala40:2p']).toBeUndefined();
  });

  it('enforces 3-tier disparity on undersized ranked UNO queues and weighted party MMR', async () => {
    const plat2Id = `disp_p2_${Date.now()}`;
    const plat2Token = signAccessToken({ sub: plat2Id, username: 'PlatTwo' });
    await upsertPlayerPlaylistRank({
      playerId: plat2Id,
      mode: 'uno',
      playerCount: 3,
      mmr: 867,
      rankTier: 'Platinum II',
      won: true,
    });

    // Platinum II (867) + Diamond III (1134) -> gap 4 -> 403 in 3p ranked UNO
    const blocked = await fetch(`${baseUrl}/api/matchmaking/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${plat2Token}` },
      body: JSON.stringify({
        mode: 'uno',
        ranked: true,
        targetPlayers: 3,
        partyMemberMmrs: [1134],
      }),
    });
    expect(blocked.status).toBe(403);

    // Platinum III (934) + Diamond III (1134) -> gap 3 -> 200 with weighted party MMR
    const plat3Id = `disp_p3_${Date.now()}`;
    const plat3Token = signAccessToken({ sub: plat3Id, username: 'PlatThree' });
    await upsertPlayerPlaylistRank({
      playerId: plat3Id,
      mode: 'uno',
      playerCount: 3,
      mmr: 934,
      rankTier: 'Platinum III',
      won: true,
    });
    const allowed = await fetch(`${baseUrl}/api/matchmaking/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${plat3Token}` },
      body: JSON.stringify({
        mode: 'uno',
        ranked: true,
        targetPlayers: 3,
        partyMemberMmrs: [1134],
      }),
    });
    expect(allowed.status).toBe(200);
    const allowedBody = (await allowed.json()) as { effectivePartyMmr: number };
    expect(allowedBody.effectivePartyMmr).toBeGreaterThan(1034);
  });

  it('penalizes early abandonment, blocks ranked queue with a ban, and exposes activeBan in snapshot', async () => {
    const leaverId = `leaver_${Date.now()}`;
    const leaverToken = signAccessToken({ sub: leaverId, username: 'EarlyLeaver' });
    await upsertPlayerPlaylistRank({
      playerId: leaverId,
      mode: 'uno',
      playerCount: 2,
      mmr: 800,
      rankTier: 'Platinum I',
      won: true,
    });

    const outcome = await recordMatchAbandonment({
      playerId: leaverId,
      username: 'EarlyLeaver',
      matchId: `abandon_${Date.now()}`,
      mode: 'uno',
      playerCount: 2,
      opponentMmr: 800,
      isFirstLeaver: true,
    });
    expect(outcome.mmrDelta).toBeLessThan(-20);
    expect(outcome.ban.remainingSeconds).toBeGreaterThan(60);

    const queueRes = await fetch(`${baseUrl}/api/matchmaking/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${leaverToken}` },
      body: JSON.stringify({ mode: 'uno', ranked: true, targetPlayers: 2 }),
    });
    expect(queueRes.status).toBe(403);

    const snapRes = await fetch(`${baseUrl}/api/progression/snapshot`, {
      headers: { Authorization: `Bearer ${leaverToken}` },
    });
    expect(snapRes.status).toBe(200);
    const snap = (await snapRes.json()) as { activeBan: { offenseCount: number } | null };
    expect(snap.activeBan?.offenseCount).toBe(1);
  });

  it('calibrates 10th placement match upward using skill proven in other competitive playlists', async () => {
    const reg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `Cal_${Date.now().toString(36)}`,
        password: 'TestPassword!1',
        confirmPassword: 'TestPassword!1',
      }),
    });
    expect(reg.status).toBe(201);
    const { token: calToken } = (await reg.json()) as { token: string };
    const snap0Res = await fetch(`${baseUrl}/api/progression/snapshot`, {
      headers: { Authorization: `Bearer ${calToken}` },
    });
    expect(snap0Res.status).toBe(200);
    const { playerId: calPlayerId } = (await snap0Res.json()) as { playerId: string };

    // High skill already achieved in uno:2p (1600 MMR = SSL)
    await upsertPlayerPlaylistRank({
      playerId: calPlayerId,
      mode: 'uno',
      playerCount: 2,
      mmr: 1600,
      rankTier: 'SSL',
      won: true,
    });

    // Play 9 matches in scala40:2p staying around low MMR
    for (let i = 1; i <= 9; i++) {
      await upsertPlayerPlaylistRank({
        playerId: calPlayerId,
        mode: 'scala40',
        playerCount: 2,
        mmr: 100,
        rankTier: 'Bronze I',
        won: i % 2 === 0,
      });
    }

    // 10th classification match completes -> system detects high skill and calibrates upward!
    const tenthRes = await fetch(`${baseUrl}/api/progression/settle-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${calToken}` },
      body: JSON.stringify({
        matchId: `cal_tenth_${Date.now()}`,
        mode: 'scala40',
        playerCount: 2,
        isRanked: true,
        won: true,
        score: 20,
        opponentScore: 50,
        turnCount: 8,
        durationSec: 30,
        cardsPlayed: 6,
      }),
    });
    expect(tenthRes.status).toBe(200);
    const body = (await tenthRes.json()) as {
      receipt: {
        placementMatchesPlayed: number;
        calibratedUpward: boolean;
        calibrationBonusMmr: number;
        mmrAfter: number;
      };
    };
    expect(body.receipt.placementMatchesPlayed).toBe(10);
    expect(body.receipt.calibratedUpward).toBe(true);
    expect(body.receipt.mmrAfter).toBe(1200);
    expect(body.receipt.calibrationBonusMmr).toBeGreaterThan(900);
  });
});
