// ============================================================
// UNO ULTRA Client — Active Match & Post-Match Rematch Store
// ============================================================

import type { CustomMatchConfig, GameMode } from '@uno/shared';

export interface ActiveMatchMeta {
  roomId: string;
  mode: GameMode;
  ranked: boolean;
  isSpectator: boolean;
  customConfig?: CustomMatchConfig;
  rematchVotes: number;
}

let currentMatch: ActiveMatchMeta | null = null;
const listeners = new Set<(meta: ActiveMatchMeta | null) => void>();

export function setActiveMatchMeta(meta: ActiveMatchMeta | null): void {
  currentMatch = meta;
  for (const l of listeners) l(currentMatch);
}

export function getActiveMatchMeta(): ActiveMatchMeta | null {
  return currentMatch;
}

export function subscribeMatchMeta(listener: (meta: ActiveMatchMeta | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
