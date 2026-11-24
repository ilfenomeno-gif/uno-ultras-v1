// ============================================================
// UNO ULTRA — 8 game modes
// ============================================================

export const GAME_MODES = [
  'uno',
  'blackjack',
  'scala40',
  'ruba-mazzetto',
  'scopa',
  'poker-texas',
  'burraco',
  'mille-miglia',
] as const;

export type GameMode = (typeof GAME_MODES)[number];

export const PLAYER_COUNTS = [1, 2, 3, 4] as const;
export type PlayerCount = (typeof PLAYER_COUNTS)[number];

/** Modalita supportate dal motore UNO core (le altre sono mini-games). */
export const ENGINE_MODES = ['uno'] as const;
export type EngineMode = (typeof ENGINE_MODES)[number];