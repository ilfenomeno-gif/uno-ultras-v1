// ============================================================
// UNO ULTRA Server — Unit/Integration Tests: PresenceService
// ============================================================

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PresenceService, type PresenceEvent } from '../../src/rooms/base/presence.js';

describe('PresenceService (IMP-006b)', () => {
  let service: PresenceService;

  beforeEach(() => {
    service = new PresenceService(300);
    service.clearMemoryStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('setOnline imposta lo stato su online', async () => {
    await service.setOnline('p1');
    expect(await service.getStatus('p1')).toBe('online');
  });

  it('setInGame imposta lo stato su ingame', async () => {
    await service.setInGame('p1', 'room-123');
    expect(await service.getStatus('p1')).toBe('ingame');
  });

  it('setOffline rimuove lo stato e getStatus ritorna offline', async () => {
    await service.setInGame('p1', 'room-123');
    await service.setOffline('p1');
    expect(await service.getStatus('p1')).toBe('offline');
  });

  it('listFriendsPresence gestisce correttamente un mix online/ingame/offline', async () => {
    await service.setOnline('f-online');
    await service.setInGame('f-ingame', 'room-77');

    const map = await service.listFriendsPresence(['f-online', 'f-ingame', 'f-offline']);
    expect(map.get('f-online')).toBe('online');
    expect(map.get('f-ingame')).toBe('ingame');
    expect(map.get('f-offline')).toBe('offline');
  });

  it('subscribeToPresence riceve eventi su setOnline/setInGame/setOffline e si scollega con unsubscribe', async () => {
    const received: PresenceEvent[] = [];
    const unsub = await service.subscribeToPresence('p1', (ev) => {
      received.push(ev);
    });

    await service.setOnline('p1');
    await service.setInGame('p1', 'room-42');
    await service.setOnline('other-player'); // filtrato
    await service.setOffline('p1');

    expect(received.map((e) => e.type)).toEqual(['online', 'ingame', 'offline']);
    expect(received[1]?.roomId).toBe('room-42');

    await unsub();
    await service.setOnline('p1');
    expect(received).toHaveLength(3);
  });

  it('scadenza TTL (300s) riporta getStatus a offline', async () => {
    vi.useFakeTimers();
    const baseTime = new Date('2026-11-23T20:00:00Z');
    vi.setSystemTime(baseTime);

    await service.setOnline('p-ttl');
    expect(await service.getStatus('p-ttl')).toBe('online');

    vi.advanceTimersByTime(299 * 1000);
    expect(await service.getStatus('p-ttl')).toBe('online');

    vi.advanceTimersByTime(2 * 1000);
    expect(await service.getStatus('p-ttl')).toBe('offline');
  });
});
