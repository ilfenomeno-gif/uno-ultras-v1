// ============================================================
// UNO ULTRA Server — Redis client singleton
// ============================================================

import { createClient, type RedisClientType } from 'redis';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

let redisClient: RedisClientType | null = null;

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    const authSegment = env.REDIS_PASSWORD ? `:${encodeURIComponent(env.REDIS_PASSWORD)}@` : '';
    const url = `redis://${authSegment}${env.REDIS_HOST}:${env.REDIS_PORT}`;

    redisClient = createClient({
      url,
      socket: {
        connectTimeout: 1500,
        reconnectStrategy: (retries) => (retries > 2 ? false : 300),
      },
    });
    redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis client error');
    });
  }
  return redisClient;
}

export async function connectRedis(): Promise<RedisClientType> {
  const client = getRedisClient();
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client.isOpen) return false;
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
  redisClient = null;
}
