// ============================================================
// UNO ULTRA Server — CoTURN Time-Limited HMAC Credentials (RFC 5389)
// ============================================================

import { createHmac } from 'node:crypto';

export interface TurnCredentials {
  readonly username: string;
  readonly credential: string;
  readonly ttlSeconds: number;
  readonly expiresAt: string;
}

export function generateTurnCredentials(
  playerId: string,
  sharedSecret = process.env['TURN_SECRET'] ?? 'uno_ultra_turn_dev_secret',
  ttlSeconds = 3600,
): TurnCredentials {
  const expiryUnix = Math.floor(Date.now() / 1000) + ttlSeconds;
  const username = `${expiryUnix}:${playerId}`;
  const credential = createHmac('sha1', sharedSecret).update(username).digest('base64');
  return {
    username,
    credential,
    ttlSeconds,
    expiresAt: new Date(expiryUnix * 1000).toISOString(),
  };
}
