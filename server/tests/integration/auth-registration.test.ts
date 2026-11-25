import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createHttpApp } from '../../src/net/tcp/http-server.js';

let server: http.Server;
let baseUrl = '';

describe('Auth Registration, Login & Profile Fallback (Offline DB Safe)', () => {
  const uniqueUser = `RegUser_${Date.now().toString(36)}`;
  const password = 'UltraPassword_2026!';

  beforeAll(async () => {
    const app = createHttpApp();
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  });

  it('registers a new player (201), rejects duplicate (409), logs in (200), and reads /me (200)', async () => {
    const reg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: uniqueUser,
        password,
        confirmPassword: password,
      }),
    });
    expect(reg.status).toBe(201);
    const regBody = (await reg.json()) as {
      token: string;
      profile: { id: string; username: string; mmr: number; vcard: number };
    };
    expect(regBody.token.length).toBeGreaterThan(20);
    expect(regBody.profile.username).toBe(uniqueUser);

    const dup = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: uniqueUser,
        password,
        confirmPassword: password,
      }),
    });
    expect(dup.status).toBe(409);

    const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uniqueUser, password: 'WrongPassword123' }),
    });
    expect(badLogin.status).toBe(401);

    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uniqueUser, password }),
    });
    expect(login.status).toBe(200);
    const loginBody = (await login.json()) as { token: string };

    const me = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
    });
    expect(me.status).toBe(200);
    const meBody = (await me.json()) as { profile: { username: string } };
    expect(meBody.profile.username).toBe(uniqueUser);
  });
});
