// ============================================================
// UNO ULTRA — Rank / MMR contracts
// ============================================================

import type { RankTier } from '../constants/ranks.js';

export type { RankTier };

export type RankDivision = 'I' | 'II' | 'III' | null;

export type RankGroup =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Champion'
  | 'Grand Champion'
  | 'SSL';

export interface RankInfo {
  readonly tier: RankTier;
  readonly group: RankGroup;
  readonly division: RankDivision;
  readonly minMMR: number;
  readonly maxMMR: number | null;
  readonly colorHex: string;
}

export interface RankProgress {
  readonly tier: RankTier;
  readonly mmr: number;
  /** 0-100: percentuale verso il tier successivo. */
  readonly progressPercent: number;
  /** MMR mancante al tier successivo (0 se e SSL). */
  readonly mmrToNextTier: number;
}

export interface MMRDelta {
  readonly before: number;
  readonly after: number;
  readonly delta: number;
  readonly reason: 'win' | 'loss' | 'draw' | 'forfeit';
}

export interface EloCalculationInput {
  readonly playerMMR: number;
  readonly opponentMMR: number;
  readonly won: boolean;
  /** Moltiplicatore playlist opzionale (default 1.0). */
  readonly playlistMultiplier?: number;
}

export interface EloCalculationResult {
  readonly delta: number;
  readonly newMMR: number;
  readonly previousTier: RankTier;
  readonly newTier: RankTier;
  readonly promoted: boolean;
  readonly kBase: number;
  readonly kEff: number;
  readonly expected: number;
  readonly upsetBonus: number;
}
