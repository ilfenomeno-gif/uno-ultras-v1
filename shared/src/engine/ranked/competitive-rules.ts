// ============================================================
// UNO ULTRA — Competitive Rank Rules Engine
// (Sub-divisions, Placement Anti-Smurf Calibration,
//  Weighted Party Skill, Disparity Check & Abandonment Penalty)
// ============================================================

import type { GameMode } from '../../constants/game-modes.js';
import { getRankFromMMR, getRankInfo, RANK_TIERS, type RankTier } from '../../constants/ranks.js';
import { calculateEloDelta } from './elo.js';

export const PLACEMENT_MATCHES_REQUIRED = 10;
export const MAX_UNDERSIZED_PARTY_TIER_GAP = 3;
export const CHAMPION_MMR_THRESHOLD = 1200;
export const ABANDON_BAN_MINUTES = [5, 10, 20, 60] as const;
export const FIRST_LEAVER_EXTRA_MMR_PENALTY = 15;

export type RankSubDivision = 'I' | 'II' | 'III' | 'IV' | null;

export interface PartyDisparityCheckInput {
  readonly memberMmrs: readonly number[];
  readonly targetPlayers: number;
  readonly mode: GameMode;
  readonly ranked: boolean;
  readonly isTournament?: boolean;
}

export interface PartyDisparityCheckResult {
  readonly allowed: boolean;
  readonly enforced: boolean;
  readonly tierGap: number;
  readonly maxAllowedGap: number;
  readonly minTier: RankTier;
  readonly maxTier: RankTier;
  readonly reason?: string;
}

export interface AntiSmurfCalibrationInput {
  readonly currentPlaylistMmr: number;
  readonly matchesPlayedAfter: number;
  readonly otherCompetitiveMmrs: readonly number[];
}

export interface AntiSmurfCalibrationResult {
  readonly applied: boolean;
  readonly calibratedMmr: number;
  readonly bonusMmr: number;
  readonly expectedSkillMmr: number;
}

export interface AbandonPenaltyInput {
  readonly playerMMR: number;
  readonly opponentMMR: number;
  readonly isFirstLeaver: boolean;
}

export interface AbandonPenaltyResult {
  readonly delta: number;
  readonly newMMR: number;
  readonly newTier: RankTier;
  readonly extraFirstLeaverPenalty: number;
}

/**
 * Calcola la sotto-divisione intra-tier (I..IV) all'interno di un grado.
 * SSL (MMR >= 1600) non ha divisioni (null).
 */
export function getSubDivision(mmr: number): RankSubDivision {
  const safe = Number.isFinite(mmr) ? Math.max(0, mmr) : 0;
  const info = getRankInfo(safe);
  if (info.maxMMR === null) return null;
  const span = Math.max(1, info.maxMMR - info.minMMR + 1);
  const ratio = Math.min(0.9999, Math.max(0, (safe - info.minMMR) / span));
  const quartile = Math.floor(ratio * 4);
  const labels: readonly ('I' | 'II' | 'III' | 'IV')[] = ['I', 'II', 'III', 'IV'];
  return labels[quartile] ?? 'I';
}

/**
 * Calcola l'abilità effettiva di un gruppo con media ponderata:
 * - Casual: più vicina alla media aritmetica del gruppo.
 * - Competitive sotto Champion: vicina alla media se i gradi sono simili, sbilanciata verso il massimo se il divario è ampio.
 * - Competitive con almeno un membro Champion I+ (>= 1200 MMR): peso predominante al giocatore più alto.
 */
export function computeWeightedPartyMMR(
  memberMmrs: readonly number[],
  opts: { ranked: boolean },
): number {
  if (memberMmrs.length === 0) return 0;
  const sanitized = memberMmrs.map((m) => (Number.isFinite(m) ? Math.max(0, m) : 0));
  if (sanitized.length === 1) return Math.round(sanitized[0]!);

  const sum = sanitized.reduce((acc, v) => acc + v, 0);
  const avg = sum / sanitized.length;
  const min = Math.min(...sanitized);
  const max = Math.max(...sanitized);
  const spread = max - min;

  if (!opts.ranked) {
    return Math.round(0.75 * avg + 0.25 * max);
  }

  if (max >= CHAMPION_MMR_THRESHOLD) {
    return Math.round(0.85 * max + 0.15 * avg);
  }

  const highWeight = Math.min(0.72, 0.25 + (spread / 600) * 0.47);
  return Math.round(avg + highWeight * (max - avg));
}

/**
 * Controlla la restrizione di dislivello (massimo 3 gradi) per gruppi sottodimensionati
 * in playlist standard competitive (es. 2 giocatori che cercano in 3G/4G UNO o Torneo).
 * Non si applica in casual, 1v1, gruppi completi o playlist extra (mini-giochi).
 */
export function checkPartyRankDisparity(
  input: PartyDisparityCheckInput,
): PartyDisparityCheckResult {
  const safeMmrs = input.memberMmrs.length > 0 ? input.memberMmrs : [0];
  const tierIndices = safeMmrs.map((m) => RANK_TIERS.indexOf(getRankFromMMR(m)));
  const minIdx = Math.max(0, Math.min(...tierIndices));
  const maxIdx = Math.max(0, Math.max(...tierIndices));
  const minTier = RANK_TIERS[minIdx] ?? 'Bronze I';
  const maxTier = RANK_TIERS[maxIdx] ?? 'Bronze I';
  const tierGap = maxIdx - minIdx;

  const isUndersized = safeMmrs.length >= 2 && safeMmrs.length < input.targetPlayers;
  const enforced =
    isUndersized && ((input.ranked && input.mode === 'uno') || Boolean(input.isTournament));

  if (enforced && tierGap > MAX_UNDERSIZED_PARTY_TIER_GAP) {
    return {
      allowed: false,
      enforced: true,
      tierGap,
      maxAllowedGap: MAX_UNDERSIZED_PARTY_TIER_GAP,
      minTier,
      maxTier,
      reason: `Dislivello di grado troppo elevato (${minTier} vs ${maxTier}: ${tierGap} livelli). Per i gruppi incompleti il limite massimo è ${MAX_UNDERSIZED_PARTY_TIER_GAP} livelli.`,
    };
  }

  return {
    allowed: true,
    enforced,
    tierGap,
    maxAllowedGap: MAX_UNDERSIZED_PARTY_TIER_GAP,
    minTier,
    maxTier,
  };
}

/**
 * Al completamento della 10ª partita di classificazione, corregge verso l'alto
 * l'MMR iniziale se il livello espresso nelle altre playlist competitive dimostra
 * che il giocatore si trova troppo in basso ("anti-smurfing involontario").
 */
export function computeAntiSmurfPlacementCalibration(
  input: AntiSmurfCalibrationInput,
): AntiSmurfCalibrationResult {
  if (
    input.matchesPlayedAfter !== PLACEMENT_MATCHES_REQUIRED ||
    input.otherCompetitiveMmrs.length === 0
  ) {
    return {
      applied: false,
      calibratedMmr: input.currentPlaylistMmr,
      bonusMmr: 0,
      expectedSkillMmr: input.currentPlaylistMmr,
    };
  }

  const peakOther = Math.max(...input.otherCompetitiveMmrs.map((m) => Math.max(0, m)));
  const expectedSkillMmr = Math.round(peakOther * 0.75);

  if (peakOther >= 400 && expectedSkillMmr > input.currentPlaylistMmr) {
    return {
      applied: true,
      calibratedMmr: expectedSkillMmr,
      bonusMmr: expectedSkillMmr - input.currentPlaylistMmr,
      expectedSkillMmr,
    };
  }

  return {
    applied: false,
    calibratedMmr: input.currentPlaylistMmr,
    bonusMmr: 0,
    expectedSkillMmr: Math.max(input.currentPlaylistMmr, expectedSkillMmr),
  };
}

/**
 * Durata progressiva del ban dal matchmaking (in minuti) per abbandono anticipato.
 */
export function computeAbandonBanDurationMinutes(offenseCount: number): number {
  const safe = Math.max(1, Math.floor(offenseCount));
  const idx = Math.min(ABANDON_BAN_MINUTES.length - 1, safe - 1);
  return ABANDON_BAN_MINUTES[idx] ?? 60;
}

/**
 * Calcola la penalità MMR per abbandono anticipato: registra la sconfitta
 * e applica una penalità extra (-15 MMR) al primo giocatore della squadra che lascia.
 */
export function computeAbandonMmrPenalty(input: AbandonPenaltyInput): AbandonPenaltyResult {
  const lossElo = calculateEloDelta({
    playerMMR: input.playerMMR,
    opponentMMR: input.opponentMMR,
    won: false,
  });
  const extraFirstLeaverPenalty = input.isFirstLeaver ? FIRST_LEAVER_EXTRA_MMR_PENALTY : 0;
  const newMMR = Math.max(0, input.playerMMR + lossElo.delta - extraFirstLeaverPenalty);
  return {
    delta: newMMR - input.playerMMR,
    newMMR,
    newTier: getRankFromMMR(newMMR),
    extraFirstLeaverPenalty,
  };
}
