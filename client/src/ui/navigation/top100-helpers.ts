// ============================================================
// UNO ULTRA Client — Pure Helpers for Top 100 Mondiale Tab
// ============================================================

import { getRankFromMMR, LEGACY_TITLES, type GameMode } from '@uno/shared';
import type { TopLeaderboardEntry } from '../../net/tcp/rest-client.js';

export interface Top100ModeOption {
  readonly id: GameMode;
  readonly label: string;
  readonly tag: string;
}

export interface Top100PlayerCountOption {
  readonly count: 2 | 3 | 4;
  readonly label: string;
  readonly shortLabel: string;
}

export const TOP100_MODES: readonly Top100ModeOption[] = [
  { id: 'uno', label: 'UNO Classico', tag: 'CARD' },
  { id: 'scala40', label: 'Scala 40', tag: 'MINI' },
  { id: 'scopa', label: 'Scopa Classica', tag: 'MINI' },
  { id: 'ruba-mazzetto', label: 'Ruba Mazzetto', tag: 'MINI' },
  { id: 'blackjack', label: 'Blackjack 21', tag: 'MINI' },
  { id: 'poker-texas', label: "Poker Texas Hold'em", tag: 'VIP' },
  { id: 'burraco', label: 'Burraco Online', tag: 'MINI' },
  { id: 'mille-miglia', label: 'Mille Miglia 1000', tag: 'RACE' },
];

export const TOP100_PLAYER_COUNTS: readonly Top100PlayerCountOption[] = [
  { count: 2, label: '1v1', shortLabel: '1v1' },
  { count: 3, label: '3 Giocatori', shortLabel: '3G' },
  { count: 4, label: '4 Giocatori', shortLabel: '4G' },
];

function hashBucket(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

const HANDLES: readonly string[] = [
  'Nova_Strike', 'Vega_Prime', 'Zenith_SSL', 'Kuro_Ace', 'Solaris_X',
  'Hyper_Fox', 'Neon_Drifter', 'Astra_Vortex', 'Blaze_99', 'Echo_Delta',
  'Cyber_Valkyrie', 'Chrono_King', 'Omega_Pulse', 'Prism_Racer', 'Luna_Edge',
  'Shadow_Stack', 'Apex_Maverick', 'Turbo_Rei', 'Volt_Phantom', 'Nyx_Circuit',
];

/**
 * Deterministic client fallback if backend Top 100 endpoint is momentarily offline.
 */
export function buildFallbackTop100Entries(
  mode: GameMode,
  playerCount: 2 | 3 | 4,
): TopLeaderboardEntry[] {
  const seed = hashBucket(`${mode}:${playerCount}`);
  const highTitles = LEGACY_TITLES.filter((t) => (t.mmrReq ?? 0) >= 800 || t.category === 'ucs');
  const out: TopLeaderboardEntry[] = [];

  for (let i = 0; i < 100; i++) {
    const base = HANDLES[(i + seed) % HANDLES.length] ?? 'Contender';
    const suffix = 10 + ((seed + i * 37) % 89);
    const jitter = ((seed + i * 17) % 19) - 9;
    const mmr = Math.max(420, Math.round(1960 - i * 13 + jitter));
    const t = highTitles[(i + seed) % highTitles.length];
    out.push({
      rank: i + 1,
      playerId: `fallback_${mode}_${playerCount}_${i + 1}`,
      username: `${base}_${suffix}`,
      mmr,
      rankTier: getRankFromMMR(mmr),
      wins: Math.max(8, Math.round(340 - i * 2.8 + (seed % 15))),
      winRate: Math.max(48, Math.min(82, Math.round(74 - i * 0.22))),
      title: t?.name ?? 'Contendente Stagione 1',
      isBot: true,
    });
  }
  return out;
}
