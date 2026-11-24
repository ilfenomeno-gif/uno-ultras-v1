// ============================================================
// UNO ULTRA Server — JWT token service (jsonwebtoken@9)
// ============================================================

import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthTokenPayload {
  sub: string;
  username: string;
  jti?: string;
}

export interface VerifiedTokenPayload {
  sub: string;
  username: string;
  jti?: string;
  exp?: number;
}

export function signAccessToken(payload: AuthTokenPayload): string {
  const jti = payload.jti ?? crypto.randomUUID();
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
    issuer: 'uno-ultra',
    jwtid: jti,
  };
  return jwt.sign({ sub: payload.sub, username: payload.username }, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): VerifiedTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: 'uno-ultra',
  });

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof decoded.sub !== 'string' ||
    typeof (decoded as Record<string, unknown>)['username'] !== 'string'
  ) {
    throw new Error('Invalid JWT payload structure');
  }

  const record = decoded as Record<string, unknown>;
  const result: VerifiedTokenPayload = {
    sub: decoded.sub,
    username: record['username'] as string,
    ...(typeof record['jti'] === 'string' ? { jti: record['jti'] } : {}),
    ...(typeof record['exp'] === 'number' ? { exp: record['exp'] } : {}),
  };
  return result;
}
