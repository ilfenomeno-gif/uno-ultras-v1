// ============================================================
// UNO ULTRA Client — Offline Storage Adapter & Sync Queue
// ============================================================

import type { OfflineSyncEvent } from '@uno/shared';

const OFFLINE_QUEUE_KEY = 'uno.offline.queue';
const CACHE_PREFIX = 'uno.cache.';

export function readStorageJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorageJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded — non-fatal
  }
}

export function loadOfflineQueue(): OfflineSyncEvent[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineSyncEvent[]) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineEvent(event: OfflineSyncEvent): void {
  const queue = loadOfflineQueue();
  queue.push(event);
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-25)));
  } catch {
    // Ignore storage limit errors
  }
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch {
    // ignore
  }
}
