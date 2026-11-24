// ============================================================
// UNO ULTRA Server — Colyseus WebSocket Server Factory
// ============================================================

import type http from 'node:http';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { RedisPresence } from '@colyseus/redis-presence';
import { RedisDriver } from '@colyseus/redis-driver';
import { env } from '../../config/env.js';

export interface CreateColyseusOptions {
  useRedis: boolean;
}

export function createColyseusServer(
  httpServer: http.Server,
  opts: CreateColyseusOptions
): Server {
  const transport = new WebSocketTransport({
    server: httpServer,
  });

  if (!opts.useRedis) {
    return new Server({ transport });
  }

  const redisOpts = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    enableReadyCheck: false,
    ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
  };

  return new Server({
    transport,
    presence: new RedisPresence(redisOpts),
    driver: new RedisDriver(redisOpts),
  });
}
