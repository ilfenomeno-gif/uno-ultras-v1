import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import { signAccessToken } from '../../src/auth/jwt-service.js';
import { createHttpApp } from '../../src/net/tcp/http-server.js';
import { query } from '../../src/persistence/postgres/client.js';
import { updateDevState } from '../../src/persistence/postgres/dev-store.js';
import { upsertPlayerPlaylistRank } from '../../src/persistence/postgres/repositories/playlist-ranks.js';
import { getRedisClient } from '../../src/persistence/redis/client.js';
import { getTopLeaderboard, updateLeaderboardScore } from '../../src/persistence/redis/leaderboard.js';
import {
  formatBotLadderBucketKey,
  tickBotLadderSimulation,
} from '../../src/services/bot-ladder.js';

async function cleanupRival50Entries(testerId?: string): Promise<void> {
  await query(
    "DELETE FROM player_playlist_ranks WHERE player_id IN (SELECT id FROM players WHERE username LIKE 'Rival50_%')",
  ).catch(() => undefined);
  await query("UPDATE players SET deleted_at = NOW() WHERE username LIKE 'Rival50_%'").catch(
    () => undefined,
  );
  if (testerId) {
    await query('DELETE FROM player_playlist_ranks WHERE player_id = $1', [testerId]).catch(
      () => undefined,
    );
    await query('UPDATE players SET deleted_at = NOW() WHERE id = $1', [testerId]).catch(
      () => undefined,
    );
  }
  try {
    const redis = getRedisClient();
    if (redis.isOpen) {
      for (const key of ['leaderboard:mmr', 'leaderboard:mmr:scala40:2p']) {
        const members = await redis.zRange(key, 0, -1);
        const stale = members.filter((m) => {
          const [id = '', name = ''] = m.split('|');
          return name.startsWith('Rival50_') || (testerId !== undefined && id === testerId);
        });
        if (stale.length > 0) {
          await redis.zRem(key, stale);
        }
      }
    }
  } catch {
    // Redis offline in unit-only runs
  }
  updateDevState((state) => {
    for (const bucketKey of ['global', 'scala40:2p']) {
      const bucket = state.leaderboards[bucketKey];
      if (!bucket) continue;
      for (const [id, entry] of Object.entries(bucket)) {
        if (entry.username.startsWith('Rival50_') || id === testerId) {
          delete bucket[id];
        }
      }
    }
    if (testerId && state.playlistRanks[testerId]) {
      delete state.playlistRanks[testerId];
    }
  });
}

let server: http.Server;
let baseUrl = '';
let token = '';

describe('Tournaments Zero-500 Enroll & Top 100 Mondiale API', () => {
  beforeAll(async () => {
    const app = createHttpApp();
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
    token = signAccessToken({
      sub: '00000000-0000-4000-8000-000000000999',
      username: 'Top100_Tester',
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  });

  it('enrolls in tournaments including ucs-ssl cleanly without returning HTTP 500 or 403', async () => {
    const res = await fetch(`${baseUrl}/api/tournaments/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ kind: 'ucs-ssl' }),
    });

    expect([200, 400, 402]).toContain(res.status);
    expect(res.status).not.toBe(500);
    expect(res.status).not.toBe(403);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toBeTruthy();
  });

  it('serves 100 ranked entries filtered by mode and playerCount (1v1 / 3p / 4p)', async () => {
    for (const [mode, players] of [
      ['uno', 2],
      ['scala40', 3],
      ['mille-miglia', 4],
    ] as const) {
      const res = await fetch(
        `${baseUrl}/api/leaderboard/top?mode=${mode}&players=${players}&limit=100`,
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        mode: string;
        playerCount: number;
        entries: Array<{ rank: number; mmr: number; username: string; title: string }>;
      };
      expect(body.mode).toBe(mode);
      expect(body.playerCount).toBe(players);
      expect(body.entries).toHaveLength(100);
      expect(body.entries[0]?.rank).toBe(1);
      expect(body.entries[99]?.rank).toBe(100);
      expect(body.entries[0]!.mmr).toBeGreaterThanOrEqual(body.entries[99]!.mmr);
    }
  });

  it('simulates living bot progression and dynamically moves bot MMRs/ranks over time', async () => {
    const bucketKey = formatBotLadderBucketKey('uno', 2);
    const before = await getTopLeaderboard(100, { mode: 'uno', playerCount: 2 });
    const sim = tickBotLadderSimulation(bucketKey, { force: true, seed: 777 });
    expect(sim.simulated).toBe(true);
    expect(sim.updatedBots).toBeGreaterThanOrEqual(10);
    const after = await getTopLeaderboard(100, { mode: 'uno', playerCount: 2 });
    const changed = after.some((e, i) => e.mmr !== before[i]?.mmr || e.username !== before[i]?.username);
    expect(changed).toBe(true);
  });

  it('matches ±5 Top-100 rivals when inside Top 100 and overtakes beaten rival bots, while hiding #101+ outside Top 100', async () => {
    // 1) Player outside Top 100 (0 MMR): /top still caps strictly at 100, /rivals pulls #101+ near-MMR archive bots
    const lowRes = await fetch(`${baseUrl}/api/leaderboard/rivals?mode=uno&players=2&count=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(lowRes.status).toBe(200);
    const lowBody = (await lowRes.json()) as {
      inTop100: boolean;
      playerRank: number;
      window: { min: number; max: number } | null;
      rivals: Array<{ botId: string; rank: number; username: string; mmr: number }>;
    };
    expect(lowBody.inTop100).toBe(false);
    expect(lowBody.playerRank).toBeGreaterThan(100);
    expect(lowBody.window).toBeNull();
    expect(lowBody.rivals[0]!.rank).toBeGreaterThan(100);

    await cleanupRival50Entries();

    // 2) Register real player and place around rank #50 inside Top 100 on scala40:2p
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `Rival50_${Date.now().toString(36)}`,
        password: 'TestPassword!1',
        confirmPassword: 'TestPassword!1',
      }),
    });
    expect(regRes.status).toBe(201);
    const { token: rivalToken } = (await regRes.json()) as { token: string };
    const snapRes = await fetch(`${baseUrl}/api/progression/snapshot`, {
      headers: { Authorization: `Bearer ${rivalToken}` },
    });
    const { playerId: testerId, username: testerName } = (await snapRes.json()) as {
      playerId: string;
      username: string;
    };

    try {
      const topInit = await fetch(`${baseUrl}/api/leaderboard/top?mode=scala40&players=2&limit=100`);
      const topJson = (await topInit.json()) as {
        entries: Array<{ rank: number; playerId: string; username: string; mmr: number }>;
      };
      expect(topJson.entries).toHaveLength(100);
      const target50 = topJson.entries[49]!;
      const playerMmr = target50.mmr - 1;
      await upsertPlayerPlaylistRank({
        playerId: testerId,
        mode: 'scala40',
        playerCount: 2,
        mmr: playerMmr,
        rankTier: 'Diamond III',
        wins: 20,
        losses: 10,
      });
      await updateLeaderboardScore(testerId, testerName, playerMmr, {
        mode: 'scala40',
        playerCount: 2,
        globalMmr: playerMmr,
      });

      const rivalsRes = await fetch(
        `${baseUrl}/api/leaderboard/rivals?mode=scala40&players=2&count=3`,
        { headers: { Authorization: `Bearer ${rivalToken}` } },
      );
      expect(rivalsRes.status).toBe(200);
      const rivalsBody = (await rivalsRes.json()) as {
        inTop100: boolean;
        playerRank: number;
        window: { min: number; max: number } | null;
        rivals: Array<{ botId: string; rank: number; username: string; mmr: number }>;
      };
      expect(rivalsBody.inTop100).toBe(true);
      expect(rivalsBody.window).toBeTruthy();
      for (const r of rivalsBody.rivals) {
        expect(r.rank).toBeGreaterThanOrEqual(rivalsBody.window!.min);
        expect(r.rank).toBeLessThanOrEqual(rivalsBody.window!.max);
        expect(Math.abs(r.rank - rivalsBody.playerRank)).toBeLessThanOrEqual(5);
      }

      // Beat a rival directly above the player and verify overtakes in Top 100
      const aboveRival =
        rivalsBody.rivals.find((r) => r.rank < rivalsBody.playerRank) ?? rivalsBody.rivals[0]!;
      const settleRes = await fetch(`${baseUrl}/api/progression/settle-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rivalToken}`,
        },
        body: JSON.stringify({
          matchId: `overtake_${Date.now()}`,
          mode: 'scala40',
          playerCount: 2,
          isRanked: true,
          won: true,
          score: 150,
          opponentScore: 40,
          turnCount: 8,
          durationSec: 30,
          cardsPlayed: 6,
          botIds: [aboveRival.botId],
          botNames: [aboveRival.username],
        }),
      });
      expect(settleRes.status).toBe(200);

      const topAfterRes = await fetch(`${baseUrl}/api/leaderboard/top?mode=scala40&players=2&limit=100`);
      const topAfter = (await topAfterRes.json()) as {
        entries: Array<{ rank: number; playerId: string; username: string; mmr: number }>;
      };
      const meAfter = topAfter.entries.find((e) => e.playerId === testerId);
      const rivalAfter = topAfter.entries.find((e) => e.playerId === aboveRival.botId);
      expect(meAfter).toBeDefined();
      expect(rivalAfter).toBeDefined();
      expect(rivalAfter!.mmr).toBeLessThan(aboveRival.mmr);
      expect(meAfter!.rank).toBeLessThan(rivalAfter!.rank);
    } finally {
      await cleanupRival50Entries(testerId);
    }
  });
});
