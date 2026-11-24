// ============================================================
// UNO ULTRA Client — Sfide Seasonal, Filter & Progress Tests
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  DAILY_CHALLENGES_POOL,
  SEASONAL_CHALLENGES_POOL,
  WEEKLY_CHALLENGES_POOL,
} from '@uno/shared';
import {
  CHALLENGE_TABS,
  computeChallengePercent,
  filterChallengesByPeriod,
  getChallengeClaimState,
  type ChallengeViewItem,
} from '../src/ui/navigation/challenges-helpers.js';

describe('Sfide Tabs, Seasonal Pool & Claim State', () => {
  it('exposes Giornalieri, Settimanali and Stagionali temporal filter tabs', () => {
    expect(CHALLENGE_TABS.map((t) => t.id)).toEqual([
      'daily',
      'weekly',
      'seasonal',
    ]);
    expect(CHALLENGE_TABS.map((t) => t.label)).toEqual([
      'Giornalieri',
      'Settimanali',
      'Stagionali',
    ]);
  });

  it('defines valid Season 1 challenges alongside daily and weekly pools', () => {
    expect(SEASONAL_CHALLENGES_POOL).toHaveLength(3);
    for (const ch of SEASONAL_CHALLENGES_POOL) {
      expect(ch.period).toBe('seasonal');
      expect(ch.target).toBeGreaterThan(0);
      expect(ch.rewardXp).toBeGreaterThan(0);
      expect(ch.rewardVCard).toBeGreaterThan(0);
    }
  });

  it('filters challenges strictly by selected period', () => {
    const all: ChallengeViewItem[] = [
      ...DAILY_CHALLENGES_POOL,
      ...WEEKLY_CHALLENGES_POOL,
      ...SEASONAL_CHALLENGES_POOL,
    ].map((definition) => ({ definition, progress: 0, claimed: false }));

    expect(filterChallengesByPeriod(all, 'daily')).toHaveLength(
      DAILY_CHALLENGES_POOL.length
    );
    expect(filterChallengesByPeriod(all, 'weekly')).toHaveLength(
      WEEKLY_CHALLENGES_POOL.length
    );
    expect(filterChallengesByPeriod(all, 'seasonal')).toHaveLength(
      SEASONAL_CHALLENGES_POOL.length
    );
  });

  it('clamps challenge percentages cleanly between 0 and 100', () => {
    expect(computeChallengePercent(0, 10)).toBe(0);
    expect(computeChallengePercent(5, 10)).toBe(50);
    expect(computeChallengePercent(20, 10)).toBe(100);
    expect(computeChallengePercent(-3, 10)).toBe(0);
    expect(computeChallengePercent(4, 0)).toBe(0);
  });

  it('derives actionable claim states accurately', () => {
    const def = DAILY_CHALLENGES_POOL[0]!;
    expect(
      getChallengeClaimState({ definition: def, progress: 1, claimed: false })
    ).toEqual({ status: 'in_progress', label: 'In corso', actionable: false });

    expect(
      getChallengeClaimState({
        definition: def,
        progress: def.target,
        claimed: false,
      })
    ).toEqual({ status: 'claimable', label: 'Riscatta', actionable: true });

    expect(
      getChallengeClaimState({
        definition: def,
        progress: def.target,
        claimed: true,
      })
    ).toEqual({ status: 'claimed', label: 'Riscattata', actionable: false });
  });
});
