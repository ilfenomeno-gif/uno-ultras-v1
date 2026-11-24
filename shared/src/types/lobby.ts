// ============================================================
// UNO ULTRA — Lobby contracts
// ============================================================

import type { GameMode, PlayerCount } from '../constants/game-modes.js';

export interface LobbySlot {
  readonly playerId: string;
  readonly username: string;
  readonly isReady: boolean;
}

export interface LobbyState {
  readonly lobbyId: string;
  readonly mode: GameMode;
  readonly maxPlayers: PlayerCount;
  readonly isRanked: boolean;
  readonly slots: readonly LobbySlot[];
  readonly hostId: string | null;
}

export type LobbyAction =
  | { type: 'ready'; value: boolean }
  | { type: 'kick'; playerId: string }
  | { type: 'start' }
  | { type: 'leave' };