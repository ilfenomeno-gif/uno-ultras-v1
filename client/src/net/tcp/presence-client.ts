// ============================================================
// UNO ULTRA Client — Real-Time Presence Client
// ============================================================

import type { Room } from 'colyseus.js';
import { TCP_CHANNELS } from '@uno/shared';

export type PresenceStatus = 'online' | 'ingame' | 'offline';

export interface PresenceUpdate {
  playerId: string;
  status: PresenceStatus;
  roomId?: string;
  ts: number;
}

interface PresenceSubscription {
  ids: Set<string>;
  cb: (update: PresenceUpdate) => void;
}

export class PresenceClient {
  private readonly statuses = new Map<string, PresenceStatus>();
  private readonly subscriptions = new Set<PresenceSubscription>();
  private readonly roomUnsubs: Array<() => void> = [];

  connect(room?: Room | null): void {
    this.detachRoomHandlers();
    if (!room) return;

    const handleUpdate = (update: PresenceUpdate): void => {
      if (!update || typeof update.playerId !== 'string') return;
      this.statuses.set(update.playerId, update.status);
      for (const sub of this.subscriptions) {
        if (sub.ids.size === 0 || sub.ids.has(update.playerId)) {
          sub.cb(update);
        }
      }
    };

    const handleSnapshot = (updates: PresenceUpdate[]): void => {
      if (!Array.isArray(updates)) return;
      for (const item of updates) {
        handleUpdate(item);
      }
    };

    const offUpdate = room.onMessage<PresenceUpdate>(
      TCP_CHANNELS.PRESENCE_UPDATE,
      handleUpdate
    ) as unknown;
    const offSnapshot = room.onMessage<PresenceUpdate[]>(
      TCP_CHANNELS.PRESENCE_SNAPSHOT,
      handleSnapshot
    ) as unknown;

    if (typeof offUpdate === 'function') {
      this.roomUnsubs.push(offUpdate as () => void);
    }
    if (typeof offSnapshot === 'function') {
      this.roomUnsubs.push(offSnapshot as () => void);
    }
  }

  subscribe(
    playerIds: readonly string[],
    cb: (update: PresenceUpdate) => void
  ): () => void {
    const entry: PresenceSubscription = {
      ids: new Set(playerIds),
      cb,
    };
    this.subscriptions.add(entry);
    return () => {
      this.subscriptions.delete(entry);
    };
  }

  unsubscribe(): void {
    this.detachRoomHandlers();
    this.subscriptions.clear();
  }

  getStatus(playerId: string): PresenceStatus {
    return this.statuses.get(playerId) ?? 'offline';
  }

  private detachRoomHandlers(): void {
    for (const off of this.roomUnsubs) {
      off();
    }
    this.roomUnsubs.length = 0;
  }
}

export const presenceClient = new PresenceClient();
