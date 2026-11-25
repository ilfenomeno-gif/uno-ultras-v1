// ============================================================
// UNO ULTRA Server — Matchmaking MMR Settlement & Adaptive Bounds
// ============================================================

import {
  calculateEloDelta,
  computeAntiSmurfPlacementCalibration,
  computeWeightedPartyMMR,
  formatPlaylistKey,
  getRankFromMMR,
  getSubDivision,
  PLACEMENT_MATCHES_REQUIRED,
  RANK_TIERS,
  type GameMode,
  type PlaylistPlayerCount,
  type RankSubDivision,
} from '@uno/shared';
import {
  getPlayerPlaylistRank,
  listPlayerPlaylistRanks,
  upsertPlayerPlaylistRank,
} from '../persistence/postgres/repositories/playlist-ranks.js';
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
  mode?: GameMode;
  playerCount?: PlaylistPlayerCount;
}): Promise<
  readonly {
    playerId: string;
    mmrBefore: number;
    mmrAfter: number;
    delta: number;
    rankTier: string;
    rankDemoted: boolean;
    subDivision: RankSubDivision;
    placementMatchesPlayed?: number;
    calibratedUpward?: boolean;
    calibrationBonusMmr?: number;
  }[]
> {
  const results: {
    playerId: string;
    mmrBefore: number;
    mmrAfter: number;
    delta: number;
    rankTier: string;
    rankDemoted: boolean;
    subDivision: RankSubDivision;
    placementMatchesPlayed?: number;
    calibratedUpward?: boolean;
    calibrationBonusMmr?: number;
  }[] = [];

  for (const p of input.participants) {
    if (p.isBot) continue;
    const won = p.playerId === input.winnerId;
    const opponents = input.participants.filter((o) => o.playerId !== p.playerId);
    const weightedOppMmr =
      opponents.length > 0
        ? computeWeightedPartyMMR(
            opponents.map((o) => o.mmr),
            { ranked: true },
          )
        : p.mmr;

    const elo = calculateEloDelta({
      playerMMR: p.mmr,
      opponentMMR: weightedOppMmr,
      won,
      ...(input.playlistMultiplier !== undefined
        ? { playlistMultiplier: input.playlistMultiplier }
        : {}),
    });

    let mmrAfter = elo.newMMR;
    let rankTier = elo.newTier ?? getRankFromMMR(mmrAfter);
    let placementMatchesPlayed: number | undefined;
    let calibratedUpward = false;
    let calibrationBonusMmr = 0;
    let prevTier = elo.previousTier;

    try {
      if (input.mode && input.playerCount) {
        const [prevEntry, allRanks] = await Promise.all([
          getPlayerPlaylistRank(p.playerId, input.mode, input.playerCount),
          listPlayerPlaylistRanks(p.playerId),
        ]);
        prevTier = prevEntry.rankTier;
        placementMatchesPlayed = prevEntry.wins + prevEntry.losses + 1;
        const currentKey = formatPlaylistKey(input.mode, input.playerCount);
        const otherCompetitiveMmrs = Object.entries(allRanks)
          .filter(([k, r]) => k !== currentKey && r.wins + r.losses > 0)
          .map(([, r]) => r.mmr);

        if (placementMatchesPlayed === PLACEMENT_MATCHES_REQUIRED) {
          const cal = computeAntiSmurfPlacementCalibration({
            currentPlaylistMmr: mmrAfter,
            matchesPlayedAfter: placementMatchesPlayed,
            otherCompetitiveMmrs,
          });
          if (cal.applied) {
            mmrAfter = cal.calibratedMmr;
            rankTier = getRankFromMMR(mmrAfter);
            calibratedUpward = true;
            calibrationBonusMmr = cal.bonusMmr;
          }
        }

        const { peakMmr } = await upsertPlayerPlaylistRank({
          playerId: p.playerId,
          mode: input.mode,
          playerCount: input.playerCount,
          mmr: mmrAfter,
          rankTier,
          won,
        });
        await updateLeaderboardScore(p.playerId, p.username, mmrAfter, {
          mode: input.mode,
          playerCount: input.playerCount,
          globalMmr: peakMmr,
        }).catch(() => {});
      } else {
        await updatePlayerRank(p.playerId, mmrAfter, rankTier);
        await updateLeaderboardScore(p.playerId, p.username, mmrAfter).catch(() => {});
      }
    } catch {
      // Best effort if DB offline in unit test
    }

    const rankDemoted = RANK_TIERS.indexOf(rankTier) < RANK_TIERS.indexOf(prevTier);
    results.push({
      playerId: p.playerId,
      mmrBefore: p.mmr,
      mmrAfter,
      delta: mmrAfter - p.mmr,
      rankTier,
      rankDemoted,
      subDivision: getSubDivision(mmrAfter),
      ...(placementMatchesPlayed !== undefined ? { placementMatchesPlayed } : {}),
      ...(calibratedUpward ? { calibratedUpward, calibrationBonusMmr } : {}),
    });
  }
  return results;
}
