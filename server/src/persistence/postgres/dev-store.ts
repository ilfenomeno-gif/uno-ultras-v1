// ============================================================
// UNO ULTRA Server — Dev-Only Offline Persistence Store
// (Used strictly when NODE_ENV !== 'production' & Postgres/Redis are offline)
// ============================================================

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { env } from '../../config/env.js';

export type DevBattleCardTier = 'free' | 'base' | 'bundle20';

export interface DevInventoryRow {
  item_id: string;
  category: string;
  quantity: number;
  acquired_at: string;
  updated_at: string;
}

export interface DevLoadout {
  avatar: string;
  frame: string;
  cardStyle: string;
  title: string;
}

export interface DevBattleCardState {
  tier: DevBattleCardTier;
  level: number;
  xp: number;
  claimedLevels: string[];
}

export interface DevChallengeProgress {
  progress: number;
  claimed: boolean;
  resetsAt: string;
}

export interface DevMatchRecord {
  id: string;
  mode: string;
  variant: string;
  isRanked: boolean;
  winnerId?: string;
  winnerLabel: string;
  turnCount: number;
  durationSec: number;
  finishedAt: string;
  participants: Array<{
    playerId?: string;
    botName?: string;
    isBot: boolean;
    placement: number;
    score: number;
    mmrBefore: number;
    mmrAfter: number;
    mmrDelta: number;
    vcardEarned: number;
    xpEarned: number;
  }>;
  replaySeed?: number;
  replayEvents?: Array<Record<string, unknown>>;
}

export interface DevFriendshipRecord {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface DevBlockRecord {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface DevNotificationRecord {
  id: string;
  recipient_id: string;
  type: 'friend_request' | 'friend_accepted' | 'party_invite' | 'system';
  payload: Record<string, unknown>;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface DevTransactionRecord {
  id: string;
  player_id: string;
  tx_type: string;
  currency: 'vcard' | 'tournament_credits';
  amount_delta: number;
  balance_after: number;
  reference_id: string | null;
  idempotency_key: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DevStateSnapshot {
  tournamentCredits: Record<string, number>;
  loadouts: Record<string, DevLoadout>;
  inventory: Record<string, DevInventoryRow[]>;
  battleCards: Record<string, DevBattleCardState>;
  challenges: Record<string, Record<string, DevChallengeProgress>>;
  matches: DevMatchRecord[];
  friendships: DevFriendshipRecord[];
  blocks: DevBlockRecord[];
  notifications: DevNotificationRecord[];
  transactions: DevTransactionRecord[];
  idempotencyBalances: Record<string, number>;
  leaderboards: Record<string, Record<string, { username: string; mmr: number }>>;
}

const DEV_STATE_FILE = path.join(os.tmpdir(), 'uno-ultra-dev-state.json');

const EMPTY_STATE = (): DevStateSnapshot => ({
  tournamentCredits: {},
  loadouts: {},
  inventory: {},
  battleCards: {},
  challenges: {},
  matches: [],
  friendships: [],
  blocks: [],
  notifications: [],
  transactions: [],
  idempotencyBalances: {},
  leaderboards: {},
});

export function isDbUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const rec = err as { code?: unknown; errors?: unknown[] };
  if (
    typeof rec.code === 'string' &&
    /^(ECONNREFUSED|ENOTFOUND|ETIMEDOUT|57P01|0800[1-6])$/.test(rec.code)
  ) {
    return true;
  }
  if (Array.isArray(rec.errors)) {
    return rec.errors.some((inner) => isDbUnavailableError(inner));
  }
  return false;
}

export function canUseDevFallback(err: unknown): boolean {
  return env.NODE_ENV !== 'production' && isDbUnavailableError(err);
}

export function readDevState(): DevStateSnapshot {
  const base = EMPTY_STATE();
  try {
    if (!fs.existsSync(DEV_STATE_FILE)) return base;
    const raw = JSON.parse(fs.readFileSync(DEV_STATE_FILE, 'utf8')) as Partial<DevStateSnapshot>;
    return {
      tournamentCredits: raw.tournamentCredits ?? {},
      loadouts: raw.loadouts ?? {},
      inventory: raw.inventory ?? {},
      battleCards: raw.battleCards ?? {},
      challenges: raw.challenges ?? {},
      matches: Array.isArray(raw.matches) ? raw.matches : [],
      friendships: Array.isArray(raw.friendships) ? raw.friendships : [],
      blocks: Array.isArray(raw.blocks) ? raw.blocks : [],
      notifications: Array.isArray(raw.notifications) ? raw.notifications : [],
      transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
      idempotencyBalances: raw.idempotencyBalances ?? {},
      leaderboards: raw.leaderboards ?? {},
    };
  } catch {
    return base;
  }
}

export function updateDevState<T>(mutator: (state: DevStateSnapshot) => T): T {
  const state = readDevState();
  const result = mutator(state);
  fs.writeFileSync(DEV_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  return result;
}
