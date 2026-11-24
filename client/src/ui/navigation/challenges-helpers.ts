// ============================================================
// UNO ULTRA Client — Pure Challenge Helpers & Period Contracts
// ============================================================

import type { ChallengeDefinition, ChallengePeriod } from '@uno/shared';

export interface ChallengeTabDef {
  readonly id: ChallengePeriod;
  readonly label: string;
  readonly resetHint: string;
}

export const CHALLENGE_TABS: readonly ChallengeTabDef[] = [
  { id: 'daily', label: 'Giornalieri', resetHint: 'Reset ogni 24h' },
  { id: 'weekly', label: 'Settimanali', resetHint: 'Reset settimanale' },
  { id: 'seasonal', label: 'Stagionali', resetHint: 'Stagione 1' },
];

export interface ChallengeViewItem {
  definition: ChallengeDefinition;
  progress: number;
  claimed: boolean;
}

export function filterChallengesByPeriod(
  items: readonly ChallengeViewItem[],
  period: ChallengePeriod
): ChallengeViewItem[] {
  return items.filter((item) => item.definition.period === period);
}

export function computeChallengePercent(progress: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(progress)) {
    return 0;
  }
  const pct = Math.round((progress / target) * 100);
  return Math.min(100, Math.max(0, pct));
}

export interface ChallengeClaimState {
  readonly status: 'claimed' | 'claimable' | 'in_progress';
  readonly label: string;
  readonly actionable: boolean;
}

export function getChallengeClaimState(
  item: ChallengeViewItem
): ChallengeClaimState {
  if (item.claimed) {
    return { status: 'claimed', label: 'Riscattata', actionable: false };
  }
  if (item.progress >= item.definition.target) {
    return { status: 'claimable', label: 'Riscatta', actionable: true };
  }
  return { status: 'in_progress', label: 'In corso', actionable: false };
}
