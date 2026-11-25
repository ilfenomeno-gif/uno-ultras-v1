// ============================================================
// UNO ULTRA Server — Top 100 Mondiale Leaderboard (Mode + 1v1 / 3p / 4p)
// ============================================================

import {
  GAME_MODES,
  getRankFromMMR,
  pickPrestigiousTitleForMMR,
  type GameMode,
} from '@uno/shared';
import { env } from '../../config/env.js';
import {
  buildFullRankedLadder,
  type LadderEntryLike,
} from '../../services/bot-ladder.js';
import { query } from '../postgres/client.js';
import { readDevState, updateDevState } from '../postgres/dev-store.js';
import { getRedisClient } from './client.js';

const LEADERBOARD_KEY = 'leaderboard:mmr';

export type LeaderboardPlayerCount = 2 | 3 | 4;
export type LeaderboardMode = 'global' | GameMode;

export type LeaderboardEntry = LadderEntryLike;

const memoryScores = new Map<string, { username: string; mmr: number }>();

function leaderboardKeyForBucket(mode?: string, playerCount?: number): string {
  if (!mode || !playerCount) return LEADERBOARD_KEY;
  return `${LEADERBOARD_KEY}:${mode}:${playerCount}p`;
}

export async function updateLeaderboardScore(
  playerId: string,
  username: string,
  mmr: number,
  bucket?: { mode?: string; playerCount?: number; globalMmr?: number },
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
  const prevGlobal = memoryScores.get(`global:${playerId}`)?.mmr ?? 0;
  const globalScore = Math.max(prevGlobal, bucket?.globalMmr ?? mmr);
  memoryScores.set(`global:${playerId}`, { username, mmr: globalScore });

  if (env.NODE_ENV !== 'production') {
    try {
      updateDevState((state) => {
        const globalMap = (state.leaderboards['global'] ??= {});
        const curGlobal = globalMap[playerId]?.mmr ?? 0;
        globalMap[playerId] = {
          username,
          mmr: Math.max(curGlobal, bucket?.globalMmr ?? mmr),
        };
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
      await client.zAdd(LEADERBOARD_KEY, {
        score: globalScore,
        value: `${playerId}|${username}`,
      });
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

export async function getFullRankedLadder(opts?: {
  mode?: LeaderboardMode;
  playerCount?: LeaderboardPlayerCount;
  simulate?: boolean;
}): Promise<LeaderboardEntry[]> {
  const isGlobal = !opts?.mode || opts.mode === 'global';
  const mode: LeaderboardMode = isGlobal
    ? 'global'
    : (GAME_MODES as readonly string[]).includes(opts.mode!)
      ? (opts.mode as GameMode)
      : 'uno';
  const titleMode: GameMode | undefined = mode === 'global' ? undefined : mode;
  const playerCount: LeaderboardPlayerCount = opts?.playerCount ?? 4;
  const realByLowerName = new Map<string, LeaderboardEntry>();
  const addOrUpdateReal = (entry: Omit<LeaderboardEntry, 'rank'>): void => {
    const key = entry.username.toLowerCase();
    realByLowerName.set(key, { ...entry, rank: 0, isBot: false });
  };

  try {
    const client = getRedisClient();
    if (client.isOpen) {
      const key =
        !isGlobal && opts?.playerCount
          ? leaderboardKeyForBucket(mode, playerCount)
          : LEADERBOARD_KEY;
      const items = await client.zRangeWithScores(key, 0, 299, { REV: true });
      for (const entry of items) {
        const [playerId = '', username = 'Unknown'] = entry.value.split('|');
        const mmr = Math.round(entry.score);
        const pickedTitle = pickPrestigiousTitleForMMR(mmr, titleMode, realByLowerName.size);
        addOrUpdateReal({
          playerId,
          username,
          mmr,
          rankTier: getRankFromMMR(mmr),
          wins: Math.max(1, Math.round(mmr / 20)),
          winRate: 56,
          title: pickedTitle.name,
          titleColor: pickedTitle.color,
        });
      }
    }
  } catch {
    // Fallback to Postgres / memory / dev-store
  }

  if (realByLowerName.size === 0) {
    try {
      if (!isGlobal) {
        const res = await query<{
          id: string;
          username: string;
          mmr: number;
          rank_tier: string;
          wins: number;
          losses: number;
        }>(
          `SELECT pl.id, pl.username, ppr.mmr, ppr.rank_tier, ppr.wins, ppr.losses
             FROM player_playlist_ranks ppr
             JOIN players pl ON pl.id = ppr.player_id
            WHERE ppr.mode = $1 AND ppr.player_count = $2 AND pl.deleted_at IS NULL
            ORDER BY ppr.mmr DESC, pl.username ASC
            LIMIT 300`,
          [mode, playerCount],
        );
        for (const r of res.rows) {
          const mmr = Number(r.mmr);
          const wins = Number(r.wins);
          const total = Math.max(1, wins + Number(r.losses));
          const pickedTitle = pickPrestigiousTitleForMMR(mmr, titleMode, realByLowerName.size);
          addOrUpdateReal({
            playerId: r.id,
            username: r.username,
            mmr,
            rankTier: r.rank_tier,
            wins,
            winRate: Math.round((wins / total) * 100),
            title: pickedTitle.name,
            titleColor: pickedTitle.color,
          });
        }
      } else {
        const res = await query<{ id: string; username: string; mmr: number; rank_tier: string }>(
          `SELECT id, username, mmr, rank_tier
             FROM players
            WHERE deleted_at IS NULL
            ORDER BY mmr DESC, username ASC
            LIMIT 300`,
        );
        for (const r of res.rows) {
          const mmr = Number(r.mmr);
          const pickedTitle = pickPrestigiousTitleForMMR(mmr, titleMode, realByLowerName.size);
          addOrUpdateReal({
            playerId: r.id,
            username: r.username,
            mmr,
            rankTier: r.rank_tier,
            wins: Math.max(1, Math.round(mmr / 24)),
            winRate: 54,
            title: pickedTitle.name,
            titleColor: pickedTitle.color,
          });
        }
      }
    } catch {
      // Fall through to dev-store / memory overlay
    }

    const targetBucket = isGlobal ? 'global' : `${mode}:${playerCount}p`;
    const devBucket =
      env.NODE_ENV !== 'production' ? readDevState().leaderboards[targetBucket] : undefined;
    if (devBucket) {
      for (const [k, info] of Object.entries(devBucket)) {
        const pickedTitle = pickPrestigiousTitleForMMR(info.mmr, titleMode, realByLowerName.size);
        addOrUpdateReal({
          playerId: k,
          username: info.username,
          mmr: info.mmr,
          rankTier: getRankFromMMR(info.mmr),
          wins: Math.max(1, Math.round(info.mmr / 24)),
          winRate: 55,
          title: pickedTitle.name,
          titleColor: pickedTitle.color,
        });
      }
    }
    const prefix = isGlobal ? 'global:' : `${mode}:${playerCount}p:`;
    for (const [k, info] of memoryScores.entries()) {
      if (!k.startsWith(prefix)) continue;
      const cleanId = k.slice(prefix.length);
      const pickedTitle = pickPrestigiousTitleForMMR(info.mmr, titleMode, realByLowerName.size);
      addOrUpdateReal({
        playerId: cleanId,
        username: info.username,
        mmr: info.mmr,
        rankTier: getRankFromMMR(info.mmr),
        wins: Math.max(1, Math.round(info.mmr / 24)),
        winRate: 55,
        title: pickedTitle.name,
        titleColor: pickedTitle.color,
      });
    }
  }

  return buildFullRankedLadder({
    mode,
    ...(isGlobal ? {} : { playerCount }),
    realEntries: [...realByLowerName.values()],
    ...(opts?.simulate !== undefined ? { simulate: opts.simulate } : {}),
  });
}

export async function getTopLeaderboard(
  limit = 100,
  opts?: { mode?: LeaderboardMode; playerCount?: LeaderboardPlayerCount },
): Promise<LeaderboardEntry[]> {
  const safeLimit = Math.max(1, Math.min(100, limit));
  const full = await getFullRankedLadder(opts);
  return full.slice(0, safeLimit);
}
