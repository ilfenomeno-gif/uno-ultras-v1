// ============================================================
// UNO ULTRA Client — 3-Column Locker State & Pedestal Tests
// ============================================================

import { describe, expect, it } from 'vitest';
import type { ClientInventoryEntry, ClientLoadout } from '../src/state/inventory-store.js';
import {
  filterOwnedByCategory,
  getPedestalActionState,
  isItemEquippedInLoadout,
  LOCKER_CATEGORIES,
} from '../src/ui/navigation/locker-helpers.js';

describe('Locker 3-Column Helpers', () => {
  it('exposes the 6 exact locker categories including Tavoli and Casse', () => {
    expect(LOCKER_CATEGORIES.map((c) => c.id)).toEqual([
      'avatar',
      'card_back',
      'frame',
      'theme',
      'title',
      'crate',
    ]);
    expect(LOCKER_CATEGORIES.map((c) => c.label)).toEqual([
      'Avatar',
      'Dorsi Carte',
      'Cornici',
      'Tavoli',
      'Titoli',
      'Casse',
    ]);
  });

  it('filters owned inventory entries by category and excludes depleted entries', () => {
    const items: ClientInventoryEntry[] = [
      { itemId: 'avatar_neon_fox', category: 'avatar', quantity: 1 },
      { itemId: 'crate_bronze_100', category: 'crate', quantity: 2 },
      { itemId: 'crate_silver_500', category: 'crate', quantity: 0 },
      { itemId: 'theme_tokyo_rain', category: 'theme', quantity: 1 },
    ];

    expect(filterOwnedByCategory(items, 'avatar').map((i) => i.itemId)).toEqual([
      'avatar_neon_fox',
    ]);
    expect(filterOwnedByCategory(items, 'crate').map((i) => i.itemId)).toEqual([
      'crate_bronze_100',
    ]);
    expect(filterOwnedByCategory(items, 'frame')).toEqual([]);
  });

  it('detects equipped status across all 5 cosmetic slots and never for crates', () => {
    const loadout: ClientLoadout = {
      avatar: 'avatar_neon_fox',
      frame: 'frame_gold_pulse',
      cardStyle: 'back_arcade_grid',
      title: 'title_combo_king',
      theme: 'theme_tokyo_rain',
    };

    expect(isItemEquippedInLoadout('avatar_neon_fox', 'avatar', loadout)).toBe(true);
    expect(isItemEquippedInLoadout('avatar_cyber_dragon', 'avatar', loadout)).toBe(false);
    expect(isItemEquippedInLoadout('frame_gold_pulse', 'frame', loadout)).toBe(true);
    expect(isItemEquippedInLoadout('back_arcade_grid', 'card_back', loadout)).toBe(true);
    expect(isItemEquippedInLoadout('title_combo_king', 'title', loadout)).toBe(true);
    expect(isItemEquippedInLoadout('theme_tokyo_rain', 'theme', loadout)).toBe(true);
    expect(isItemEquippedInLoadout('crate_ssl_1000', 'crate', loadout)).toBe(false);
  });

  it('resolves pedestal CTA button state for Equipped, Equip, and Open Crate', () => {
    expect(getPedestalActionState('avatar', true)).toEqual({
      label: 'EQUIPAGGIATO',
      actionable: false,
    });
    expect(getPedestalActionState('avatar', false)).toEqual({
      label: 'EQUIPAGGIA',
      actionable: true,
    });
    expect(getPedestalActionState('crate', false)).toEqual({
      label: 'APRI CASSA',
      actionable: true,
    });
  });
});
