// ============================================================
// UNO ULTRA Client — Page Visibility & Online/Offline Sync Lifecycle
// ============================================================

import { clearOfflineQueue, loadOfflineQueue } from '../state/storage-adapter.js';
import { syncOfflineBatch } from '../net/tcp/rest-client.js';
import { isAuthenticated } from '../state/profile-store.js';

export function attachLifecycleHooks(): () => void {
  const flushOffline = async (): Promise<void> => {
    if (!navigator.onLine || !isAuthenticated()) return;
    const events = loadOfflineQueue();
    if (events.length === 0) return;
    try {
      await syncOfflineBatch(events);
      clearOfflineQueue();
    } catch {
      // Retry on next reconnect
    }
  };

  const onOnline = (): void => {
    void flushOffline();
  };

  window.addEventListener('online', onOnline);
  void flushOffline();

  return () => {
    window.removeEventListener('online', onOnline);
  };
}
