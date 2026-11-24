// ============================================================
// UNO ULTRA Server — Unreliable UDP Telemetry Receiver
// ============================================================

import dgram from 'node:dgram';
import { decodeBinary, UDP_CHANNELS } from '@uno/shared';
import { logger } from '../../config/logger.js';
import { metrics } from '../../observability/metrics.js';

export interface TelemetryPacket {
  matchId: string;
  playerId: string;
  rttMs: number;
  packetLoss: number;
  jitterMs: number;
}

export class UdpTelemetryServer {
  private socket: dgram.Socket | null = null;
  private readonly latestStats = new Map<string, TelemetryPacket & { updatedAtMs: number }>();
  private static readonly MAX_ENTRIES = 2000;
  private static readonly TTL_MS = 5 * 60_000;

  start(port = Number(process.env['UDP_TELEMETRY_PORT'] ?? 41234)): Promise<number> {
    if (this.socket) return Promise.resolve(port);
    return new Promise((resolve, reject) => {
      const sock = dgram.createSocket('udp4');
      sock.on('error', (err) => {
        logger.warn({ err }, 'UDP Telemetry socket error');
        if (!this.socket) reject(err);
      });
      sock.on('message', (msg, rinfo) => {
        try {
          const decoded = decodeBinary<TelemetryPacket>(new Uint8Array(msg));
          metrics.inc('udp_telemetry_packets_total');
          if (decoded.channel === UDP_CHANNELS.PING) {
            sock.send(msg, rinfo.port, rinfo.address);
            return;
          }
          const p = decoded.payload;
          if (
            decoded.channel === UDP_CHANNELS.TELEMETRY &&
            typeof p?.playerId === 'string' &&
            p.playerId.length > 0 &&
            p.playerId.length <= 80 &&
            Number.isFinite(p.rttMs) &&
            p.rttMs >= 0 &&
            p.rttMs <= 10_000
          ) {
            const now = Date.now();
            if (this.latestStats.size >= UdpTelemetryServer.MAX_ENTRIES) {
              for (const [k, v] of this.latestStats) {
                if (now - v.updatedAtMs > UdpTelemetryServer.TTL_MS) this.latestStats.delete(k);
              }
              if (this.latestStats.size >= UdpTelemetryServer.MAX_ENTRIES) {
                const oldest = this.latestStats.keys().next().value;
                if (oldest) this.latestStats.delete(oldest);
              }
            }
            this.latestStats.set(p.playerId, { ...p, updatedAtMs: now });
          }
        } catch {
          metrics.inc('udp_telemetry_malformed_total');
        }
      });
      sock.bind(port, () => {
        this.socket = sock;
        const addr = sock.address();
        const boundPort = typeof addr === 'string' ? port : addr.port;
        logger.info({ port: boundPort }, 'UDP Telemetry server listening');
        resolve(boundPort);
      });
    });
  }

  getLatestForPlayer(playerId: string): TelemetryPacket | null {
    const entry = this.latestStats.get(playerId);
    if (!entry) return null;
    if (Date.now() - entry.updatedAtMs > UdpTelemetryServer.TTL_MS) {
      this.latestStats.delete(playerId);
      return null;
    }
    return entry;
  }

  async stop(): Promise<void> {
    if (!this.socket) return;
    const sock = this.socket;
    this.socket = null;
    await new Promise<void>((resolve) => sock.close(() => resolve()));
  }
}

export const telemetryUdpServer = new UdpTelemetryServer();
