// ============================================================
// UNO ULTRA — Player contracts
// ============================================================

import type { RankTier } from '../constants/ranks.js';
import type { UnoCard } from './card.js';
import type { PlaylistRankEntry } from './rank.js';

/** Profilo persistente (server-side). */
export interface PlayerProfile {
  id: string;
  username: string;
  rankTier: RankTier;
  mmr: number;
  vcard: number;
  battleCardLevel: number;
  createdAt: string; // ISO 8601
  playlistRanks?: Readonly<Record<string, PlaylistRankEntry>>;
}

/** Giocatore all'interno di una stanza. */
export interface RoomPlayer {
  id: string;
  username: string;
  /** Carte visibili SOLO al proprietario (server filtra). */
  hand?: readonly UnoCard[];
  /** Contatore pubblico carte residue. */
  cardCount: number;
  isBot: boolean;
  isConnected: boolean;
  aiProfile?: AIProfile;
}

/** Profili decisionali AI. */
export const AI_PROFILES = ['AGGR', 'CONS', 'STRAT'] as const;
export type AIProfile = (typeof AI_PROFILES)[number];

/** Livelli di difficolta bot. */
export const AI_DIFFICULTIES = ['easy', 'normal', 'hard', 'ultra'] as const;
export type AIDifficulty = (typeof AI_DIFFICULTIES)[number];

/** Range di riflessione in ms per difficolta. */
export const AI_THINK_MS: Record<AIDifficulty, readonly [number, number]> = {
  easy: [400, 800],
  normal: [700, 1300],
  hard: [900, 1700],
  ultra: [1100, 2100],
};