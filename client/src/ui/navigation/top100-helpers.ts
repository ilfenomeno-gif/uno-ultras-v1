// ============================================================
// UNO ULTRA Client — Pure Helpers for Top 100 Mondiale Tab
// ============================================================

import {
  getRankFromMMR,
  pickPrestigiousTitleForMMR,
  REALISTIC_BOT_PROFILES,
  type GameMode,
} from '@uno/shared';
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

/**
 * Deterministic client fallback if backend Top 100 endpoint is momentarily offline,
 * using realistic contenders and prestige-scaled titles.
 */
export function buildFallbackTop100Entries(
  mode: GameMode,
  playerCount: 2 | 3 | 4,
): TopLeaderboardEntry[] {
  const seed = hashBucket(`${mode}:${playerCount}`);
  const out: TopLeaderboardEntry[] = [];
  const totalBots = REALISTIC_BOT_PROFILES.length;

  for (let i = 0; i < 100; i++) {
    const bot = REALISTIC_BOT_PROFILES[(i + (seed % 17)) % totalBots]!;
    const curveMmr = Math.round(bot.baseMmr - i * 5 + ((seed + i * 13) % 19) - 9);
    const mmr = Math.max(450, Math.min(2250, curveMmr));
    const title = pickPrestigiousTitleForMMR(mmr, mode, i + seed);
    out.push({
      rank: 0,
      playerId: `fallback_${mode}_${playerCount}_${i + 1}`,
      username: bot.name,
      mmr,
      rankTier: getRankFromMMR(mmr),
      wins: Math.max(12, Math.round((mmr - 200) / 5.2 + ((seed + i) % 14))),
      winRate: Math.max(49, Math.min(84, Math.round(52 + (mmr - 450) / 58))),
      title: title.name,
      titleColor: title.color,
      isBot: true,
    });
  }

  return out
    .sort((a, b) => b.mmr - a.mmr || a.username.localeCompare(b.username))
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}
