import { describe, expect, it } from 'vitest';
import {
  DAILY_CHALLENGES_POOL,
  GAME_MODES,
  LEGACY_TITLE_CATEGORIES,
  LEGACY_TITLES,
  LEGACY_TITLES_BY_ID,
  pickPrestigiousTitleForMMR,
  REALISTIC_BOT_PROFILES,
  SEASONAL_CHALLENGES_POOL,
  WEEKLY_CHALLENGES_POOL,
} from '@uno/shared';
import {
  buildFallbackTop100Entries,
  TOP100_MODES,
  TOP100_PLAYER_COUNTS,
} from '../src/ui/navigation/top100-helpers.js';

describe('15-Category Targhette, Realistic Bots, Sfide & Top 100 Mondiale', () => {
  it('imports all 15 targhette categories including Scopa, Burraco, Poker, Millemiglia & Legacy Seasons', () => {
    expect(LEGACY_TITLE_CATEGORIES).toHaveLength(15);
    expect(LEGACY_TITLES.length).toBeGreaterThanOrEqual(350);

    const seen = new Set<string>();
    for (const t of LEGACY_TITLES) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(seen.has(t.id)).toBe(false);
      seen.add(t.id);
      expect(LEGACY_TITLES_BY_ID[t.id]).toBe(t);
    }

    const byName = new Set(LEGACY_TITLES.map((t) => t.name));
    expect(byName.has('Protocollo S')).toBe(true);
    expect(byName.has('Flusso Sequenziale')).toBe(true);
    expect(byName.has('Punto di Non Ritorno')).toBe(true);
    expect(byName.has('Oltre la Barriera')).toBe(true);
    expect(byName.has('👑 ELITE UCS')).toBe(true);
    expect(LEGACY_TITLES.filter((t) => t.category === 'season1').length).toBeGreaterThanOrEqual(15);
    expect(LEGACY_TITLES.filter((t) => t.category === 'season2').length).toBeGreaterThanOrEqual(15);
  });

  it('provides 120 realistic bot profiles and scales title prestige with MMR', () => {
    expect(REALISTIC_BOT_PROFILES.length).toBeGreaterThanOrEqual(100);
    const botNames = REALISTIC_BOT_PROFILES.map((b) => b.name);
    expect(botNames).toContain('🗡️ DreadForce');
    expect(botNames).toContain('🤖 PikeKard');
    expect(botNames).toContain('🎭 GhostEdge');

    const topTitle = pickPrestigiousTitleForMMR(2100, 'uno', 0);
    const lowTitle = pickPrestigiousTitleForMMR(350, 'uno', 0);
    expect(topTitle.prestigeTier).toBe(5);
    expect(lowTitle.prestigeTier).toBe(1);
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

    const globalBoard = buildFallbackTop100Entries('global', 4);
    const uno1v1 = buildFallbackTop100Entries('uno', 2);
    const poker4p = buildFallbackTop100Entries('poker-texas', 4);
    expect(globalBoard).toHaveLength(100);
    expect(globalBoard[0]?.rank).toBe(1);
    expect(globalBoard[99]?.rank).toBe(100);
    expect(globalBoard[0]!.mmr).toBeGreaterThanOrEqual(globalBoard[99]!.mmr);
    expect(uno1v1).toHaveLength(100);
    expect(poker4p).toHaveLength(100);
    expect(uno1v1[0]?.rank).toBe(1);
    expect(uno1v1[99]?.rank).toBe(100);
    expect(uno1v1[0]!.mmr).toBeGreaterThanOrEqual(uno1v1[99]!.mmr);
  });
});
