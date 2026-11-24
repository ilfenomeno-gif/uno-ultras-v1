// ============================================================
// UNO ULTRA Server — Players repository (parameterized SQL)
// ============================================================

import { query } from '../client.js';

export interface PlayerRow {
  id: string;
  username: string;
  username_canonical?: string;
  password_hash: string;
  email: string | null;
  rank_tier: string;
  mmr: number;
  vcard: number;
  battle_card_level: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePlayerInput {
  username: string;
  passwordHash: string;
  email?: string;
}

export async function isUsernameReserved(username: string): Promise<boolean> {
  const canonical = username.trim().toLowerCase();
  const res = await query<{ canonical_name: string }>(
    `SELECT canonical_name
       FROM reserved_usernames
      WHERE canonical_name = $1
      LIMIT 1`,
    [canonical]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function findPlayerByUsername(username: string): Promise<PlayerRow | null> {
  const res = await query<PlayerRow>(
    `SELECT id, username, password_hash, email, rank_tier, mmr, vcard, battle_card_level, created_at, updated_at
     FROM players
     WHERE LOWER(username) = LOWER($1)
       AND deleted_at IS NULL
     LIMIT 1`,
    [username.trim()]
  );
  return res.rows[0] ?? null;
}

export async function findPlayerById(id: string): Promise<PlayerRow | null> {
  const res = await query<PlayerRow>(
    `SELECT id, username, password_hash, email, rank_tier, mmr, vcard, battle_card_level, created_at, updated_at
     FROM players
     WHERE id = $1
       AND deleted_at IS NULL
     LIMIT 1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function createPlayer(input: CreatePlayerInput): Promise<PlayerRow> {
  const username = input.username.trim();
  const canonical = username.toLowerCase();

  const res = await query<PlayerRow>(
    `INSERT INTO players (username, username_canonical, password_hash, email)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, password_hash, email, rank_tier, mmr, vcard, battle_card_level, created_at, updated_at`,
    [username, canonical, input.passwordHash, input.email ?? null]
  );
  const row = res.rows[0];
  if (!row) {
    throw new Error('Failed to create player record');
  }
  return row;
}

export async function updatePlayerRank(
  playerId: string,
  mmr: number,
  rankTier: string
): Promise<void> {
  await query(
    `UPDATE players
     SET mmr = $2, rank_tier = $3, updated_at = NOW()
     WHERE id = $1`,
    [playerId, mmr, rankTier]
  );
}
