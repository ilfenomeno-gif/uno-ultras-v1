// ============================================================
// UNO ULTRA Server — Refresh token session manager (HttpOnly)
// ============================================================

import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { getPostgresPool, query } from '../persistence/postgres/client.js';

const REFRESH_COOKIE_NAME = 'uno_refresh';
const REFRESH_TTL_DAYS = 14;

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export interface IssuedRefreshToken {
  rawToken: string;
  expiresAt: Date;
}

export async function issueRefreshToken(playerId: string): Promise<IssuedRefreshToken> {
  const rawToken = crypto.randomBytes(48).toString('base64url');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO refresh_tokens (player_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [playerId, tokenHash, expiresAt]
  );

  return { rawToken, expiresAt };
}

export async function rotateRefreshToken(
  rawToken: string
): Promise<{ playerId: string; rawToken: string; expiresAt: Date } | null> {
  const tokenHash = hashToken(rawToken);
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existing = await client.query<{ id: string; player_id: string }>(
      `SELECT id, player_id
         FROM refresh_tokens
        WHERE token_hash = $1
          AND revoked_at IS NULL
          AND expires_at > NOW()
        FOR UPDATE`,
      [tokenHash]
    );

    const row = existing.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [row.id]);

    const nextRaw = crypto.randomBytes(48).toString('base64url');
    const nextHash = hashToken(nextRaw);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO refresh_tokens (player_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [row.player_id, nextHash, expiresAt]
    );

    await client.query('COMMIT');
    return { playerId: row.player_id, rawToken: nextRaw, expiresAt };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await query(
    `UPDATE refresh_tokens
        SET revoked_at = NOW()
      WHERE token_hash = $1
        AND revoked_at IS NULL`,
    [tokenHash]
  );
}

export function setRefreshCookie(res: Response, rawToken: string, expiresAt: Date): void {
  const parts = [
    `${REFRESH_COOKIE_NAME}=${encodeURIComponent(rawToken)}`,
    'HttpOnly',
    'Path=/api/auth',
    'SameSite=Strict',
    `Expires=${expiresAt.toUTCString()}`,
  ];
  if (env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearRefreshCookie(res: Response): void {
  const parts = [
    `${REFRESH_COOKIE_NAME}=`,
    'HttpOnly',
    'Path=/api/auth',
    'SameSite=Strict',
    'Max-Age=0',
  ];
  if (env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function readRefreshCookie(req: Request): string | null {
  const header = req.headers.cookie;
  if (!header) return null;

  const chunks = header.split(';');
  for (const chunk of chunks) {
    const eqIdx = chunk.indexOf('=');
    if (eqIdx < 0) continue;
    const name = chunk.slice(0, eqIdx).trim();
    if (name === REFRESH_COOKIE_NAME) {
      const value = chunk.slice(eqIdx + 1).trim();
      return value ? decodeURIComponent(value) : null;
    }
  }
  return null;
}
