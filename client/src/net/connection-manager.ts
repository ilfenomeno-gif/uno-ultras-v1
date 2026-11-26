// ============================================================
// UNO ULTRA — Orchestrates REST auth + Colyseus room lifecycle
// ============================================================

import type { Room } from 'colyseus.js';
import type { LoginPayload, RegisterPayload, UnoRoomState } from '@uno/shared';
import * as rest from './tcp/rest-client.js';
import * as colyseus from './tcp/colyseus-client.js';
import { saveSession, clearSession, getToken } from '../state/profile-store.js';

export async function signUp(payload: RegisterPayload): Promise<void> {
  const { token, profile } = await rest.register(payload);
  saveSession(token, profile);
  void rest.sendPresenceHeartbeat().catch(() => undefined);
}

export async function signIn(payload: LoginPayload): Promise<void> {
  const { token, profile } = await rest.login(payload);
  saveSession(token, profile);
  void rest.sendPresenceHeartbeat().catch(() => undefined);
}

export function signOut(): void {
  if (getToken()) {
    void rest.logoutSession().catch(() => undefined);
  }
  clearSession();
  void colyseus.leaveRoom();
}

export async function createInviteLobby(opts?: {
  maxPlayers?: number;
  variant?: string;
}): Promise<Room<UnoRoomState>> {
  const token = getToken();
  if (!token) throw new Error('Utente non autenticato');
  return colyseus.createUnoLobbyRoom({
    token,
    mode: 'uno',
    maxPlayers: opts?.maxPlayers ?? 2,
    ranked: false,
    fillWithBots: false,
    ...(opts?.variant !== undefined ? { variant: opts.variant } : {}),
  });
}

export async function enterMatch(opts: {
  mode: string;
  maxPlayers: number;
  ranked: boolean;
  fillWithBots?: boolean;
  variant?: string;
  spectator?: boolean;
}): Promise<Room<UnoRoomState>> {
  const token = getToken();
  if (!token) throw new Error('Utente non autenticato');
  return colyseus.joinUnoRoom({ token, ...opts });
}

export async function joinMatchById(roomId: string): Promise<Room<UnoRoomState>> {
  const token = getToken();
  if (!token) throw new Error('Utente non autenticato');
  return colyseus.joinUnoRoomById(roomId, token);
}

export { colyseus };
