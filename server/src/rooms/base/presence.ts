// ============================================================
// UNO ULTRA Server — Presence Service (Redis + in-memory fallback)
// ============================================================

import { EventEmitter } from 'node:events';
import type { RedisClientType } from 'redis';
import { getRedisClient } from '../../persistence/redis/client.js';
import { logger } from '../../config/logger.js';

export type PresenceStatus = 'online' | 'ingame' | 'offline';

export interface PresenceRecord {
  status: Exclude<PresenceStatus, 'offline'>;
  roomId?: string;
  ts: number;
}

export interface PresenceEvent {
  type: PresenceStatus;
  playerId: string;
  roomId?: string;
  ts: number;
}

const PRESENCE_KEY_PREFIX = 'presence:user:';
const PRESENCE_EVENTS_CHANNEL = 'presence:events';
export const DEFAULT_PRESENCE_TTL_SECONDS = 300;

interface MemoryPresenceEntry {
  record: PresenceRecord;
  expiresAtMs: number;
}

export class PresenceService {
  private readonly memoryStore = new Map<string, MemoryPresenceEntry>();
  private readonly localBus = new EventEmitter();

  constructor(private readonly ttlSeconds: number = DEFAULT_PRESENCE_TTL_SECONDS) {
    this.localBus.setMaxListeners(100);
  }

  async setOnline(playerId: string, roomId?: string): Promise<void> {
    const ts = Date.now();
    const record: PresenceRecord = {
      status: 'online',
      ts,
      ...(roomId !== undefined ? { roomId } : {}),
    };
    await this.writeState(playerId, record);
    await this.publishEvent({
      type: 'online',
      playerId,
      ts,
      ...(roomId !== undefined ? { roomId } : {}),
    });
  }

  async setInGame(playerId: string, roomId: string): Promise<void> {
    const ts = Date.now();
    const record: PresenceRecord = {
      status: 'ingame',
      roomId,
      ts,
    };
    await this.writeState(playerId, record);
    await this.publishEvent({
      type: 'ingame',
      playerId,
      roomId,
      ts,
    });
  }

  async setOffline(playerId: string): Promise<void> {
    const ts = Date.now();
    this.memoryStore.delete(playerId);

    const redis = getRedisClient();
    if (redis.isOpen) {
      try {
        await redis.del(`${PRESENCE_KEY_PREFIX}${playerId}`);
      } catch (err) {
        logger.warn({ err, playerId }, 'Presence Redis DEL failed');
      }
    }

    await this.publishEvent({
      type: 'offline',
      playerId,
      ts,
    });
  }

  async touchOnline(playerId: string): Promise<Exclude<PresenceStatus, 'offline'>> {
    const existing = await this.readRecord(playerId);
    const ts = Date.now();
    if (existing?.status === 'ingame') {
      await this.writeState(playerId, {
        status: 'ingame',
        ts,
        ...(existing.roomId !== undefined ? { roomId: existing.roomId } : {}),
      });
      return 'ingame';
    }
    if (existing?.status === 'online') {
      await this.writeState(playerId, {
        status: 'online',
        ts,
        ...(existing.roomId !== undefined ? { roomId: existing.roomId } : {}),
      });
      return 'online';
    }
    await this.setOnline(playerId);
    return 'online';
  }

  async getStatus(playerId: string): Promise<PresenceStatus> {
    const record = await this.readRecord(playerId);
    return record?.status ?? 'offline';
  }

  private async readRecord(playerId: string): Promise<PresenceRecord | null> {
    const redis = getRedisClient();
    if (redis.isOpen) {
      try {
        const raw = await redis.get(`${PRESENCE_KEY_PREFIX}${playerId}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<PresenceRecord>;
        if (parsed.status === 'online' || parsed.status === 'ingame') {
          return {
            status: parsed.status,
            ts: typeof parsed.ts === 'number' ? parsed.ts : Date.now(),
            ...(typeof parsed.roomId === 'string' ? { roomId: parsed.roomId } : {}),
          };
        }
        return null;
      } catch (err) {
        logger.warn({ err, playerId }, 'Presence Redis GET failed; checking memory fallback');
      }
    }

    const entry = this.memoryStore.get(playerId);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAtMs) {
      this.memoryStore.delete(playerId);
      return null;
    }
    return entry.record;
  }

  async listFriendsPresence(
    friendIds: readonly string[]
  ): Promise<Map<string, PresenceStatus>> {
    const result = new Map<string, PresenceStatus>();
    if (friendIds.length === 0) return result;

    const statuses = await Promise.all(friendIds.map((id) => this.getStatus(id)));
    friendIds.forEach((id, idx) => {
      result.set(id, statuses[idx] ?? 'offline');
    });
    return result;
  }

  async subscribeToPresence(
    userId: string,
    callback: (event: PresenceEvent) => void
  ): Promise<() => Promise<void> | void> {
    const localHandler = (ev: PresenceEvent): void => {
      if (ev.playerId === userId || userId === '*') {
        callback(ev);
      }
    };

    const redis = getRedisClient();
    if (redis.isOpen) {
      let subClient: RedisClientType | null = null;
      try {
        subClient = redis.duplicate();
        await subClient.connect();
        await subClient.subscribe(PRESENCE_EVENTS_CHANNEL, (message) => {
          try {
            const ev = JSON.parse(message) as PresenceEvent;
            localHandler(ev);
          } catch {
            // Ignora payload malformati sul bus Redis
          }
        });
        return async () => {
          if (subClient && subClient.isOpen) {
            await subClient.unsubscribe(PRESENCE_EVENTS_CHANNEL);
            await subClient.quit();
          }
        };
      } catch (err) {
        logger.warn({ err }, 'Redis presence subscribe failed; falling back to local bus');
        if (subClient && subClient.isOpen) {
          await subClient.quit().catch(() => undefined);
        }
      }
    }

    this.localBus.on(PRESENCE_EVENTS_CHANNEL, localHandler);
    return () => {
      this.localBus.off(PRESENCE_EVENTS_CHANNEL, localHandler);
    };
  }

  clearMemoryStore(): void {
    this.memoryStore.clear();
  }

  private async writeState(playerId: string, record: PresenceRecord): Promise<void> {
    const ttl = Math.max(1, Math.ceil(this.ttlSeconds));
    this.memoryStore.set(playerId, {
      record,
      expiresAtMs: Date.now() + this.ttlSeconds * 1000,
    });

    const redis = getRedisClient();
    if (redis.isOpen) {
      try {
        await redis.set(`${PRESENCE_KEY_PREFIX}${playerId}`, JSON.stringify(record), {
          EX: ttl,
        });
      } catch (err) {
        logger.warn({ err, playerId }, 'Presence Redis SET failed');
      }
    }
  }

  private async publishEvent(event: PresenceEvent): Promise<void> {
    const redis = getRedisClient();
    if (redis.isOpen) {
      try {
        await redis.publish(PRESENCE_EVENTS_CHANNEL, JSON.stringify(event));
        return;
      } catch (err) {
        logger.warn({ err }, 'Presence Redis PUBLISH failed; emitting locally');
      }
    }
    this.localBus.emit(PRESENCE_EVENTS_CHANNEL, event);
  }
}

export const presenceService = new PresenceService();
