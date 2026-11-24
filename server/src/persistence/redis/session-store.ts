// ============================================================
// UNO ULTRA Server — Redis session revocation store
// ============================================================

import { getRedisClient } from './client.js';

const REVOKED_PREFIX = 'session:revoked:';
const memoryRevoked = new Map<string, number>();

export async function revokeTokenJti(jti: string, ttlSeconds: number): Promise<void> {
  if (!jti || ttlSeconds <= 0) return;

  const client = getRedisClient();
  if (client.isOpen) {
    await client.set(`${REVOKED_PREFIX}${jti}`, '1', { EX: Math.ceil(ttlSeconds) });
    return;
  }

  memoryRevoked.set(jti, Date.now() + ttlSeconds * 1000);
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  if (!jti) return false;

  const client = getRedisClient();
  if (client.isOpen) {
    const val = await client.get(`${REVOKED_PREFIX}${jti}`);
    return val !== null;
  }

  const expiresAt = memoryRevoked.get(jti);
  if (expiresAt === undefined) return false;
  if (Date.now() > expiresAt) {
    memoryRevoked.delete(jti);
    return false;
  }
  return true;
}

export function clearMemoryRevokedTokens(): void {
  memoryRevoked.clear();
}
