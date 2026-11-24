// ============================================================
// UNO ULTRA — Validatori Zod: azioni di lobby
// ============================================================

import { z } from 'zod';
import { ENGINE_MODES } from '../../constants/game-modes.js';
import type { LobbyAction } from '../../types/lobby.js';

// ── Schema join lobby ─────────────────────────────────────────

export const JoinLobbyPayloadSchema = z.object({
  /** Modalità di gioco richiesta. */
  mode: z.enum(ENGINE_MODES),
  /** Numero di giocatori (2-4). */
  playerCount: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  /** Se true, la partita conta per la classifica. */
  ranked: z.boolean(),
  /** Stanza privata: se presente, si entra per codice. */
  roomCode: z.string().length(6).toUpperCase().optional(),
});

// ── Schema azioni di lobby (allineato a types/lobby.ts) ──────

const ReadySchema = z.object({
  type: z.literal('ready'),
  value: z.boolean(),
});

const KickSchema = z.object({
  type: z.literal('kick'),
  playerId: z.string().min(1),
});

const StartSchema = z.object({
  type: z.literal('start'),
});

const LeaveLobbySchema = z.object({
  type: z.literal('leave'),
});

export const LobbyActionSchema = z.discriminatedUnion('type', [
  ReadySchema,
  KickSchema,
  StartSchema,
  LeaveLobbySchema,
]);

// ── Helper di parsing ────────────────────────────────────────

/**
 * Valida e converte un payload grezzo in LobbyAction.
 */
export function parseLobbyAction(raw: unknown): LobbyAction {
  return LobbyActionSchema.parse(raw);
}

// ── Tipi inferiti ─────────────────────────────────────────────

export type JoinLobbyPayload = z.infer<typeof JoinLobbyPayloadSchema>;
export type ParsedLobbyAction = z.infer<typeof LobbyActionSchema>;
