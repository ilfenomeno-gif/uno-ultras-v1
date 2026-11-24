// ============================================================
// UNO ULTRA — Client-side profile & token persistence
// ============================================================

import type { PlayerProfile } from '@uno/shared';

const TOKEN_KEY = 'uno.token';
const PROFILE_KEY = 'uno.profile';

let currentToken: string | null = null;
let currentProfile: PlayerProfile | null = null;

export function loadFromStorage(): void {
  try {
    currentToken = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(PROFILE_KEY);
    currentProfile = raw ? (JSON.parse(raw) as PlayerProfile) : null;
  } catch {
    currentToken = null;
    currentProfile = null;
  }
}

export function saveSession(token: string, profile: PlayerProfile): void {
  currentToken = token;
  currentProfile = profile;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearSession(): void {
  currentToken = null;
  currentProfile = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export function getToken(): string | null {
  return currentToken;
}

export function getProfile(): PlayerProfile | null {
  return currentProfile;
}

export function isAuthenticated(): boolean {
  return currentToken !== null && currentProfile !== null;
}

export function patchProfile(partial: Partial<PlayerProfile>): PlayerProfile | null {
  if (!currentProfile) return null;
  currentProfile = { ...currentProfile, ...partial };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(currentProfile));
  } catch {
    // non-fatal
  }
  return currentProfile;
}
