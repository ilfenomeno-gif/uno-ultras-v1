// ============================================================
// UNO ULTRA Client — Pure Career KPI, Rank & History Helpers
// ============================================================

import { SSL_MMR_THRESHOLD } from '@uno/shared';

export interface CareerModeStat {
  readonly mode: string;
  readonly matchesPlayed: number;
  readonly wins: number;
  readonly winRate: number;
  readonly bestStreak: number;
}

export interface CareerKpiSummary {
  readonly totalMatches: number;
  readonly totalWins: number;
  readonly winRatePercent: number;
  readonly bestStreak: number;
  readonly specialCardsPlayed: number;
}

export function aggregateCareerStats(
  modeStats: readonly CareerModeStat[],
  specialCardsPlayed = 0
): CareerKpiSummary {
  let totalMatches = 0;
  let totalWins = 0;
  let bestStreak = 0;

  for (const stat of modeStats) {
    totalMatches += Math.max(0, stat.matchesPlayed);
    totalWins += Math.max(0, stat.wins);
    if (stat.bestStreak > bestStreak) {
      bestStreak = stat.bestStreak;
    }
  }

  const winRatePercent =
    totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

  return {
    totalMatches,
    totalWins,
    winRatePercent,
    bestStreak,
    specialCardsPlayed: Math.max(0, Math.floor(specialCardsPlayed)),
  };
}

export function computeSslProgressPercent(mmr: number): number {
  if (!Number.isFinite(mmr) || mmr <= 0) return 0;
  const pct = Math.round((mmr / SSL_MMR_THRESHOLD) * 100);
  return Math.min(100, Math.max(0, pct));
}

export function resolveCareerFrameClass(
  frameId: string | undefined
): 'career-frame--gold' | 'career-frame--prism' | 'career-frame--default' {
  if (frameId === 'frame_gold_pulse') return 'career-frame--gold';
  if (frameId === 'frame_ssl_prism') return 'career-frame--prism';
  return 'career-frame--default';
}

export function formatMatchOutcome(placement: number): {
  readonly label: 'VITTORIA' | 'SCONFITTA';
  readonly won: boolean;
} {
  return placement === 1
    ? { label: 'VITTORIA', won: true }
    : { label: 'SCONFITTA', won: false };
}

export function formatMmrDelta(delta: number): string {
  if (delta > 0) return `+${delta} MMR`;
  if (delta < 0) return `${delta} MMR`;
  return '0 MMR';
}
