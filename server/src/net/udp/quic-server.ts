// ============================================================
// UNO ULTRA Server — QUIC / WebTransport Config & Handshake Helper
// ============================================================

import { DEFAULT_QUIC_CONFIG, type QuicConfig } from '@uno/shared';

export interface QuicEndpointStatus {
  readonly enabled: boolean;
  readonly host: string;
  readonly port: number;
  readonly config: QuicConfig;
}

export function getQuicEndpointStatus(): QuicEndpointStatus {
  return {
    enabled: process.env['ENABLE_QUIC'] === 'true',
    host: process.env['QUIC_HOST'] ?? '0.0.0.0',
    port: Number(process.env['QUIC_PORT'] ?? 4433),
    config: DEFAULT_QUIC_CONFIG,
  };
}
