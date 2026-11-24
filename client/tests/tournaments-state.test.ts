// ============================================================
// UNO ULTRA Client — Tornei Rank Bracket, Countdown & Crate Tests
// ============================================================

import { describe, expect, it } from 'vitest';
import { TOURNAMENT_PRESETS } from '@uno/shared';
import {
  computeNextWeekendKickoffMs,
  filterTournamentsByBracket,
  formatCountdown,
  getRankAdaptiveCrateName,
  getTournamentScheduleMeta,
  getTournamentTierBracket,
} from '../src/ui/tournament/tournament-helpers.js';

describe('Tornei Helpers — Rank Brackets, Crates & Countdown', () => {
  it('classifies minMMR accurately into Bronzo, Arena and SSL brackets', () => {
    expect(getTournamentTierBracket(0)).toBe('bronzo');
    expect(getTournamentTierBracket(399)).toBe('bronzo');
    expect(getTournamentTierBracket(400)).toBe('arena');
    expect(getTournamentTierBracket(1000)).toBe('arena');
    expect(getTournamentTierBracket(1600)).toBe('ssl');
    expect(getTournamentTierBracket(1800)).toBe('ssl');
  });

  it('filters TOURNAMENT_PRESETS across All, Bronzo, Arena and SSL', () => {
    expect(filterTournamentsByBracket(TOURNAMENT_PRESETS, 'all')).toHaveLength(
      TOURNAMENT_PRESETS.length
    );
    expect(
      filterTournamentsByBracket(TOURNAMENT_PRESETS, 'bronzo').map((p) => p.kind)
    ).toEqual(['ut32', 'classico']);
    expect(
      filterTournamentsByBracket(TOURNAMENT_PRESETS, 'arena').map((p) => p.kind)
    ).toEqual(['grand-prix', 'pentathlon']);
    expect(
      filterTournamentsByBracket(TOURNAMENT_PRESETS, 'ssl').map((p) => p.kind)
    ).toEqual(['ucs-ssl']);
  });

  it('formats rank-adaptive crate name and tournament schedule metadata', () => {
    expect(getRankAdaptiveCrateName('Platinum II')).toBe('Cassa Platinum II Torneo');
    expect(getRankAdaptiveCrateName('')).toBe('Cassa Bronzo Torneo');
    expect(getRankAdaptiveCrateName(undefined)).toBe('Cassa Bronzo Torneo');

    for (const preset of TOURNAMENT_PRESETS) {
      const meta = getTournamentScheduleMeta(preset.kind, 'Gold I');
      expect(meta.schedule.length).toBeGreaterThan(0);
      expect(meta.crateReward.length).toBeGreaterThan(0);
    }
  });

  it('computes weekend kickoff delta and formats countdown deterministically', () => {
    // 2026-11-24T18:00:00Z is Tuesday -> Saturday 18:00 UTC is 4 days ahead
    const tuesdayMs = Date.UTC(2026, 10, 24, 18, 0, 0);
    const delta = computeNextWeekendKickoffMs(tuesdayMs);
    expect(delta).toBe(4 * 24 * 3600 * 1000);
    expect(formatCountdown(delta)).toBe('4g 00h 00m 00s');

    // Past kickoff on Saturday advances 7 days to next Saturday
    const afterKickoff = Date.UTC(2026, 10, 28, 19, 0, 0);
    const nextDelta = computeNextWeekendKickoffMs(afterKickoff);
    expect(nextDelta).toBe((7 * 24 - 1) * 3600 * 1000);
    expect(formatCountdown(-500)).toBe('0g 00h 00m 00s');
  });
});
