// ============================================================
// UNO ULTRA Server — Aggregated Health Checks (DB + Redis + Metrics)
// ============================================================

import { checkPostgresHealth } from '../persistence/postgres/client.js';
import { checkRedisHealth } from '../persistence/redis/client.js';
import { featureFlags } from '../config/feature-flags.js';
import { metrics } from './metrics.js';

export interface SystemHealthReport {
  status: 'ok' | 'degraded';
  uptimeSec: number;
  dependencies: {
    postgres: 'up' | 'down';
    redis: 'up' | 'down';
  };
  flags: {
    geminiBots: boolean;
    udpTelemetry: boolean;
    tournaments: boolean;
  };
  metrics: ReturnType<typeof metrics.snapshot>;
}

export async function buildHealthReport(): Promise<SystemHealthReport> {
  const [pg, redis] = await Promise.all([checkPostgresHealth(), checkRedisHealth()]);
  return {
    status: pg && redis ? 'ok' : 'degraded',
    uptimeSec: Math.round(process.uptime()),
    dependencies: {
      postgres: pg ? 'up' : 'down',
      redis: redis ? 'up' : 'down',
    },
    flags: {
      geminiBots: featureFlags.ENABLE_GEMINI_BOTS,
      udpTelemetry: featureFlags.ENABLE_UDP_TELEMETRY,
      tournaments: featureFlags.ENABLE_TOURNAMENTS,
    },
    metrics: metrics.snapshot(),
  };
}
