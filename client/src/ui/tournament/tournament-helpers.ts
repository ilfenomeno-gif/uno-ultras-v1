// ============================================================
// UNO ULTRA Client — Pure Tournament Schedule, Tier & Countdown Helpers
// ============================================================

import type { TournamentKind, TournamentPreset } from '@uno/shared';

export type TournamentTierBracket = 'all' | 'bronzo' | 'arena' | 'ssl';

export interface TournamentFilterDef {
  readonly id: TournamentTierBracket;
  readonly label: string;
}

export const TOURNAMENT_TIER_FILTERS: readonly TournamentFilterDef[] = [
  { id: 'all', label: 'Tutti' },
  { id: 'bronzo', label: 'Bronzo' },
  { id: 'arena', label: 'Arena' },
  { id: 'ssl', label: 'SSL' },
];

export function getTournamentTierBracket(
  minMMR: number
): Exclude<TournamentTierBracket, 'all'> {
  if (minMMR >= 1600) return 'ssl';
  if (minMMR >= 400) return 'arena';
  return 'bronzo';
}

export function filterTournamentsByBracket(
  presets: readonly TournamentPreset[],
  bracket: TournamentTierBracket
): TournamentPreset[] {
  if (bracket === 'all') return [...presets];
  return presets.filter((p) => getTournamentTierBracket(p.minMMR) === bracket);
}

export function getRankAdaptiveCrateName(rankTier?: string): string {
  const clean = rankTier?.trim();
  return clean && clean.length > 0
    ? `Cassa ${clean} Torneo`
    : 'Cassa Bronzo Torneo';
}

export function getTournamentScheduleMeta(
  kind: TournamentKind,
  rankTier?: string
): { readonly schedule: string; readonly crateReward: string } {
  const rankCrate = getRankAdaptiveCrateName(rankTier);
  switch (kind) {
    case 'classico':
      return { schedule: 'Ogni giorno · 17:00', crateReward: rankCrate };
    case 'ut32':
      return { schedule: 'Ogni giorno · 20:30', crateReward: rankCrate };
    case 'grand-prix':
      return { schedule: 'Ven & Sab · 21:00', crateReward: 'Cassa Argento Torneo' };
    case 'pentathlon':
      return { schedule: 'Domenica · 19:00', crateReward: 'Cassa Argento Torneo' };
    case 'ucs-ssl':
      return { schedule: 'Sabato · 18:00 UTC', crateReward: 'Cassa Leggenda SSL' };
  }
}

/** Returns ms remaining until next Saturday 18:00 UTC. */
export function computeNextWeekendKickoffMs(nowMs: number): number {
  const now = new Date(nowMs);
  const target = new Date(nowMs);
  const day = now.getUTCDay();
  let daysAhead = (6 - day + 7) % 7;
  target.setUTCDate(now.getUTCDate() + daysAhead);
  target.setUTCHours(18, 0, 0, 0);

  if (target.getTime() <= nowMs) {
    daysAhead += 7;
    target.setTime(nowMs);
    target.setUTCDate(now.getUTCDate() + daysAhead);
    target.setUTCHours(18, 0, 0, 0);
  }
  return Math.max(0, target.getTime() - nowMs);
}

export function formatCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${days}g ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}
