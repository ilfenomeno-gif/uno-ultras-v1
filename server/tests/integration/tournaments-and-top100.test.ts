import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import { signAccessToken } from '../../src/auth/jwt-service.js';
import { createHttpApp } from '../../src/net/tcp/http-server.js';

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
});
