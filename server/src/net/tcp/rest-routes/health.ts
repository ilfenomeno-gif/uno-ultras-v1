// ============================================================
// UNO ULTRA Server — Health check REST route
// ============================================================

import { Router } from 'express';
import { checkPostgresHealth } from '../../../persistence/postgres/client.js';
import { checkRedisHealth } from '../../../persistence/redis/client.js';
import { buildHealthReport } from '../../../observability/health-checks.js';
import { metrics } from '../../../observability/metrics.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const [postgres, redis] = await Promise.all([
    checkPostgresHealth(),
    checkRedisHealth(),
  ]);

  res.status(200).json({
    status: 'ok',
    service: 'uno-ultra-server',
    timestamp: new Date().toISOString(),
    dependencies: {
      postgres: postgres ? 'up' : 'down',
      redis: redis ? 'up' : 'down',
    },
  });
});

healthRouter.get('/detailed', async (_req, res) => {
  const report = await buildHealthReport();
  res.status(200).json(report);
});

healthRouter.get('/metrics', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(metrics.toPrometheusText());
});
