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
}

export async function signIn(payload: LoginPayload): Promise<void> {
  const { token, profile } = await rest.login(payload);
  saveSession(token, profile);
}

export function signOut(): void {
  clearSession();
  void colyseus.leaveRoom();
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

export { colyseus };
