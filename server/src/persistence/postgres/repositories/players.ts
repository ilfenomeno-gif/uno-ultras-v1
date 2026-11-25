// ============================================================
// UNO ULTRA Server — Players repository (parameterized SQL + dev fallback)
// ============================================================

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { query } from '../client.js';
import { canUseDevFallback } from '../dev-store.js';

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

interface StoredDevPlayer {
  id: string;
  username: string;
  username_canonical: string;
  password_hash: string;
  email: string | null;
  rank_tier: string;
  mmr: number;
  vcard: number;
  battle_card_level: number;
  created_at: string;
  updated_at: string;
}

const TEST_SUFFIX = process.env['VITEST'] ? `-vitest-${process.pid}` : '';
const DEV_PLAYERS_FILE = path.join(os.tmpdir(), `uno-ultra-dev-players${TEST_SUFFIX}.json`);
const RESERVED_USERNAMES = new Set(['admin', 'moderator', 'system', 'support', 'uno_bot', 'uno_ultra']);

function readDevPlayers(): StoredDevPlayer[] {
  try {
    if (!fs.existsSync(DEV_PLAYERS_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(DEV_PLAYERS_FILE, 'utf8'));
    return Array.isArray(parsed) ? (parsed as StoredDevPlayer[]) : [];
  } catch {
    return [];
  }
}

function writeDevPlayers(rows: StoredDevPlayer[]): void {
  fs.writeFileSync(DEV_PLAYERS_FILE, JSON.stringify(rows, null, 2), 'utf8');
}

function toPlayerRow(stored: StoredDevPlayer): PlayerRow {
  return {
    id: stored.id,
    username: stored.username,
    username_canonical: stored.username_canonical,
    password_hash: stored.password_hash,
    email: stored.email,
    rank_tier: stored.rank_tier,
    mmr: stored.mmr,
    vcard: stored.vcard,
    battle_card_level: stored.battle_card_level,
    created_at: new Date(stored.created_at),
    updated_at: new Date(stored.updated_at),
  };
}

export async function isUsernameReserved(username: string): Promise<boolean> {
  const canonical = username.trim().toLowerCase();
  try {
    const res = await query<{ canonical_name: string }>(
      `SELECT canonical_name
         FROM reserved_usernames
        WHERE canonical_name = $1
        LIMIT 1`,
      [canonical],
    );
    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    if (canUseDevFallback(err)) {
      return RESERVED_USERNAMES.has(canonical);
    }
    throw err;
  }
}

export async function findPlayerByUsername(username: string): Promise<PlayerRow | null> {
  const trimmed = username.trim();
  const canonical = trimmed.toLowerCase();
  try {
    const res = await query<PlayerRow>(
      `SELECT id, username, password_hash, email, rank_tier, mmr, vcard, battle_card_level, created_at, updated_at
       FROM players
       WHERE LOWER(username) = LOWER($1)
         AND deleted_at IS NULL
       LIMIT 1`,
      [trimmed],
    );
    return res.rows[0] ?? null;
  } catch (err) {
    if (canUseDevFallback(err)) {
      const found = readDevPlayers().find((p) => p.username_canonical === canonical);
      return found ? toPlayerRow(found) : null;
    }
    throw err;
  }
}

export async function findPlayerById(id: string): Promise<PlayerRow | null> {
  try {
    const res = await query<PlayerRow>(
      `SELECT id, username, password_hash, email, rank_tier, mmr, vcard, battle_card_level, created_at, updated_at
       FROM players
       WHERE id = $1
         AND deleted_at IS NULL
       LIMIT 1`,
      [id],
    );
    return res.rows[0] ?? null;
  } catch (err) {
    if (canUseDevFallback(err)) {
      const found = readDevPlayers().find((p) => p.id === id);
      return found ? toPlayerRow(found) : null;
    }
    throw err;
  }
}

export async function createPlayer(input: CreatePlayerInput): Promise<PlayerRow> {
  const username = input.username.trim();
  const canonical = username.toLowerCase();

  try {
    const res = await query<PlayerRow>(
      `INSERT INTO players (username, username_canonical, password_hash, email)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, password_hash, email, rank_tier, mmr, vcard, battle_card_level, created_at, updated_at`,
      [username, canonical, input.passwordHash, input.email ?? null],
    );
    const row = res.rows[0];
    if (!row) {
      throw new Error('Failed to create player record');
    }
    return row;
  } catch (err) {
    if (canUseDevFallback(err)) {
      const list = readDevPlayers();
      if (list.some((p) => p.username_canonical === canonical)) {
        const dup = new Error('Username already exists') as Error & { code: string };
        dup.code = '23505';
        throw dup;
      }
      const nowIso = new Date().toISOString();
      const created: StoredDevPlayer = {
        id: crypto.randomUUID(),
        username,
        username_canonical: canonical,
        password_hash: input.passwordHash,
        email: input.email ?? null,
        rank_tier: 'Bronze I',
        mmr: 400,
        vcard: 500,
        battle_card_level: 1,
        created_at: nowIso,
        updated_at: nowIso,
      };
      list.push(created);
      writeDevPlayers(list);
      return toPlayerRow(created);
    }
    throw err;
  }
}

export function listDevPlayersSnapshot(): PlayerRow[] {
  return readDevPlayers().map(toPlayerRow);
}

export function getDevPlayerSnapshot(playerId: string): PlayerRow | null {
  const found = readDevPlayers().find((p) => p.id === playerId);
  return found ? toPlayerRow(found) : null;
}

export function updateDevPlayerSnapshot(
  playerId: string,
  patch: {
    vcard?: number;
    battle_card_level?: number;
    mmr?: number;
    rank_tier?: string;
  },
): PlayerRow | null {
  const list = readDevPlayers();
  const target = list.find((p) => p.id === playerId);
  if (!target) return null;
  if (patch.vcard !== undefined) target.vcard = patch.vcard;
  if (patch.battle_card_level !== undefined) target.battle_card_level = patch.battle_card_level;
  if (patch.mmr !== undefined) target.mmr = patch.mmr;
  if (patch.rank_tier !== undefined) target.rank_tier = patch.rank_tier;
  target.updated_at = new Date().toISOString();
  writeDevPlayers(list);
  return toPlayerRow(target);
}

export async function updatePlayerRank(
  playerId: string,
  mmr: number,
  rankTier: string,
): Promise<void> {
  try {
    await query(
      `UPDATE players
       SET mmr = $2, rank_tier = $3, updated_at = NOW()
       WHERE id = $1`,
      [playerId, mmr, rankTier],
    );
  } catch (err) {
    if (canUseDevFallback(err)) {
      const list = readDevPlayers();
      const target = list.find((p) => p.id === playerId);
      if (target) {
        target.mmr = mmr;
        target.rank_tier = rankTier;
        target.updated_at = new Date().toISOString();
        writeDevPlayers(list);
      }
      return;
    }
    throw err;
  }
}
