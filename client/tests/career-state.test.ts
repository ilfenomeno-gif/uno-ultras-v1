// ============================================================
// UNO ULTRA Client — 3-Column Carriera KPI, SSL & History Tests
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  aggregateCareerStats,
  computeSslProgressPercent,
  formatMatchOutcome,
  formatMmrDelta,
  resolveCareerFrameClass,
} from '../src/ui/navigation/career-helpers.js';

describe('Carriera Dashboard Helpers', () => {
  it('aggregates total matches, win rate percentage, best streak and special cards', () => {
    expect(aggregateCareerStats([])).toEqual({
      totalMatches: 0,
      totalWins: 0,
      winRatePercent: 0,
      bestStreak: 0,
      specialCardsPlayed: 0,
    });

    expect(
      aggregateCareerStats(
        [
          { mode: 'uno', matchesPlayed: 20, wins: 13, winRate: 65, bestStreak: 5 },
          { mode: 'scopa', matchesPlayed: 5, wins: 2, winRate: 40, bestStreak: 2 },
        ],
        42
      )
    ).toEqual({
      totalMatches: 25,
      totalWins: 15,
      winRatePercent: 60,
      bestStreak: 5,
      specialCardsPlayed: 42,
    });
  });

  it('computes Supersonic Legend (1600+ MMR) progress percentage cleanly', () => {
    expect(computeSslProgressPercent(-20)).toBe(0);
    expect(computeSslProgressPercent(0)).toBe(0);
    expect(computeSslProgressPercent(800)).toBe(50);
    expect(computeSslProgressPercent(1600)).toBe(100);
    expect(computeSslProgressPercent(2100)).toBe(100);
  });

  it('resolves avatar frame styles for gold pulse, SSL prism and default', () => {
    expect(resolveCareerFrameClass('frame_gold_pulse')).toBe('career-frame--gold');
    expect(resolveCareerFrameClass('frame_ssl_prism')).toBe('career-frame--prism');
    expect(resolveCareerFrameClass('frame_default')).toBe('career-frame--default');
    expect(resolveCareerFrameClass(undefined)).toBe('career-frame--default');
  });

  it('formats match outcomes and MMR deltas clearly', () => {
    expect(formatMatchOutcome(1)).toEqual({ label: 'VITTORIA', won: true });
    expect(formatMatchOutcome(2)).toEqual({ label: 'SCONFITTA', won: false });
    expect(formatMmrDelta(24)).toBe('+24 MMR');
    expect(formatMmrDelta(-12)).toBe('-12 MMR');
    expect(formatMmrDelta(0)).toBe('0 MMR');
  });
});
