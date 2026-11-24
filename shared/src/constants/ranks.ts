// ============================================================
// UNO ULTRA — Rank tiers & MMR thresholds (Opzione A: 22 tier)
// ============================================================

import type { RankDivision, RankGroup, RankInfo } from '../types/rank.js';

export const RANK_TIERS = [
  'Bronze I',
  'Bronze II',
  'Bronze III',
  'Silver I',
  'Silver II',
  'Silver III',
  'Gold I',
  'Gold II',
  'Gold III',
  'Platinum I',
  'Platinum II',
  'Platinum III',
  'Diamond I',
  'Diamond II',
  'Diamond III',
  'Champion I',
  'Champion II',
  'Champion III',
  'Grand Champion I',
  'Grand Champion II',
  'Grand Champion III',
  'SSL',
] as const;

export type RankTier = (typeof RANK_TIERS)[number];

/**
 * MMR iniziale per nuovi profili (Opzione 2a).
 * I profili esistenti con mmr=200 restano validi in Bronze I (soglia Bronze II = 210).
 */
export const INITIAL_MMR = 0;
export const SSL_MMR_THRESHOLD = 1600;

/** Soglie inferiori per ogni tier (22 livelli, SSL >= 1600). */
export const MMR_THRESHOLDS: Record<RankTier, number> = {
  'Bronze I': 0,
  'Bronze II': 210,
  'Bronze III': 310,
  'Silver I': 400,
  'Silver II': 467,
  'Silver III': 534,
  'Gold I': 600,
  'Gold II': 667,
  'Gold III': 734,
  'Platinum I': 800,
  'Platinum II': 867,
  'Platinum III': 934,
  'Diamond I': 1000,
  'Diamond II': 1067,
  'Diamond III': 1134,
  'Champion I': 1200,
  'Champion II': 1267,
  'Champion III': 1334,
  'Grand Champion I': 1400,
  'Grand Champion II': 1467,
  'Grand Champion III': 1534,
  SSL: 1600,
};

export const RANK_COLORS: Record<RankGroup, string> = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#D39940',
  Platinum: '#D2E4E3',
  Diamond: '#7EE4F8',
  Champion: '#4A9CE1',
  'Grand Champion': '#FF4081',
  SSL: '#FFFFFF',
};

/** Tabella K-Factor base decrescente per stabilita ai rank alti. */
export const RANK_K_BASE_BRACKETS = [
  { minMMR: 1600, kBase: 20 },
  { minMMR: 1400, kBase: 24 },
  { minMMR: 1000, kBase: 28 },
  { minMMR: 600, kBase: 32 },
  { minMMR: 0, kBase: 40 },
] as const;

export function getKBase(mmr: number): number {
  for (const bracket of RANK_K_BASE_BRACKETS) {
    if (mmr >= bracket.minMMR) return bracket.kBase;
  }
  return 40;
}

/** Determina il tier dalla MMR. */
export function getRankFromMMR(mmr: number): RankTier {
  const safeMMR = Number.isFinite(mmr) ? Math.max(0, mmr) : 0;
  let tier: RankTier = 'Bronze I';
  for (const t of RANK_TIERS) {
    if (safeMMR >= MMR_THRESHOLDS[t]) tier = t;
  }
  return tier;
}

/** Alias retro-compatibile di getRankFromMMR. */
export const rankFromMMR = getRankFromMMR;

/** Restituisce i metadati completi del rank per un dato MMR. */
export function getRankInfo(mmr: number): RankInfo {
  const tier = getRankFromMMR(mmr);
  const idx = RANK_TIERS.indexOf(tier);
  const nextTier = idx >= 0 && idx + 1 < RANK_TIERS.length ? RANK_TIERS[idx + 1] : undefined;

  let group: RankGroup = 'SSL';
  let division: RankDivision = null;
  if (tier !== 'SSL') {
    const splitAt = tier.lastIndexOf(' ');
    group = tier.slice(0, splitAt) as RankGroup;
    division = tier.slice(splitAt + 1) as RankDivision;
  }

  return {
    tier,
    group,
    division,
    minMMR: MMR_THRESHOLDS[tier],
    maxMMR: nextTier ? MMR_THRESHOLDS[nextTier] - 1 : null,
    colorHex: RANK_COLORS[group],
  };
}
