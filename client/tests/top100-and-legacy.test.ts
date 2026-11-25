import { describe, expect, it } from 'vitest';
import {
  DAILY_CHALLENGES_POOL,
  GAME_MODES,
  LEGACY_TITLES,
  LEGACY_TITLES_BY_ID,
  SEASONAL_CHALLENGES_POOL,
  WEEKLY_CHALLENGES_POOL,
} from '@uno/shared';
import {
  buildFallbackTop100Entries,
  TOP100_MODES,
  TOP100_PLAYER_COUNTS,
} from '../src/ui/navigation/top100-helpers.js';

describe('Imported Legacy Targhette, Sfide & Top 100 Mondiale', () => {
  it('imports all legacy targhette with unique IDs <= 60 chars and lookup map', () => {
    expect(LEGACY_TITLES.length).toBeGreaterThan(250);
    const seen = new Set<string>();
    for (const t of LEGACY_TITLES) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.name.length).toBeGreaterThan(0);
      expect(seen.has(t.id)).toBe(false);
      seen.add(t.id);
      expect(LEGACY_TITLES_BY_ID[t.id]).toBe(t);
    }
  });

  it('merges imported daily, weekly and seasonal challenges cleanly with DB-safe IDs', () => {
    const all = [
      ...DAILY_CHALLENGES_POOL,
      ...WEEKLY_CHALLENGES_POOL,
      ...SEASONAL_CHALLENGES_POOL,
    ];
    expect(all.length).toBeGreaterThan(45);
    const seen = new Set<string>();
    for (const ch of all) {
      expect(ch.id.length).toBeLessThanOrEqual(60);
      expect(seen.has(ch.id)).toBe(false);
      seen.add(ch.id);
      expect(ch.target).toBeGreaterThan(0);
    }
  });

  it('exposes all 8 game modes and 1v1 / 3 Giocatori / 4 Giocatori formats for Top 100 Mondiale', () => {
    expect(TOP100_MODES.map((m) => m.id)).toEqual(expect.arrayContaining([...GAME_MODES]));
    expect(TOP100_MODES).toHaveLength(GAME_MODES.length);
    expect(TOP100_PLAYER_COUNTS.map((p) => p.label)).toEqual([
      '1v1',
      '3 Giocatori',
      '4 Giocatori',
    ]);

    const uno1v1 = buildFallbackTop100Entries('uno', 2);
    const poker4p = buildFallbackTop100Entries('poker-texas', 4);
    expect(uno1v1).toHaveLength(100);
    expect(poker4p).toHaveLength(100);
    expect(uno1v1[0]?.rank).toBe(1);
    expect(uno1v1[99]?.rank).toBe(100);
    expect(uno1v1[0]?.username).not.toBe(poker4p[0]?.username);
  });
});
