// ============================================================
// UNO ULTRA Server — Top 100 Mondiale Leaderboard (Mode + 1v1 / 3p / 4p)
// ============================================================

import {
  GAME_MODES,
  getRankFromMMR,
  pickPrestigiousTitleForMMR,
  REALISTIC_BOT_PROFILES,
  type GameMode,
} from '@uno/shared';
import { env } from '../../config/env.js';
import { query } from '../postgres/client.js';
import { readDevState, updateDevState } from '../postgres/dev-store.js';
import { getRedisClient } from './client.js';

const LEADERBOARD_KEY = 'leaderboard:mmr';

export type LeaderboardPlayerCount = 2 | 3 | 4;
export type LeaderboardMode = 'global' | GameMode;

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  mmr: number;
  rankTier: string;
  wins: number;
  winRate: number;
  title: string;
  titleColor?: string;
  isBot?: boolean;
}

const memoryScores = new Map<string, { username: string; mmr: number }>();

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
  mode: LeaderboardMode,
  playerCount: LeaderboardPlayerCount | 'all',
  excludeNames: ReadonlySet<string>,
): LeaderboardEntry[] {
  const seedOffset = deterministicHash(`${mode}:${playerCount}`);
  const out: LeaderboardEntry[] = [];
  const totalBots = REALISTIC_BOT_PROFILES.length;

  for (let idx = 0; idx < totalBots + 10 && out.length < 100; idx++) {
    const bot = REALISTIC_BOT_PROFILES[(idx + (seedOffset % 17)) % totalBots]!;
    if (excludeNames.has(bot.name.toLowerCase())) continue;

    // Higher ranks keep higher MMR and progressively more prestigious titles
    const curveMmr = Math.round(bot.baseMmr - idx * 5 + ((seedOffset + idx * 13) % 19) - 9);
    const mmr = Math.max(450, Math.min(2250, curveMmr));
    const wins = Math.max(12, Math.round((mmr - 200) / 5.2 + ((seedOffset + idx) % 14)));
    const winRate = Math.max(49, Math.min(84, Math.round(52 + (mmr - 450) / 58)));
    const pickedTitle = pickPrestigiousTitleForMMR(
      mmr,
      mode === 'global' ? undefined : mode,
      idx + seedOffset,
    );

    out.push({
      rank: 0,
      playerId: `s1_${mode}_${playerCount}p_${idx + 1}`,
      username: bot.name,
      mmr,
      rankTier: getRankFromMMR(mmr),
      wins,
      winRate,
      title: pickedTitle.name,
      titleColor: pickedTitle.color,
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
  memoryScores.set(`global:${playerId}`, { username, mmr });

  if (env.NODE_ENV !== 'production') {
    try {
      updateDevState((state) => {
        const globalMap = (state.leaderboards['global'] ??= {});
        globalMap[playerId] = { username, mmr };
        if (bucket?.mode && bucket.playerCount) {
          const bKey = `${bucket.mode}:${bucket.playerCount}p`;
          const bMap = (state.leaderboards[bKey] ??= {});
          bMap[playerId] = { username, mmr };
        }
      });
    } catch {
      // non-fatal
    }
  }

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
  opts?: { mode?: LeaderboardMode; playerCount?: LeaderboardPlayerCount },
): Promise<LeaderboardEntry[]> {
  const safeLimit = Math.max(1, Math.min(100, limit));
  const isGlobal = !opts?.mode || opts.mode === 'global';
  const mode: LeaderboardMode = isGlobal
    ? 'global'
    : (GAME_MODES as readonly string[]).includes(opts.mode!)
      ? (opts.mode as GameMode)
      : 'uno';
  const titleMode: GameMode | undefined = mode === 'global' ? undefined : mode;
  const playerCount: LeaderboardPlayerCount = opts?.playerCount ?? 4;
  const realEntries: LeaderboardEntry[] = [];
  const seenNames = new Set<string>();

  try {
    const client = getRedisClient();
    if (client.isOpen) {
      const key =
        !isGlobal && opts?.playerCount
          ? leaderboardKeyForBucket(mode, playerCount)
          : LEADERBOARD_KEY;
      const items = await client.zRangeWithScores(key, 0, safeLimit - 1, { REV: true });
      for (const entry of items) {
        const [playerId = '', username = 'Unknown'] = entry.value.split('|');
        const mmr = Math.round(entry.score);
        if (!seenNames.has(username.toLowerCase())) {
          seenNames.add(username.toLowerCase());
          const pickedTitle = pickPrestigiousTitleForMMR(mmr, titleMode, realEntries.length);
          realEntries.push({
            rank: 0,
            playerId,
            username,
            mmr,
            rankTier: getRankFromMMR(mmr),
            wins: Math.max(1, Math.round(mmr / 20)),
            winRate: 56,
            title: pickedTitle.name,
            titleColor: pickedTitle.color,
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
          const pickedTitle = pickPrestigiousTitleForMMR(mmr, titleMode, realEntries.length);
          realEntries.push({
            rank: 0,
            playerId: r.id,
            username: r.username,
            mmr,
            rankTier: r.rank_tier,
            wins: Math.max(1, Math.round(mmr / 24)),
            winRate: 54,
            title: pickedTitle.name,
            titleColor: pickedTitle.color,
            isBot: false,
          });
        }
      }
    } catch {
      const targetBucket = isGlobal ? 'global' : `${mode}:${playerCount}p`;
      const devBucket = env.NODE_ENV !== 'production' ? readDevState().leaderboards[targetBucket] : undefined;
      if (devBucket) {
        for (const [k, info] of Object.entries(devBucket)) {
          if (!seenNames.has(info.username.toLowerCase())) {
            seenNames.add(info.username.toLowerCase());
            const pickedTitle = pickPrestigiousTitleForMMR(info.mmr, titleMode, realEntries.length);
            realEntries.push({
              rank: 0,
              playerId: k,
              username: info.username,
              mmr: info.mmr,
              rankTier: getRankFromMMR(info.mmr),
              wins: Math.max(1, Math.round(info.mmr / 24)),
              winRate: 55,
              title: pickedTitle.name,
              titleColor: pickedTitle.color,
              isBot: false,
            });
          }
        }
      }
      const prefix = isGlobal ? 'global:' : `${mode}:${playerCount}p:`;
      for (const [k, info] of memoryScores.entries()) {
        if (!k.startsWith(prefix)) continue;
        const cleanId = k.slice(prefix.length);
        if (!seenNames.has(info.username.toLowerCase())) {
          seenNames.add(info.username.toLowerCase());
          const pickedTitle = pickPrestigiousTitleForMMR(info.mmr, titleMode, realEntries.length);
          realEntries.push({
            rank: 0,
            playerId: cleanId,
            username: info.username,
            mmr: info.mmr,
            rankTier: getRankFromMMR(info.mmr),
            wins: Math.max(1, Math.round(info.mmr / 24)),
            winRate: 55,
            title: pickedTitle.name,
            titleColor: pickedTitle.color,
            isBot: false,
          });
        }
      }
    }
  }

  return [
    ...realEntries,
    ...generateBucketContenders(mode, isGlobal ? 'all' : playerCount, seenNames),
  ]
    .sort((a, b) => b.mmr - a.mmr || a.username.localeCompare(b.username))
    .slice(0, safeLimit)
    .map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
}
