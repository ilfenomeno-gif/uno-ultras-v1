// ============================================================
// UNO ULTRA Server — Matches, Career Stats & Replays Repository
// ============================================================

import crypto from 'node:crypto';
import { getPostgresPool, query } from '../client.js';
import { canUseDevFallback, readDevState, updateDevState } from '../dev-store.js';

export interface MatchParticipantRecord {
  playerId?: string;
  botName?: string;
  isBot: boolean;
  placement: number;
  score: number;
  mmrBefore: number;
  mmrAfter: number;
  mmrDelta: number;
  vcardEarned: number;
  xpEarned: number;
}

export interface RecordMatchInput {
  mode: string;
  variant: string;
  isRanked: boolean;
  winnerId?: string;
  winnerLabel: string;
  turnCount: number;
  durationSec: number;
  rulesSnapshot?: Record<string, unknown>;
  participants: readonly MatchParticipantRecord[];
  replaySeed?: number;
  replayEvents?: readonly Record<string, unknown>[];
}

export async function recordFinishedMatch(input: RecordMatchInput): Promise<string> {
  try {
    const pool = getPostgresPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const matchRes = await client.query<{ id: string }>(
        `INSERT INTO matches
           (mode, variant, is_ranked, status, winner_id, winner_label, turn_count, duration_sec, rules_snapshot, finished_at)
         VALUES ($1, $2, $3, 'finished', $4, $5, $6, $7, $8::jsonb, NOW())
         RETURNING id`,
        [
          input.mode,
          input.variant,
          input.isRanked,
          input.winnerId ?? null,
          input.winnerLabel,
          input.turnCount,
          input.durationSec,
          JSON.stringify(input.rulesSnapshot ?? {}),
        ],
      );
      const matchId = matchRes.rows[0]!.id;

      for (const p of input.participants) {
        await client.query(
          `INSERT INTO match_participants
             (match_id, player_id, bot_name, is_bot, placement, score, mmr_before, mmr_after, mmr_delta, vcard_earned, xp_earned)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            matchId,
            p.playerId ?? null,
            p.botName ?? null,
            p.isBot,
            p.placement,
            p.score,
            p.mmrBefore,
            p.mmrAfter,
            p.mmrDelta,
            p.vcardEarned,
            p.xpEarned,
          ],
        );

        if (!p.isBot && p.playerId) {
          const won = p.placement === 1;
          await client.query(
            `INSERT INTO player_mode_stats (player_id, mode, matches_played, wins, best_streak, current_streak)
             VALUES ($1, $2, 1, $3, $3, $3)
             ON CONFLICT (player_id, mode)
             DO UPDATE SET
               matches_played = player_mode_stats.matches_played + 1,
               wins = player_mode_stats.wins + $3,
               current_streak = CASE WHEN $3 = 1 THEN player_mode_stats.current_streak + 1 ELSE 0 END,
               best_streak = GREATEST(
                 player_mode_stats.best_streak,
                 CASE WHEN $3 = 1 THEN player_mode_stats.current_streak + 1 ELSE player_mode_stats.best_streak END
               ),
               updated_at = NOW()`,
            [p.playerId, input.mode, won ? 1 : 0],
          );
        }
      }

      if (input.replayEvents) {
        await client.query(
          `INSERT INTO match_replays (match_id, seed, events)
           VALUES ($1, $2, $3::jsonb)`,
          [matchId, input.replaySeed ?? 0, JSON.stringify(input.replayEvents)],
        );
      }

      await client.query('COMMIT');
      return matchId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const matchId = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    updateDevState((state) => {
      state.matches.unshift({
        id: matchId,
        mode: input.mode,
        variant: input.variant,
        isRanked: input.isRanked,
        ...(input.winnerId !== undefined ? { winnerId: input.winnerId } : {}),
        winnerLabel: input.winnerLabel,
        turnCount: input.turnCount,
        durationSec: input.durationSec,
        finishedAt: nowIso,
        participants: input.participants.map((p) => ({ ...p })),
        ...(input.replaySeed !== undefined ? { replaySeed: input.replaySeed } : {}),
        ...(input.replayEvents !== undefined ? { replayEvents: [...input.replayEvents] } : {}),
      });
      if (state.matches.length > 400) state.matches.length = 400;
    });
    return matchId;
  }
}

export async function getPlayerCareerSummary(playerId: string): Promise<{
  modeStats: readonly {
    mode: string;
    matchesPlayed: number;
    wins: number;
    winRate: number;
    bestStreak: number;
  }[];
  recentMatches: readonly {
    matchId: string;
    mode: string;
    variant: string;
    isRanked: boolean;
    placement: number;
    mmrDelta: number;
    vcardEarned: number;
    finishedAt: Date | null;
  }[];
}> {
  try {
    const statsRes = await query<{
      mode: string;
      matches_played: number;
      wins: number;
      best_streak: number;
    }>(
      `SELECT mode, matches_played, wins, best_streak
         FROM player_mode_stats
        WHERE player_id = $1
        ORDER BY matches_played DESC`,
      [playerId],
    );

    const recentRes = await query<{
      match_id: string;
      mode: string;
      variant: string;
      is_ranked: boolean;
      placement: number;
      mmr_delta: number;
      vcard_earned: number;
      finished_at: Date | null;
    }>(
      `SELECT m.id AS match_id, m.mode, m.variant, m.is_ranked,
              mp.placement, mp.mmr_delta, mp.vcard_earned, m.finished_at
         FROM match_participants mp
         JOIN matches m ON m.id = mp.match_id
        WHERE mp.player_id = $1
        ORDER BY m.created_at DESC
        LIMIT 25`,
      [playerId],
    );

    return {
      modeStats: statsRes.rows.map((r) => ({
        mode: r.mode,
        matchesPlayed: Number(r.matches_played),
        wins: Number(r.wins),
        winRate:
          Number(r.matches_played) > 0
            ? Math.round((Number(r.wins) / Number(r.matches_played)) * 100)
            : 0,
        bestStreak: Number(r.best_streak),
      })),
      recentMatches: recentRes.rows.map((r) => ({
        matchId: r.match_id,
        mode: r.mode,
        variant: r.variant,
        isRanked: Boolean(r.is_ranked),
        placement: Number(r.placement),
        mmrDelta: Number(r.mmr_delta),
        vcardEarned: Number(r.vcard_earned),
        finishedAt: r.finished_at,
      })),
    };
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const allMatches = readDevState().matches;
    const byMode = new Map<
      string,
      { matchesPlayed: number; wins: number; curStreak: number; bestStreak: number }
    >();
    const recentMatches: Array<{
      matchId: string;
      mode: string;
      variant: string;
      isRanked: boolean;
      placement: number;
      mmrDelta: number;
      vcardEarned: number;
      finishedAt: Date | null;
    }> = [];

    // Iterate chronological order for streak accuracy, collect recent first
    for (let i = allMatches.length - 1; i >= 0; i--) {
      const m = allMatches[i]!;
      const part = m.participants.find((p) => !p.isBot && p.playerId === playerId);
      if (!part) continue;
      const st = byMode.get(m.mode) ?? {
        matchesPlayed: 0,
        wins: 0,
        curStreak: 0,
        bestStreak: 0,
      };
      st.matchesPlayed += 1;
      if (part.placement === 1) {
        st.wins += 1;
        st.curStreak += 1;
        st.bestStreak = Math.max(st.bestStreak, st.curStreak);
      } else {
        st.curStreak = 0;
      }
      byMode.set(m.mode, st);
    }

    for (const m of allMatches) {
      const part = m.participants.find((p) => !p.isBot && p.playerId === playerId);
      if (!part) continue;
      recentMatches.push({
        matchId: m.id,
        mode: m.mode,
        variant: m.variant,
        isRanked: m.isRanked,
        placement: part.placement,
        mmrDelta: part.mmrDelta,
        vcardEarned: part.vcardEarned,
        finishedAt: new Date(m.finishedAt),
      });
      if (recentMatches.length >= 25) break;
    }

    const modeStats = [...byMode.entries()]
      .sort((a, b) => b[1].matchesPlayed - a[1].matchesPlayed)
      .map(([mode, s]) => ({
        mode,
        matchesPlayed: s.matchesPlayed,
        wins: s.wins,
        winRate: s.matchesPlayed > 0 ? Math.round((s.wins / s.matchesPlayed) * 100) : 0,
        bestStreak: s.bestStreak,
      }));

    return { modeStats, recentMatches };
  }
}

export async function getMatchReplay(matchId: string): Promise<{
  matchId: string;
  seed: number;
  events: unknown[];
} | null> {
  try {
    const res = await query<{ match_id: string; seed: string; events: unknown }>(
      `SELECT match_id, seed, events FROM match_replays WHERE match_id = $1 LIMIT 1`,
      [matchId],
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      matchId: row.match_id,
      seed: Number(row.seed),
      events: Array.isArray(row.events) ? row.events : [],
    };
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const found = readDevState().matches.find((m) => m.id === matchId && m.replayEvents);
    if (!found) return null;
    return {
      matchId: found.id,
      seed: found.replaySeed ?? 0,
      events: found.replayEvents ?? [],
    };
  }
}
