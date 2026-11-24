// ============================================================
// UNO ULTRA Server — Distributed Rate Limiter (Redis + fallback)
// ============================================================

import type { NextFunction, Request, Response } from 'express';
import { getRedisClient } from '../persistence/redis/client.js';

export interface RateLimiterOptions {
  scope: string;
  max: number;
  windowSeconds: number;
  keyFn?: (req: Request) => string;
}

interface MemoryBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, MemoryBucket>();

export function clearMemoryRateLimits(): void {
  memoryBuckets.clear();
}

export function createRateLimiter(opts: RateLimiterOptions) {
  const getKey =
    opts.keyFn ?? ((req: Request) => req.ip || req.socket.remoteAddress || 'unknown');

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = getKey(req);
    const key = `ratelimit:${opts.scope}:${id}`;

    try {
      const redis = getRedisClient();
      if (redis.isOpen) {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, opts.windowSeconds);
        }
        if (count > opts.max) {
          const ttl = await redis.ttl(key);
          res.setHeader('Retry-After', String(Math.max(1, ttl)));
          res.status(429).json({ error: 'Troppe richieste, riprova tra poco' });
          return;
        }
        next();
        return;
      }
    } catch {
      // Fallback in-memory se Redis non risponde
    }

    const now = Date.now();
    const existing = memoryBuckets.get(key);
    if (!existing || now >= existing.resetAt) {
      memoryBuckets.set(key, {
        count: 1,
        resetAt: now + opts.windowSeconds * 1000,
      });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > opts.max) {
      const retrySec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retrySec));
      res.status(429).json({ error: 'Troppe richieste, riprova tra poco' });
      return;
    }

    next();
  };
}
