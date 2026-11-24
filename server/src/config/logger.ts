// ============================================================
// UNO ULTRA Server — Pino structured logger
// ============================================================

import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  name: 'uno-ultra-server',
  level: env.LOG_LEVEL,
});
