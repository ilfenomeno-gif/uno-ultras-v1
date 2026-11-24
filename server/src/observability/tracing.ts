// ============================================================
// UNO ULTRA Server — Correlation ID & Lightweight Span Tracer
// ============================================================

import { randomUUID } from 'node:crypto';
import { logger } from '../config/logger.js';

export interface TraceSpan {
  readonly traceId: string;
  readonly spanName: string;
  readonly startedAtMs: number;
  end(meta?: Record<string, unknown>): number;
}

export function startSpan(spanName: string, traceId = randomUUID()): TraceSpan {
  const startedAtMs = Date.now();
  return {
    traceId,
    spanName,
    startedAtMs,
    end(meta) {
      const durationMs = Date.now() - startedAtMs;
      logger.debug({ traceId, spanName, durationMs, ...meta }, 'trace span completed');
      return durationMs;
    },
  };
}
