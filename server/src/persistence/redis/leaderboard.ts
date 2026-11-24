// ============================================================
// UNO ULTRA Server — Redis Sorted-Set Top 100 Leaderboard (with DB/Memory fallback)
// ============================================================

import { getRankFromMMR } from '@uno/shared';
import { query } from '../postgres/client.js';
import { getRedisClient } from './client.js';

const LEADERBOARD_KEY = 'leaderboard:mmr';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  mmr: number;
  rankTier: string;
}

const memoryScores = new Map<string, { username: string; mmr: number }>();

export async function updateLeaderboardScore(
  playerId: string,
  username: string,
  mmr: number,
): Promise<void> {
  if (memoryScores.size >= 500 && !memoryScores.has(playerId)) {
    const oldest = memoryScores.keys().next().value;
    if (oldest) memoryScores.delete(oldest);
  }
  memoryScores.set(playerId, { username, mmr });
  try {
    const client = getRedisClient();
    if (client.isOpen) {
      await client.zAdd(LEADERBOARD_KEY, { score: mmr, value: `${playerId}|${username}` });
    }
  } catch {
    // non-fatal
  }
}

export async function getTopLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const safeLimit = Math.max(1, Math.min(100, limit));
  try {
    const client = getRedisClient();
    if (client.isOpen) {
      const items = await client.zRangeWithScores(LEADERBOARD_KEY, 0, safeLimit - 1, { REV: true });
      if (items.length > 0) {
        return items.map((entry, idx) => {
          const [playerId = '', username = 'Unknown'] = entry.value.split('|');
          const mmr = Math.round(entry.score);
          return {
            rank: idx + 1,
            playerId,
            username,
            mmr,
            rankTier: getRankFromMMR(mmr),
          };
        });
      }
    }
  } catch {
    // Fallback to Postgres
  }

  try {
    const res = await query<{ id: string; username: string; mmr: number; rank_tier: string }>(
      `SELECT id, username, mmr, rank_tier
         FROM players
        WHERE deleted_at IS NULL
        ORDER BY mmr DESC, username ASC
        LIMIT $1`,
      [safeLimit],
    );
    if (res.rows.length > 0) {
      return res.rows.map((r, idx) => ({
        rank: idx + 1,
        playerId: r.id,
        username: r.username,
        mmr: Number(r.mmr),
        rankTier: r.rank_tier,
      }));
    }
  } catch {
    // Fallback to in-memory cache
  }

  return [...memoryScores.entries()]
    .sort((a, b) => b[1].mmr - a[1].mmr)
    .slice(0, safeLimit)
    .map(([playerId, info], idx) => ({
      rank: idx + 1,
      playerId,
      username: info.username,
      mmr: info.mmr,
      rankTier: getRankFromMMR(info.mmr),
    }));
}
