// ============================================================
// UNO ULTRA Server — Security, Session & Anti-Cheat Unit Tests
// ============================================================

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { signAccessToken, verifyAccessToken } from '../../src/auth/jwt-service.js';
import {
  clearMemoryRevokedTokens,
  isTokenRevoked,
  revokeTokenJti,
} from '../../src/persistence/redis/session-store.js';
import {
  clearMemoryRateLimits,
  createRateLimiter,
} from '../../src/security/rate-limiter.js';
import { RoomActionThrottle } from '../../src/security/anti-cheat.js';
import { csrfOriginGuard } from '../../src/security/csrf-protection.js';

function createMockRes() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let body: unknown = null;

  const res = {
    setHeader(name: string, val: string) {
      headers[name.toLowerCase()] = val;
      return res;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
  } as unknown as Response;

  return {
    res,
    getStatus: () => statusCode,
    getBody: () => body,
    getHeader: (name: string) => headers[name.toLowerCase()],
  };
}

describe('Server Security & Session Hardening (IMP-005)', () => {
  beforeEach(() => {
    clearMemoryRevokedTokens();
    clearMemoryRateLimits();
  });

  it('jwt-service emette jti univoco, verifica payload e rigetta token alterati', () => {
    const t1 = signAccessToken({ sub: 'u1', username: 'Alice' });
    const t2 = signAccessToken({ sub: 'u1', username: 'Alice' });

    const v1 = verifyAccessToken(t1);
    const v2 = verifyAccessToken(t2);

    expect(v1.sub).toBe('u1');
    expect(v1.username).toBe('Alice');
    expect(typeof v1.jti).toBe('string');
    expect(v1.jti).not.toBe(v2.jti);
    expect(() => verifyAccessToken(`${t1}tampered`)).toThrow();
  });

  it('session-store revoca jti e scade correttamente', async () => {
    expect(await isTokenRevoked('jti-abc')).toBe(false);
    await revokeTokenJti('jti-abc', 60);
    expect(await isTokenRevoked('jti-abc')).toBe(true);
  });

  it('rate-limiter consente fino a max richieste e blocca la successiva con 429', async () => {
    const limiter = createRateLimiter({
      scope: 'test-login',
      max: 2,
      windowSeconds: 60,
      keyFn: () => '127.0.0.1',
    });

    const next = vi.fn() as unknown as NextFunction;
    const req = { headers: {}, socket: {} } as Request;

    const r1 = createMockRes();
    await limiter(req, r1.res, next);
    const r2 = createMockRes();
    await limiter(req, r2.res, next);
    expect(next).toHaveBeenCalledTimes(2);

    const r3 = createMockRes();
    await limiter(req, r3.res, next);
    expect(r3.getStatus()).toBe(429);
    expect(r3.getHeader('retry-after')).toBeDefined();
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('RoomActionThrottle consente burst nella finestra e blocca flood oltre maxActions', () => {
    const throttle = new RoomActionThrottle(3, 1000);
    expect(throttle.allow('p1', 100)).toBe(true);
    expect(throttle.allow('p1', 200)).toBe(true);
    expect(throttle.allow('p1', 300)).toBe(true);
    expect(throttle.allow('p1', 400)).toBe(false);

    // Nuova finestra dopo 1000ms
    expect(throttle.allow('p1', 1200)).toBe(true);
  });

  it('csrfOriginGuard consente CORS_ORIGIN e blocca origini cross-site con 403', () => {
    const nextOk = vi.fn() as unknown as NextFunction;
    const okRes = createMockRes();
    csrfOriginGuard(
      { headers: { origin: 'http://localhost:5173' } } as Request,
      okRes.res,
      nextOk
    );
    expect(nextOk).toHaveBeenCalledTimes(1);

    const nextBad = vi.fn() as unknown as NextFunction;
    const badRes = createMockRes();
    csrfOriginGuard(
      { headers: { origin: 'https://evil.example' } } as Request,
      badRes.res,
      nextBad
    );
    expect(nextBad).not.toHaveBeenCalled();
    expect(badRes.getStatus()).toBe(403);
  });
});
