// ============================================================
// UNO ULTRA Server — WebRTC ICE / STUN / TURN Configuration
// ============================================================

import { generateTurnCredentials } from './coturn-client.js';

export interface IceServerConfig {
  readonly urls: string | string[];
  readonly username?: string;
  readonly credential?: string;
}

export function buildIceConfigurationForPlayer(playerId: string): {
  iceServers: IceServerConfig[];
  ttlSeconds: number;
} {
  const turnUrl = process.env['TURN_URL'] ?? 'turn:localhost:3478?transport=udp';
  const stunUrl = process.env['STUN_URL'] ?? 'stun:localhost:3478';
  const creds = generateTurnCredentials(playerId);

  return {
    iceServers: [
      { urls: stunUrl },
      {
        urls: turnUrl,
        username: creds.username,
        credential: creds.credential,
      },
    ],
    ttlSeconds: creds.ttlSeconds,
  };
}
