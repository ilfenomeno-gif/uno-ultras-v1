// ============================================================
// UNO ULTRA Client — Core Stores, Storage, Format & Router Unit Tests
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { ReactiveStore } from '../src/core/store.js';
import { Router } from '../src/core/router.js';
import { formatCardSymbol, formatColorLabel } from '../src/game-view/card-format.js';
import {
  clearSession,
  getProfile,
  getToken,
  isAuthenticated,
  loadFromStorage,
  patchProfile,
  saveSession,
} from '../src/state/profile-store.js';
import {
  getEconomySnapshot,
  setEconomySnapshot,
  subscribeEconomy,
} from '../src/state/inventory-store.js';
import {
  clearOfflineQueue,
  enqueueOfflineEvent,
  loadOfflineQueue,
} from '../src/state/storage-adapter.js';

function installBrowserMocks(): void {
  const mem = new Map<string, string>();
  const storageMock = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
    clear: () => mem.clear(),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storageMock, configurable: true });
  Object.defineProperty(globalThis, 'window', {
    value: {
      location: { hash: '#splash' },
      addEventListener: () => {},
    },
    configurable: true,
  });
}

describe('Client state & stores', () => {
  beforeEach(() => {
    installBrowserMocks();
    clearSession();
    clearOfflineQueue();
  });

  it('saves, patches, reloads and clears player profile session', () => {
    expect(isAuthenticated()).toBe(false);
    saveSession('jwt-abc', {
      id: 'p1',
      username: 'Alice',
      rankTier: 'Bronze I',
      mmr: 0,
      vcard: 100,
      battleCardLevel: 1,
      createdAt: '2026-11-24T00:00:00Z',
    });
    expect(isAuthenticated()).toBe(true);
    expect(getToken()).toBe('jwt-abc');

    patchProfile({ vcard: 250, mmr: 420 });
    expect(getProfile()?.vcard).toBe(250);

    loadFromStorage();
    expect(getProfile()?.mmr).toBe(420);

    clearSession();
    expect(isAuthenticated()).toBe(false);
    expect(getProfile()).toBeNull();
  });

  it('starts inventory store with zero fake currency and notifies subscribers', () => {
    const initial = getEconomySnapshot();
    expect(initial.vcard).toBe(0);
    expect(initial.tournamentCredits).toBe(0);

    let observedVCard = -1;
    const unsub = subscribeEconomy((snap) => {
      observedVCard = snap.vcard;
    });
    setEconomySnapshot({ ...initial, vcard: 500 });
    expect(observedVCard).toBe(500);
    unsub();
  });

  it('caps offline sync queue at 25 events cleanly', () => {
    for (let i = 0; i < 30; i++) {
      enqueueOfflineEvent({
        id: `ev-${i}`,
        kind: 'match_completed',
        mode: 'uno',
        won: i % 2 === 0,
        cardsPlayed: 12,
        xpDelta: 60,
        vcardDelta: 15,
        playedAt: '2026-11-24T12:00:00Z',
      });
    }
    const queue = loadOfflineQueue();
    expect(queue).toHaveLength(25);
    expect(queue[0]?.id).toBe('ev-5');
    clearOfflineQueue();
    expect(loadOfflineQueue()).toHaveLength(0);
  });

  it('notifies ReactiveStore subscribers and stops after unsubscribe', () => {
    const store = new ReactiveStore(10);
    const seen: number[] = [];
    const unsub = store.subscribe((v) => seen.push(v));
    store.set(20);
    unsub();
    store.set(30);
    expect(store.get()).toBe(30);
    expect(seen).toEqual([20]);
  });
});

describe('Client Router & Card Formatting', () => {
  beforeEach(() => {
    installBrowserMocks();
  });

  it('parses hash routes and notifies route subscribers', () => {
    const router = new Router();
    expect(router.getRoute()).toBe('splash');
    const visited: string[] = [];
    router.subscribe((r) => visited.push(r));
    router.navigate('negozio');
    expect(router.getRoute()).toBe('negozio');
    expect(visited).toEqual(['negozio']);
  });

  it('formats UNO card symbols and Italian color labels', () => {
    expect(formatCardSymbol({ id: 'r7', color: 'red', kind: 'number', value: 7 })).toBe('7');
    expect(formatCardSymbol({ id: 'wd4', color: 'wild', kind: 'wild_draw4' })).toBe('+4');
    expect(formatColorLabel('blue')).toBe('Blu');
    expect(formatColorLabel('unknown')).toBe('—');
  });
});
