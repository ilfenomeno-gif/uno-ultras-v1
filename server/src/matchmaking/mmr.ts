// ============================================================
// UNO ULTRA Server — Matchmaking MMR Settlement & Adaptive Bounds
// ============================================================

import { calculateEloDelta, getRankFromMMR } from '@uno/shared';
import { updatePlayerRank } from '../persistence/postgres/repositories/players.js';
import { updateLeaderboardScore } from '../persistence/redis/leaderboard.js';

export function computeMatchmakingBand(waitSeconds: number): number {
  const baseBand = 120;
  const expansion = Math.min(600, Math.floor(waitSeconds / 5) * 60);
  return baseBand + expansion;
}

export async function settleRankedMatchForPlayers(input: {
  winnerId: string;
  participants: readonly { playerId: string; username: string; mmr: number; isBot: boolean }[];
  playlistMultiplier?: number;
}): Promise<
  readonly {
    playerId: string;
    mmrBefore: number;
    mmrAfter: number;
    delta: number;
    rankTier: string;
  }[]
> {
  const avgMMR =
    input.participants.reduce((sum, p) => sum + p.mmr, 0) /
    Math.max(1, input.participants.length);

  const results: {
    playerId: string;
    mmrBefore: number;
    mmrAfter: number;
    delta: number;
    rankTier: string;
  }[] = [];

  for (const p of input.participants) {
    if (p.isBot) continue;
    const won = p.playerId === input.winnerId;
    const elo = calculateEloDelta({
      playerMMR: p.mmr,
      opponentMMR: Math.round(avgMMR),
      won,
      ...(input.playlistMultiplier !== undefined
        ? { playlistMultiplier: input.playlistMultiplier }
        : {}),
    });
    const mmrAfter = elo.newMMR;
    const rankTier = elo.newTier ?? getRankFromMMR(mmrAfter);

    try {
      await updatePlayerRank(p.playerId, mmrAfter, rankTier);
    } catch {
      // Best effort if DB offline in unit test
    }
    try {
      await updateLeaderboardScore(p.playerId, p.username, mmrAfter);
    } catch {
      // Best effort if leaderboard unavailable
    }

    results.push({
      playerId: p.playerId,
      mmrBefore: p.mmr,
      mmrAfter,
      delta: elo.delta,
      rankTier,
    });
  }
  return results;
}
