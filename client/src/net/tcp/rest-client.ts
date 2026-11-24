// ============================================================
// UNO ULTRA — REST API client (auth + social endpoints)
// ============================================================

import type { LoginPayload, PlayerProfile, RegisterPayload } from '@uno/shared';
import { getToken } from '../../state/profile-store.js';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export interface AuthResponse {
  token: string;
  profile: PlayerProfile;
}

export interface MeResponse {
  profile: PlayerProfile;
}

export interface FriendItem {
  friendshipId: string;
  playerId: string;
  username: string;
  rankTier: string;
  mmr: number;
  presenceStatus: 'online' | 'ingame' | 'offline';
}

export interface PendingFriendRequest {
  requestId: string;
  playerId: string;
  username: string;
  rankTier: string;
  mmr: number;
  createdAt: string;
}

export interface BlockedUserItem {
  playerId: string;
  username: string;
  blockedAt: string;
}

export interface FriendsListResponse {
  online: FriendItem[];
  offline: FriendItem[];
  pendingIncoming: PendingFriendRequest[];
  blocked: BlockedUserItem[];
}

export interface NotificationItem {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'party_invite' | 'system';
  payload: Record<string, unknown>;
  createdAt: string;
  expiresAt: string | null;
}

export interface PublicPlayerProfile {
  id: string;
  username: string;
  rank: string;
  mmr: number;
  battleCardLevel: number;
  createdAt: string;
  presenceStatus: 'online' | 'ingame' | 'offline';
}

export interface SendInviteResponse {
  inviteId: string;
  deliveredOnline: boolean;
  expiresAt: string | null;
}

interface ApiError {
  code?: string;
  message?: string;
  error?: string;
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.message ?? err.error ?? `HTTP ${res.status}`);
  }
  return data as T;
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function postJson<T>(path: string, body: unknown, withAuth = false): Promise<T> {
  return requestJson<T>(path, {
    method: 'POST',
    headers: withAuth
      ? authHeaders({ 'Content-Type': 'application/json' })
      : { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/register', payload);
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/login', payload);
}

export async function me(token: string): Promise<MeResponse> {
  return requestJson<MeResponse>('/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function health(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return (await res.json()) as { status: string };
}

// ── Social & Profile ──────────────────────────────────────

export async function fetchFriends(): Promise<FriendsListResponse> {
  return requestJson<FriendsListResponse>('/friends', {
    method: 'GET',
    headers: authHeaders(),
  });
}

export async function sendFriendRequest(
  targetUsername: string
): Promise<{ friendshipId: string; status: string }> {
  return postJson('/friends/request', { targetUsername }, true);
}

export async function respondFriendRequest(
  requestId: string,
  action: 'accept' | 'reject'
): Promise<{ status: string }> {
  return postJson('/friends/respond', { requestId, action }, true);
}

export async function removeFriend(friendId: string): Promise<void> {
  await requestJson(`/friends/${encodeURIComponent(friendId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function blockPlayer(targetPlayerId: string): Promise<void> {
  await postJson('/friends/block', { targetPlayerId }, true);
}

export async function unblockPlayer(blockedId: string): Promise<void> {
  await requestJson(`/friends/block/${encodeURIComponent(blockedId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function fetchNotifications(): Promise<{ items: NotificationItem[] }> {
  return requestJson('/notifications', {
    method: 'GET',
    headers: authHeaders(),
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  await postJson(`/notifications/${encodeURIComponent(id)}/read`, {}, true);
}

export async function sendPartyInvite(payload: {
  targetPlayerId: string;
  roomId: string;
  mode: string;
}): Promise<SendInviteResponse> {
  return postJson('/invites/send', payload, true);
}

export async function fetchPublicProfile(
  username: string
): Promise<PublicPlayerProfile> {
  return requestJson(`/players/${encodeURIComponent(username)}/profile`, {
    method: 'GET',
    headers: authHeaders(),
  });
}

// ── Shop, Inventory, Battle Card, Challenges, Leaderboard, Tournaments, Sync ──

export async function fetchShopCatalog(): Promise<{
  items: readonly Record<string, unknown>[];
  dailyRotation: readonly Record<string, unknown>[];
}> {
  return requestJson('/shop/catalog', { method: 'GET' });
}

export async function fetchBalances(): Promise<{ vcard: number; tournamentCredits: number }> {
  return requestJson('/shop/balances', { method: 'GET', headers: authHeaders() });
}

export async function purchaseShopItem(
  itemId: string,
  idempotencyKey?: string,
): Promise<{
  duplicate: boolean;
  refundVCard: number;
  quantityAfter: number;
  vcardAfter: number;
}> {
  return postJson('/shop/purchase', { itemId, idempotencyKey }, true);
}

export async function openTournamentCrate(
  crateId: 'crate_bronze_100' | 'crate_silver_500' | 'crate_ssl_1000',
): Promise<{
  crateId: string;
  droppedItem: { id: string; name: string; rarity: string };
  duplicate: boolean;
  refundVCard: number;
  vcardAfter: number;
}> {
  return postJson('/shop/crates/open', { crateId }, true);
}

export async function fetchInventory(): Promise<{
  items: readonly { item_id: string; category: string; quantity: number }[];
  loadout: { avatar: string; frame: string; cardStyle: string; title: string };
}> {
  return requestJson('/inventory', { method: 'GET', headers: authHeaders() });
}

export async function equipInventoryItem(
  slot: 'avatar' | 'frame' | 'card_back' | 'title',
  itemId: string,
): Promise<{ loadout: { avatar: string; frame: string; cardStyle: string; title: string } }> {
  return postJson('/inventory/equip', { slot, itemId }, true);
}

export async function fetchBattleCard(): Promise<{
  state: { tier: 'free' | 'base' | 'bundle20'; level: number; xp: number; claimedLevels: string[] };
}> {
  return requestJson('/battle-card', { method: 'GET', headers: authHeaders() });
}

export async function buyBattleCard(plan: 'base' | 'bundle20'): Promise<unknown> {
  return postJson('/battle-card/buy', { plan }, true);
}

export async function unlockAllBattleCard(): Promise<unknown> {
  return postJson('/battle-card/unlock-all', {}, true);
}

export async function claimBattleCardTier(level: number, track: 'free' | 'premium'): Promise<unknown> {
  return postJson('/battle-card/claim', { level, track }, true);
}

export async function fetchChallenges(): Promise<{
  challenges: readonly {
    definition: {
      id: string;
      period: 'daily' | 'weekly';
      title: string;
      description: string;
      target: number;
      rewardXp: number;
      rewardVCard: number;
    };
    progress: number;
    claimed: boolean;
  }[];
}> {
  return requestJson('/challenges', { method: 'GET', headers: authHeaders() });
}

export async function claimChallenge(challengeId: string): Promise<{ vcardAfter: number }> {
  return postJson('/challenges/claim', { challengeId }, true);
}

export async function fetchTopLeaderboard(limit = 100): Promise<{
  entries: readonly { rank: number; playerId: string; username: string; mmr: number; rankTier: string }[];
}> {
  return requestJson(`/leaderboard/top?limit=${limit}`, { method: 'GET' });
}

export async function fetchCareerSummary(): Promise<{
  modeStats: readonly { mode: string; matchesPlayed: number; wins: number; winRate: number; bestStreak: number }[];
  recentMatches: readonly { matchId: string; mode: string; variant: string; isRanked: boolean; placement: number; mmrDelta: number; vcardEarned: number }[];
}> {
  return requestJson('/leaderboard/career', { method: 'GET', headers: authHeaders() });
}

export async function fetchTournaments(): Promise<{
  tournaments: readonly Record<string, unknown>[];
  presets: readonly Record<string, unknown>[];
}> {
  return requestJson('/tournaments', { method: 'GET' });
}

export async function createTournament(kind: string): Promise<{ tournament: Record<string, unknown> }> {
  return postJson('/tournaments', { kind }, true);
}

export async function joinTournament(id: string): Promise<{ participantCount: number; bracket: unknown[] }> {
  return postJson(`/tournaments/${encodeURIComponent(id)}/join`, {}, true);
}

export async function syncOfflineBatch(events: readonly unknown[]): Promise<{ applied: number }> {
  return postJson('/sync/offline-batch', { events }, true);
}
