// ============================================================
// UNO ULTRA Server — Tournaments & 2-Wing UT32 Bracket Repository
// ============================================================

import { TOURNAMENT_PRESETS, type TournamentKind } from '@uno/shared';
import { getPostgresPool, query } from '../client.js';
import { InsufficientFundsError } from './transactions.js';

export interface BracketSlot {
  matchIndex: number;
  wing: 'left' | 'right' | 'final';
  round: number;
  playerA: string | null;
  playerB: string | null;
  winner: string | null;
}

export interface TournamentRow {
  id: string;
  kind: TournamentKind;
  title: string;
  status: 'registering' | 'running' | 'finished' | 'cancelled';
  max_players: number;
  entry_fee_vcard: number;
  prize_pool_credits: number;
  min_mmr: number;
  bracket_data: Record<string, unknown>;
  champion_id: string | null;
  starts_at: Date;
  finished_at: Date | null;
  created_at: Date;
}

/** Genera bracket simmetrico a 2 ali (Left Wing + Right Wing -> Final). */
export function buildTwoWingBracket(participants: readonly string[], maxPlayers: number): BracketSlot[] {
  const half = Math.max(2, Math.floor(maxPlayers / 2));
  const padded = Array.from({ length: maxPlayers }, (_, idx) => participants[idx] ?? null);
  const slots: BracketSlot[] = [];
  let matchIdx = 0;

  for (let i = 0; i < half; i += 2) {
    slots.push({
      matchIndex: matchIdx++,
      wing: 'left',
      round: 1,
      playerA: padded[i] ?? null,
      playerB: padded[i + 1] ?? null,
      winner: null,
    });
  }
  for (let i = half; i < maxPlayers; i += 2) {
    slots.push({
      matchIndex: matchIdx++,
      wing: 'right',
      round: 1,
      playerA: padded[i] ?? null,
      playerB: padded[i + 1] ?? null,
      winner: null,
    });
  }
  slots.push({
    matchIndex: matchIdx,
    wing: 'final',
    round: Math.ceil(Math.log2(maxPlayers)),
    playerA: null,
    playerB: null,
    winner: null,
  });
  return slots;
}

export async function listTournaments(limit = 20): Promise<TournamentRow[]> {
  const res = await query<TournamentRow>(
    `SELECT id, kind, title, status, max_players, entry_fee_vcard, prize_pool_credits,
            min_mmr, bracket_data, champion_id, starts_at, finished_at, created_at
       FROM tournaments
      ORDER BY created_at DESC
      LIMIT $1`,
    [limit],
  );
  return res.rows;
}

export async function createTournamentFromPreset(kind: TournamentKind): Promise<TournamentRow> {
  const preset = TOURNAMENT_PRESETS.find((p) => p.kind === kind) ?? TOURNAMENT_PRESETS[0]!;
  const initialBracket = { slots: buildTwoWingBracket([], preset.maxPlayers) };
  const res = await query<TournamentRow>(
    `INSERT INTO tournaments
       (kind, title, status, max_players, entry_fee_vcard, prize_pool_credits, min_mmr, bracket_data)
     VALUES ($1, $2, 'registering', $3, $4, $5, $6, $7::jsonb)
     RETURNING id, kind, title, status, max_players, entry_fee_vcard, prize_pool_credits,
               min_mmr, bracket_data, champion_id, starts_at, finished_at, created_at`,
    [
      preset.kind,
      preset.title,
      preset.maxPlayers,
      preset.entryFeeVCard,
      preset.prizePoolCredits,
      preset.minMMR,
      JSON.stringify(initialBracket),
    ],
  );
  return res.rows[0]!;
}

export async function joinTournament(
  tournamentId: string,
  playerId: string,
): Promise<{ participantCount: number; bracket: BracketSlot[] }> {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const tRes = await client.query<TournamentRow>(
      `SELECT id, kind, title, status, max_players, entry_fee_vcard, min_mmr
         FROM tournaments WHERE id = $1 FOR UPDATE`,
      [tournamentId],
    );
    const t = tRes.rows[0];
    if (!t) throw new Error('Torneo non trovato');
    if (t.status !== 'registering') throw new Error('Iscrizioni torneo chiuse');

    const pRes = await client.query<{ mmr: number; vcard: number }>(
      `SELECT mmr, vcard FROM players WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
      [playerId],
    );
    const p = pRes.rows[0];
    if (!p) throw new Error('Giocatore non trovato');
    if (Number(p.mmr) < Number(t.min_mmr)) {
      throw new Error(`MMR minimo richiesto: ${t.min_mmr}`);
    }

    const existing = await client.query(
      `SELECT 1 FROM tournament_participants WHERE tournament_id = $1 AND player_id = $2`,
      [tournamentId, playerId],
    );
    if ((existing.rowCount ?? 0) === 0) {
      const countRes = await client.query<{ cnt: string }>(
        `SELECT COUNT(*)::text AS cnt FROM tournament_participants WHERE tournament_id = $1`,
        [tournamentId],
      );
      const count = Number(countRes.rows[0]?.cnt ?? 0);
      if (count >= t.max_players) throw new Error('Torneo al completo');

      if (t.entry_fee_vcard > 0) {
        if (Number(p.vcard) < t.entry_fee_vcard) {
          throw new InsufficientFundsError('vcard', t.entry_fee_vcard, Number(p.vcard));
        }
        const vcardAfter = Number(p.vcard) - t.entry_fee_vcard;
        await client.query(`UPDATE players SET vcard = $1, updated_at = NOW() WHERE id = $2`, [
          vcardAfter,
          playerId,
        ]);
        await client.query(
          `INSERT INTO economy_transactions (player_id, tx_type, currency, amount_delta, balance_after, reference_id)
           VALUES ($1, 'tournament_entry', 'vcard', $2, $3, $4)`,
          [playerId, -t.entry_fee_vcard, vcardAfter, tournamentId],
        );
      }

      await client.query(
        `INSERT INTO tournament_participants (tournament_id, player_id, seed_rank)
         VALUES ($1, $2, $3)`,
        [tournamentId, playerId, count + 1],
      );
    }

    const roster = await client.query<{ username: string }>(
      `SELECT p.username
         FROM tournament_participants tp
         JOIN players p ON p.id = tp.player_id
        WHERE tp.tournament_id = $1
        ORDER BY tp.joined_at ASC`,
      [tournamentId],
    );
    const names = roster.rows.map((r) => r.username);
    const bracket = buildTwoWingBracket(names, t.max_players);
    await client.query(
      `UPDATE tournaments SET bracket_data = $1::jsonb WHERE id = $2`,
      [JSON.stringify({ slots: bracket }), tournamentId],
    );
    await client.query('COMMIT');
    return { participantCount: names.length, bracket };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
