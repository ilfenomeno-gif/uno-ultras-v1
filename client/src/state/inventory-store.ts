// ============================================================
// UNO ULTRA Client — Inventory, Wallet & Loadout Store
// ============================================================

import { readStorageJson, writeStorageJson } from './storage-adapter.js';

export interface ClientInventoryEntry {
  itemId: string;
  category: string;
  quantity: number;
}

export interface ClientLoadout {
  avatar: string;
  frame: string;
  cardStyle: string;
  title: string;
  theme?: string;
}

export interface EconomyClientSnapshot {
  vcard: number;
  tournamentCredits: number;
  items: ClientInventoryEntry[];
  loadout: ClientLoadout;
}

const DEFAULT_SNAPSHOT: EconomyClientSnapshot = {
  vcard: 0,
  tournamentCredits: 0,
  items: [],
  loadout: {
    avatar: 'avatar_default',
    frame: 'frame_default',
    cardStyle: 'back_default',
    title: 't1',
    theme: 'theme_default',
  },
};

let snapshot: EconomyClientSnapshot = readStorageJson('economy', DEFAULT_SNAPSHOT);
const listeners = new Set<(snap: EconomyClientSnapshot) => void>();

export function getEconomySnapshot(): EconomyClientSnapshot {
  return snapshot;
}

export function setEconomySnapshot(next: EconomyClientSnapshot): void {
  snapshot = next;
  writeStorageJson('economy', snapshot);
  for (const l of listeners) l(snapshot);
}

export function subscribeEconomy(listener: (snap: EconomyClientSnapshot) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
