// ============================================================
// UNO ULTRA — REST API client (auth + social endpoints)
// ============================================================

import type {
  GameMode,
  LoginPayload,
  MatchRewardReceipt,
  PlayerProfile,
  PlaylistRankEntry,
  RegisterPayload,
} from '@uno/shared';
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
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new Error('Server non raggiungibile al momento. Verifica la connessione e riprova.');
  }
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) {
        throw new Error(`Errore del server (HTTP ${res.status}). Riprova tra qualche secondo.`);
      }
      throw new Error('Risposta del server non valida.');
    }
  }

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
  currency?: 'tournament_credits' | 'vcard',
): Promise<{
  crateId: string;
  droppedItem: { id: string; name: string; rarity: string };
  duplicate: boolean;
  refundVCard: number;
  vcardAfter: number;
  tournamentCreditsAfter?: number;
}> {
  return postJson(
    '/shop/crates/open',
    { crateId, ...(currency !== undefined ? { currency } : {}) },
    true,
  );
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
      period: 'daily' | 'weekly' | 'seasonal';
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

export interface TopLeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  mmr: number;
  rankTier: string;
  wins?: number;
  winRate?: number;
  title?: string;
  titleColor?: string;
  isBot?: boolean;
}

export async function fetchTopLeaderboard(
  limit = 100,
  opts?: { mode?: string; players?: 2 | 3 | 4 },
): Promise<{
  mode?: string;
  playerCount?: number;
  entries: readonly TopLeaderboardEntry[];
}> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (opts?.mode) qs.set('mode', opts.mode);
  if (opts?.players) qs.set('players', String(opts.players));
  return requestJson(`/leaderboard/top?${qs.toString()}`, { method: 'GET' });
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

export async function enrollTournament(kind: string): Promise<{
  tournament: Record<string, unknown>;
  participantCount: number;
  bracket: unknown[];
}> {
  return postJson('/tournaments/enroll', { kind }, true);
}

export async function syncOfflineBatch(events: readonly unknown[]): Promise<{ applied: number }> {
  return postJson('/sync/offline-batch', { events }, true);
}

export async function fetchMatchReplay(matchId: string): Promise<{
  matchId: string;
  seed: number;
  events: readonly Record<string, unknown>[];
}> {
  return requestJson(`/leaderboard/replays/${encodeURIComponent(matchId)}`, {
    method: 'GET',
    headers: authHeaders(),
  });
}

export async function enqueueMatchmaking(payload: {
  mode: string;
  ranked: boolean;
  targetPlayers: number;
  partyMemberIds?: readonly string[];
  partyMemberMmrs?: readonly number[];
  isTournament?: boolean;
}): Promise<{
  ticket: { ticketId: string };
  effectivePartyMmr?: number;
  matched: Record<string, unknown> | null;
}> {
  return postJson('/matchmaking/enqueue', payload, true);
}

export async function fetchMatchmakingStatus(ticketId: string): Promise<Record<string, unknown>> {
  return requestJson(`/matchmaking/status/${encodeURIComponent(ticketId)}`, {
    method: 'GET',
    headers: authHeaders(),
  });
}

export async function cancelMatchmaking(mode: string, ranked: boolean): Promise<{ cancelled: boolean }> {
  return requestJson(
    `/matchmaking/cancel?mode=${encodeURIComponent(mode)}&ranked=${String(ranked)}`,
    { method: 'DELETE', headers: authHeaders() },
  );
}

export async function fetchVCardPacks(): Promise<{
  packs: readonly Record<string, unknown>[];
  devGrantsEnabled: boolean;
  paymentsActive: boolean;
}> {
  return requestJson('/shop/vcard-packs', { method: 'GET' });
}

export async function grantDevVCardPack(
  packId: 'vcard_500' | 'vcard_1100' | 'vcard_3200' | 'vcard_8000',
  idempotencyKey?: string,
): Promise<{
  vcardAdded: number;
  vcardAfter: number;
  deduplicated: boolean;
  source: 'dev_grant' | 'payment_webhook';
}> {
  return postJson(
    '/shop/vcard-packs/grant',
    { packId, ...(idempotencyKey !== undefined ? { idempotencyKey } : {}) },
    true,
  );
}

export async function settleMiniGameMatch(payload: {
  matchId: string;
  mode: GameMode;
  variant?: string;
  playerCount?: 2 | 3 | 4;
  isRanked: boolean;
  won: boolean;
  score: number;
  opponentScore: number;
  turnCount: number;
  durationSec: number;
  cardsPlayed?: number;
}): Promise<{ receipt: MatchRewardReceipt }> {
  return postJson('/progression/settle-match', payload, true);
}

export async function fetchProgressionSnapshot(): Promise<{
  playerId: string;
  username: string;
  mmr: number;
  rankTier: string;
  playlistRanks?: Readonly<Record<string, PlaylistRankEntry>>;
  activeBan?: {
    expiresAt: string;
    remainingSeconds: number;
    offenseCount: number;
    reason: string;
  } | null;
  vcardBalance: number;
  tournamentCredits: number;
  battleCard: { tier: string; level: number; xp: number };
  challenges: { total: number; active: number; claimable: number };
}> {
  return requestJson('/progression/snapshot', {
    method: 'GET',
    headers: authHeaders(),
  });
}
