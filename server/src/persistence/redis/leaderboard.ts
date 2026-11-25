// ============================================================
// UNO ULTRA Server — Top 100 Mondiale Leaderboard (Mode + 1v1 / 3p / 4p)
// ============================================================

import {
  GAME_MODES,
  getRankFromMMR,
  LEGACY_TITLES,
  type GameMode,
} from '@uno/shared';
import { query } from '../postgres/client.js';
import { getRedisClient } from './client.js';

const LEADERBOARD_KEY = 'leaderboard:mmr';

export type LeaderboardPlayerCount = 2 | 3 | 4;

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  mmr: number;
  rankTier: string;
  wins: number;
  winRate: number;
  title: string;
  isBot?: boolean;
}

const memoryScores = new Map<string, { username: string; mmr: number }>();

const CONTENDER_HANDLES: readonly string[] = [
  'Nova_Strike', 'Vega_Prime', 'Zenith_SSL', 'Kuro_Ace', 'Solaris_X',
  'Hyper_Fox', 'Neon_Drifter', 'Astra_Vortex', 'Blaze_99', 'Echo_Delta',
  'Cyber_Valkyrie', 'Chrono_King', 'Omega_Pulse', 'Prism_Racer', 'Luna_Edge',
  'Shadow_Stack', 'Apex_Maverick', 'Turbo_Rei', 'Volt_Phantom', 'Nyx_Circuit',
];

function leaderboardKeyForBucket(mode?: string, playerCount?: number): string {
  if (!mode || !playerCount) return LEADERBOARD_KEY;
  return `${LEADERBOARD_KEY}:${mode}:${playerCount}p`;
}

function deterministicHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function generateBucketContenders(
  mode: GameMode,
  playerCount: LeaderboardPlayerCount,
  excludeNames: ReadonlySet<string>,
): LeaderboardEntry[] {
  const seedOffset = deterministicHash(`${mode}:${playerCount}`);
  const out: LeaderboardEntry[] = [];
  const highTitles = LEGACY_TITLES.filter((t) => (t.mmrReq ?? 0) >= 800 || t.category === 'ucs');

  for (let idx = 0; idx < 110 && out.length < 100; idx++) {
    const prefix = CONTENDER_HANDLES[(idx + seedOffset) % CONTENDER_HANDLES.length] ?? 'Contender';
    const suffix = 10 + ((seedOffset + idx * 37) % 89);
    const username = `${prefix}_${suffix}`;
    if (excludeNames.has(username.toLowerCase())) continue;

    const jitter = ((seedOffset + idx * 17) % 19) - 9;
    const mmr = Math.max(420, Math.round(1960 - idx * 13 + jitter));
    const wins = Math.max(8, Math.round(340 - idx * 2.8 + (seedOffset % 15)));
    const winRate = Math.max(48, Math.min(82, Math.round(74 - idx * 0.22)));
    const pickedTitle = highTitles[(idx + seedOffset) % highTitles.length];

    out.push({
      rank: 0,
      playerId: `s1_${mode}_${playerCount}p_${idx + 1}`,
      username,
      mmr,
      rankTier: getRankFromMMR(mmr),
      wins,
      winRate,
      title: pickedTitle?.name ?? 'Contendente Stagione 1',
      isBot: true,
    });
  }
  return out;
}

export async function updateLeaderboardScore(
  playerId: string,
  username: string,
  mmr: number,
  bucket?: { mode?: string; playerCount?: number },
): Promise<void> {
  const memKey =
    bucket?.mode && bucket.playerCount
      ? `${bucket.mode}:${bucket.playerCount}p:${playerId}`
      : playerId;

  if (memoryScores.size >= 1500 && !memoryScores.has(memKey)) {
    const oldest = memoryScores.keys().next().value;
    if (oldest) memoryScores.delete(oldest);
  }
  memoryScores.set(memKey, { username, mmr });

  try {
    const client = getRedisClient();
    if (client.isOpen) {
      await client.zAdd(LEADERBOARD_KEY, { score: mmr, value: `${playerId}|${username}` });
      if (bucket?.mode && bucket.playerCount) {
        await client.zAdd(leaderboardKeyForBucket(bucket.mode, bucket.playerCount), {
          score: mmr,
          value: `${playerId}|${username}`,
        });
      }
    }
  } catch {
    // non-fatal
  }
}

export async function getTopLeaderboard(
  limit = 100,
  opts?: { mode?: GameMode; playerCount?: LeaderboardPlayerCount },
): Promise<LeaderboardEntry[]> {
  const safeLimit = Math.max(1, Math.min(100, limit));
  const mode: GameMode =
    opts?.mode && (GAME_MODES as readonly string[]).includes(opts.mode) ? opts.mode : 'uno';
  const playerCount: LeaderboardPlayerCount = opts?.playerCount ?? 4;
  const realEntries: LeaderboardEntry[] = [];
  const seenNames = new Set<string>();

  try {
    const client = getRedisClient();
    if (client.isOpen) {
      const key = opts?.mode && opts?.playerCount
        ? leaderboardKeyForBucket(mode, playerCount)
        : LEADERBOARD_KEY;
      const items = await client.zRangeWithScores(key, 0, safeLimit - 1, { REV: true });
      for (const entry of items) {
        const [playerId = '', username = 'Unknown'] = entry.value.split('|');
        const mmr = Math.round(entry.score);
        if (!seenNames.has(username.toLowerCase())) {
          seenNames.add(username.toLowerCase());
          realEntries.push({
            rank: 0,
            playerId,
            username,
            mmr,
            rankTier: getRankFromMMR(mmr),
            wins: Math.max(1, Math.round(mmr / 20)),
            winRate: 56,
            title: 'Giocatore Classificato',
            isBot: false,
          });
        }
      }
    }
  } catch {
    // Fallback to Postgres
  }

  if (realEntries.length === 0) {
    try {
      const res = await query<{ id: string; username: string; mmr: number; rank_tier: string }>(
        `SELECT id, username, mmr, rank_tier
           FROM players
          WHERE deleted_at IS NULL
          ORDER BY mmr DESC, username ASC
          LIMIT $1`,
        [safeLimit],
      );
      for (const r of res.rows) {
        if (!seenNames.has(r.username.toLowerCase())) {
          seenNames.add(r.username.toLowerCase());
          const mmr = Number(r.mmr);
          realEntries.push({
            rank: 0,
            playerId: r.id,
            username: r.username,
            mmr,
            rankTier: r.rank_tier,
            wins: Math.max(1, Math.round(mmr / 24)),
            winRate: 54,
            title: 'Contendente Live',
            isBot: false,
          });
        }
      }
    } catch {
      // Fallback to in-memory cache + contenders
      for (const [k, info] of memoryScores.entries()) {
        if (!seenNames.has(info.username.toLowerCase())) {
          seenNames.add(info.username.toLowerCase());
          realEntries.push({
            rank: 0,
            playerId: k,
            username: info.username,
            mmr: info.mmr,
            rankTier: getRankFromMMR(info.mmr),
            wins: Math.max(1, Math.round(info.mmr / 24)),
            winRate: 55,
            title: 'Contendente Live',
            isBot: false,
          });
        }
      }
    }
  }

  const combined = [
    ...realEntries,
    ...generateBucketContenders(mode, playerCount, seenNames),
  ]
    .sort((a, b) => b.mmr - a.mmr || a.username.localeCompare(b.username))
    .slice(0, safeLimit)
    .map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));

  return combined;
}
