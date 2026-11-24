// ============================================================
// UNO ULTRA Client — Pure Locker Helpers & Category Contracts
// ============================================================

import type { ClientInventoryEntry, ClientLoadout } from '../../state/inventory-store.js';

export type LockerCategoryId =
  | 'avatar'
  | 'card_back'
  | 'frame'
  | 'theme'
  | 'title'
  | 'crate';

export interface LockerCategoryDef {
  readonly id: LockerCategoryId;
  readonly label: string;
  readonly shortIcon: string;
}

export const LOCKER_CATEGORIES: readonly LockerCategoryDef[] = [
  { id: 'avatar', label: 'Avatar', shortIcon: '◈' },
  { id: 'card_back', label: 'Dorsi Carte', shortIcon: '▤' },
  { id: 'frame', label: 'Cornici', shortIcon: '▣' },
  { id: 'theme', label: 'Tavoli', shortIcon: '⬡' },
  { id: 'title', label: 'Titoli', shortIcon: '★' },
  { id: 'crate', label: 'Casse', shortIcon: '◫' },
];

export function filterOwnedByCategory(
  items: readonly ClientInventoryEntry[],
  category: LockerCategoryId
): ClientInventoryEntry[] {
  return items.filter((item) => item.category === category && item.quantity > 0);
}

export function isItemEquippedInLoadout(
  itemId: string,
  category: LockerCategoryId,
  loadout: ClientLoadout
): boolean {
  switch (category) {
    case 'avatar':
      return loadout.avatar === itemId;
    case 'frame':
      return loadout.frame === itemId;
    case 'card_back':
      return loadout.cardStyle === itemId;
    case 'title':
      return loadout.title === itemId;
    case 'theme':
      return loadout.theme === itemId;
    case 'crate':
      return false;
  }
}

export interface PedestalActionState {
  readonly label: 'APRI CASSA' | 'EQUIPAGGIATO' | 'EQUIPAGGIA';
  readonly actionable: boolean;
}

export function getPedestalActionState(
  category: LockerCategoryId,
  equipped: boolean
): PedestalActionState {
  if (category === 'crate') {
    return { label: 'APRI CASSA', actionable: true };
  }
  if (equipped) {
    return { label: 'EQUIPAGGIATO', actionable: false };
  }
  return { label: 'EQUIPAGGIA', actionable: true };
}
