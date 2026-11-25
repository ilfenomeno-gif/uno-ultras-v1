// ============================================================
// UNO ULTRA Server — Competitive Matchmaking Bans & Abandonment Penalties
// ============================================================

import {
  computeAbandonBanDurationMinutes,
  computeAbandonMmrPenalty,
  type ActiveMatchmakingBan,
  type GameMode,
  type RankTier,
} from '@uno/shared';
import { query } from '../client.js';
import { canUseDevFallback, readDevState, updateDevState } from '../dev-store.js';
import { updateLeaderboardScore } from '../../redis/leaderboard.js';
import { getPlayerPlaylistRank, upsertPlayerPlaylistRank } from './playlist-ranks.js';

const OFFENSE_RESET_WINDOW_MS = 24 * 60 * 60 * 1000;

function toActiveBan(rec: {
  banExpiresAt: string | Date;
  offenseCount: number;
  lastReason: string;
}): ActiveMatchmakingBan | null {
  const expiresMs = new Date(rec.banExpiresAt).getTime();
  const remainingMs = expiresMs - Date.now();
  if (!Number.isFinite(expiresMs) || remainingMs <= 0) return null;
  return {
    expiresAt: new Date(expiresMs).toISOString(),
    remainingSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    offenseCount: rec.offenseCount,
    reason: rec.lastReason,
  };
}

/**
 * Restituisce il ban attivo dal matchmaking competitivo, o null se scaduto/assente.
 */
export async function getActiveMatchmakingBan(
  playerId: string,
): Promise<ActiveMatchmakingBan | null> {
  try {
    const res = await query<{
      ban_expires_at: Date;
      offense_count: number;
      last_reason: string;
    }>(
      `SELECT ban_expires_at, offense_count, last_reason
         FROM player_matchmaking_bans
        WHERE player_id = $1
        LIMIT 1`,
      [playerId],
    );
    const row = res.rows[0];
    if (!row) return null;
    return toActiveBan({
      banExpiresAt: row.ban_expires_at,
      offenseCount: Number(row.offense_count),
      lastReason: row.last_reason,
    });
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const rec = readDevState().matchmakingBans[playerId];
    if (!rec) return null;
    return toActiveBan(rec);
  }
}

/**
 * Registra l'abbandono anticipato di una partita competitiva:
 * - Registra la sconfitta sulla playlist interessata
 * - Applica una perdita di MMR più severa al primo giocatore a lasciare la partita
 * - Emette un ban temporaneo progressivo dal matchmaking (5 → 10 → 20 → 60 min)
 */
export async function recordMatchAbandonment(input: {
  playerId: string;
  username: string;
  matchId: string;
  mode: GameMode;
  playerCount: number;
  opponentMmr: number;
  isFirstLeaver: boolean;
}): Promise<{
  ban: ActiveMatchmakingBan;
  mmrBefore: number;
  mmrAfter: number;
  mmrDelta: number;
  rankTier: RankTier;
}> {
  const prevRank = await getPlayerPlaylistRank(input.playerId, input.mode, input.playerCount);
  const penalty = computeAbandonMmrPenalty({
    playerMMR: prevRank.mmr,
    opponentMMR: input.opponentMmr,
    isFirstLeaver: input.isFirstLeaver,
  });

  try {
    const { peakMmr } = await upsertPlayerPlaylistRank({
      playerId: input.playerId,
      mode: input.mode,
      playerCount: input.playerCount,
      mmr: penalty.newMMR,
      rankTier: penalty.newTier,
      won: false,
    });
    await updateLeaderboardScore(input.playerId, input.username, penalty.newMMR, {
      mode: input.mode,
      playerCount: input.playerCount === 2 ? 2 : input.playerCount === 3 ? 3 : 4,
      globalMmr: peakMmr,
    }).catch(() => {});
  } catch {
    // Fallback silenzioso in test isolati
  }

  const reason = input.isFirstLeaver
    ? 'Abbandono anticipato (primo giocatore a lasciare: penalità MMR aggravata)'
    : 'Abbandono anticipato partita competitiva';

  try {
    const existing = await query<{ offense_count: number; last_offense_at: Date }>(
      `SELECT offense_count, last_offense_at FROM player_matchmaking_bans WHERE player_id = $1 LIMIT 1`,
      [input.playerId],
    );
    const prevRow = existing.rows[0];
    const recent =
      prevRow && Date.now() - new Date(prevRow.last_offense_at).getTime() < OFFENSE_RESET_WINDOW_MS;
    const nextOffenses = recent ? Number(prevRow.offense_count) + 1 : 1;
    const banMinutes = computeAbandonBanDurationMinutes(nextOffenses);
    const expiresAt = new Date(Date.now() + banMinutes * 60 * 1000);

    await query(
      `INSERT INTO player_matchmaking_bans (player_id, ban_expires_at, offense_count, last_offense_at, last_reason)
       VALUES ($1, $2, $3, NOW(), $4)
       ON CONFLICT (player_id)
       DO UPDATE SET
         ban_expires_at = EXCLUDED.ban_expires_at,
         offense_count = EXCLUDED.offense_count,
         last_offense_at = NOW(),
         last_reason = EXCLUDED.last_reason`,
      [input.playerId, expiresAt, nextOffenses, reason],
    );

    const ban: ActiveMatchmakingBan = {
      expiresAt: expiresAt.toISOString(),
      remainingSeconds: banMinutes * 60,
      offenseCount: nextOffenses,
      reason,
    };
    return {
      ban,
      mmrBefore: prevRank.mmr,
      mmrAfter: penalty.newMMR,
      mmrDelta: penalty.delta,
      rankTier: penalty.newTier,
    };
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const ban = updateDevState((state) => {
      const prev = state.matchmakingBans[input.playerId];
      const recent =
        prev && Date.now() - new Date(prev.lastOffenseAt).getTime() < OFFENSE_RESET_WINDOW_MS;
      const nextOffenses = recent ? prev.offenseCount + 1 : 1;
      const banMinutes = computeAbandonBanDurationMinutes(nextOffenses);
      const expiresAt = new Date(Date.now() + banMinutes * 60 * 1000).toISOString();
      state.matchmakingBans[input.playerId] = {
        banExpiresAt: expiresAt,
        offenseCount: nextOffenses,
        lastOffenseAt: new Date().toISOString(),
        lastReason: reason,
      };
      return {
        expiresAt,
        remainingSeconds: banMinutes * 60,
        offenseCount: nextOffenses,
        reason,
      } satisfies ActiveMatchmakingBan;
    });
    return {
      ban,
      mmrBefore: prevRank.mmr,
      mmrAfter: penalty.newMMR,
      mmrDelta: penalty.delta,
      rankTier: penalty.newTier,
    };
  }
}
