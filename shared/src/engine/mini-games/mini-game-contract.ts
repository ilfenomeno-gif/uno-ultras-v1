// ============================================================
// UNO ULTRA — Shared deterministic contract for all 7 mini-games
// ============================================================

import type { GameMode } from '../../constants/game-modes.js';

export interface MiniGameStateBase {
  readonly matchId: string;
  readonly mode: GameMode;
  readonly seed: number;
  readonly playerOrder: readonly string[];
  readonly currentTurnIndex: number;
  readonly round: number;
  readonly phase: 'playing' | 'finished';
  readonly winnerId: string | null;
  readonly scores: Readonly<Record<string, number>>;
}

export interface MiniGameEngine<
  TState extends MiniGameStateBase,
  TAction extends { readonly type: string },
> {
  readonly mode: GameMode;
  readonly label: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  createInitialState(matchId: string, playerIds: readonly string[], seed?: number): TState;
  getLegalActions(state: TState, playerId: string): readonly TAction[];
  applyAction(state: TState, playerId: string, action: TAction): TState;
  /** Proiezione pubblica filtrata per singolo viewer (nessuna mano segreta esposta). */
  getPublicView(state: TState, viewerId: string): Record<string, unknown>;
}

/** PRNG deterministico Mulberry32 per test ripetibili e room autoritative. */
export function createSeededRng(seed: number): () => number {
  let state = (seed >>> 0) || 0x12345678;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  const nextRand = createSeededRng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

export interface StandardCard {
  readonly id: string;
  readonly suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  readonly rank: number; // 1 (Asso) .. 13 (K)
}

export function createDeck52(seed: number): StandardCard[] {
  const suits: readonly StandardCard['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: StandardCard[] = [];
  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ id: `${suit}_${rank}`, suit, rank });
    }
  }
  return shuffleWithSeed(deck, seed);
}

export interface ItalianCard {
  readonly id: string;
  readonly suit: 'coppe' | 'denari' | 'spade' | 'bastoni';
  readonly rank: number; // 1..10
}

export function createDeck40(seed: number): ItalianCard[] {
  const suits: readonly ItalianCard['suit'][] = ['coppe', 'denari', 'spade', 'bastoni'];
  const deck: ItalianCard[] = [];
  for (const suit of suits) {
    for (let rank = 1; rank <= 10; rank++) {
      deck.push({ id: `${suit}_${rank}`, suit, rank });
    }
  }
  return shuffleWithSeed(deck, seed);
}
