// ============================================================
// UNO ULTRA Server — Independent Per-Mode & Per-Player-Count Ranks
// ============================================================

import {
  formatPlaylistKey,
  getRankFromMMR,
  INITIAL_MMR,
  normalizePlaylistPlayerCount,
  type GameMode,
  type PlaylistRankEntry,
  type RankTier,
} from '@uno/shared';
import { query } from '../client.js';
import { canUseDevFallback, readDevState, updateDevState } from '../dev-store.js';
import { getDevPlayerSnapshot, updatePlayerRank } from './players.js';

function defaultPlaylistEntry(
  mode: GameMode,
  playerCount: number,
): PlaylistRankEntry {
  const norm = normalizePlaylistPlayerCount(playerCount);
  return {
    mode,
    playerCount: norm,
    mmr: INITIAL_MMR,
    rankTier: getRankFromMMR(INITIAL_MMR),
    wins: 0,
    losses: 0,
  };
}

export async function getPlayerPlaylistRank(
  playerId: string,
  mode: GameMode,
  playerCount: number,
): Promise<PlaylistRankEntry> {
  const norm = normalizePlaylistPlayerCount(playerCount);
  try {
    const res = await query<{
      mode: GameMode;
      player_count: number;
      mmr: number;
      rank_tier: string;
      wins: number;
      losses: number;
    }>(
      `SELECT mode, player_count, mmr, rank_tier, wins, losses
         FROM player_playlist_ranks
        WHERE player_id = $1 AND mode = $2 AND player_count = $3
        LIMIT 1`,
      [playerId, mode, norm],
    );
    const row = res.rows[0];
    if (!row) return defaultPlaylistEntry(mode, norm);
    return {
      mode: row.mode,
      playerCount: normalizePlaylistPlayerCount(row.player_count),
      mmr: Number(row.mmr),
      rankTier: row.rank_tier as RankTier,
      wins: Number(row.wins),
      losses: Number(row.losses),
    };
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const key = formatPlaylistKey(mode, norm);
    const rec = readDevState().playlistRanks[playerId]?.[key];
    if (!rec) return defaultPlaylistEntry(mode, norm);
    return {
      mode: rec.mode as GameMode,
      playerCount: normalizePlaylistPlayerCount(rec.playerCount),
      mmr: rec.mmr,
      rankTier: rec.rankTier as RankTier,
      wins: rec.wins,
      losses: rec.losses,
    };
  }
}

export async function listPlayerPlaylistRanks(
  playerId: string,
): Promise<Record<string, PlaylistRankEntry>> {
  try {
    const res = await query<{
      mode: GameMode;
      player_count: number;
      mmr: number;
      rank_tier: string;
      wins: number;
      losses: number;
    }>(
      `SELECT mode, player_count, mmr, rank_tier, wins, losses
         FROM player_playlist_ranks
        WHERE player_id = $1`,
      [playerId],
    );
    const out: Record<string, PlaylistRankEntry> = {};
    for (const r of res.rows) {
      const key = formatPlaylistKey(r.mode, r.player_count);
      out[key] = {
        mode: r.mode,
        playerCount: normalizePlaylistPlayerCount(r.player_count),
        mmr: Number(r.mmr),
        rankTier: r.rank_tier as RankTier,
        wins: Number(r.wins),
        losses: Number(r.losses),
      };
    }
    return out;
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const devMap = readDevState().playlistRanks[playerId] ?? {};
    const out: Record<string, PlaylistRankEntry> = {};
    for (const [key, rec] of Object.entries(devMap)) {
      out[key] = {
        mode: rec.mode as GameMode,
        playerCount: normalizePlaylistPlayerCount(rec.playerCount),
        mmr: rec.mmr,
        rankTier: rec.rankTier as RankTier,
        wins: rec.wins,
        losses: rec.losses,
      };
    }
    return out;
  }
}

export async function upsertPlayerPlaylistRank(input: {
  playerId: string;
  mode: GameMode;
  playerCount: number;
  mmr: number;
  rankTier: RankTier;
  won: boolean;
}): Promise<{
  entry: PlaylistRankEntry;
  peakMmr: number;
  peakRankTier: RankTier;
}> {
  const norm = normalizePlaylistPlayerCount(input.playerCount);
  const key = formatPlaylistKey(input.mode, norm);

  try {
    const res = await query<{
      mode: GameMode;
      player_count: number;
      mmr: number;
      rank_tier: string;
      wins: number;
      losses: number;
    }>(
      `INSERT INTO player_playlist_ranks (player_id, mode, player_count, mmr, rank_tier, wins, losses, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (player_id, mode, player_count)
       DO UPDATE SET
         mmr = EXCLUDED.mmr,
         rank_tier = EXCLUDED.rank_tier,
         wins = player_playlist_ranks.wins + EXCLUDED.wins,
         losses = player_playlist_ranks.losses + EXCLUDED.losses,
         updated_at = NOW()
       RETURNING mode, player_count, mmr, rank_tier, wins, losses`,
      [
        input.playerId,
        input.mode,
        norm,
        input.mmr,
        input.rankTier,
        input.won ? 1 : 0,
        input.won ? 0 : 1,
      ],
    );
    const peakRes = await query<{ peak_mmr: number }>(
      `SELECT COALESCE(MAX(mmr), $2) AS peak_mmr FROM player_playlist_ranks WHERE player_id = $1`,
      [input.playerId, input.mmr],
    );
    const peakMmr = Number(peakRes.rows[0]?.peak_mmr ?? input.mmr);
    const peakRankTier = getRankFromMMR(peakMmr);
    await updatePlayerRank(input.playerId, peakMmr, peakRankTier);

    const row = res.rows[0]!;
    return {
      entry: {
        mode: row.mode,
        playerCount: normalizePlaylistPlayerCount(row.player_count),
        mmr: Number(row.mmr),
        rankTier: row.rank_tier as RankTier,
        wins: Number(row.wins),
        losses: Number(row.losses),
      },
      peakMmr,
      peakRankTier,
    };
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const saved = updateDevState((state) => {
      const pMap = (state.playlistRanks[input.playerId] ??= {});
      const prev = pMap[key];
      const next = {
        mode: input.mode,
        playerCount: norm,
        mmr: input.mmr,
        rankTier: input.rankTier,
        wins: (prev?.wins ?? 0) + (input.won ? 1 : 0),
        losses: (prev?.losses ?? 0) + (input.won ? 0 : 1),
      };
      pMap[key] = next;
      let peakMmr = input.mmr;
      for (const item of Object.values(pMap)) {
        if (item.mmr > peakMmr) peakMmr = item.mmr;
      }
      return { entry: next, peakMmr };
    });
    const peakRankTier = getRankFromMMR(saved.peakMmr);
    if (getDevPlayerSnapshot(input.playerId)) {
      await updatePlayerRank(input.playerId, saved.peakMmr, peakRankTier);
    }
    return {
      entry: {
        mode: saved.entry.mode as GameMode,
        playerCount: normalizePlaylistPlayerCount(saved.entry.playerCount),
        mmr: saved.entry.mmr,
        rankTier: saved.entry.rankTier as RankTier,
        wins: saved.entry.wins,
        losses: saved.entry.losses,
      },
      peakMmr: saved.peakMmr,
      peakRankTier,
    };
  }
}
