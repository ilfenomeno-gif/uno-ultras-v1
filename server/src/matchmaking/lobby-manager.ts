// ============================================================
// UNO ULTRA Server — Matchmaking Lobby & Rematch / Code Manager
// ============================================================

import { randomBytes } from 'node:crypto';
import type { CustomMatchConfig, GameMode } from '@uno/shared';

export interface PrivateLobbyRecord {
  readonly code: string;
  readonly hostId: string;
  readonly mode: GameMode;
  readonly maxPlayers: number;
  readonly customConfig?: CustomMatchConfig;
  readonly spectatorIds: Set<string>;
  readonly rematchVotes: Set<string>;
  readonly createdAtMs: number;
}

export class LobbyManager {
  private readonly lobbies = new Map<string, PrivateLobbyRecord>();
  private static readonly MAX_LOBBIES = 500;
  private static readonly TTL_MS = 30 * 60_000;

  private pruneExpired(): void {
    const cutoff = Date.now() - LobbyManager.TTL_MS;
    for (const [k, v] of this.lobbies) {
      if (v.createdAtMs < cutoff) this.lobbies.delete(k);
    }
  }

  createLobby(input: {
    hostId: string;
    mode: GameMode;
    maxPlayers: number;
    customConfig?: CustomMatchConfig;
  }): PrivateLobbyRecord {
    this.pruneExpired();
    if (this.lobbies.size >= LobbyManager.MAX_LOBBIES) {
      const oldest = this.lobbies.keys().next().value;
      if (oldest) this.lobbies.delete(oldest);
    }
    const code = randomBytes(3).toString('hex').toUpperCase();
    const record: PrivateLobbyRecord = {
      code,
      hostId: input.hostId,
      mode: input.mode,
      maxPlayers: input.maxPlayers,
      ...(input.customConfig !== undefined ? { customConfig: input.customConfig } : {}),
      spectatorIds: new Set(),
      rematchVotes: new Set(),
      createdAtMs: Date.now(),
    };
    this.lobbies.set(code, record);
    return record;
  }

  getLobby(code: string): PrivateLobbyRecord | null {
    const rec = this.lobbies.get(code.trim().toUpperCase()) ?? null;
    if (rec && Date.now() - rec.createdAtMs > LobbyManager.TTL_MS) {
      this.lobbies.delete(rec.code);
      return null;
    }
    return rec;
  }

  addSpectator(code: string, viewerId: string): boolean {
    const lobby = this.getLobby(code);
    if (!lobby) return false;
    if (lobby.customConfig && !lobby.customConfig.allowSpectators) return false;
    lobby.spectatorIds.add(viewerId);
    return true;
  }

  voteRematch(code: string, playerId: string): number {
    const lobby = this.getLobby(code);
    if (!lobby) return 0;
    lobby.rematchVotes.add(playerId);
    return lobby.rematchVotes.size;
  }

  deleteLobby(code: string): boolean {
    return this.lobbies.delete(code.trim().toUpperCase());
  }
}

export const lobbyManager = new LobbyManager();
