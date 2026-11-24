// ============================================================
// UNO ULTRA — Match state (public view, no hidden data)
// ============================================================

import type { UnoColor } from '../constants/cards.js';
import type { UnoCard } from './card.js';
import type { GameMode } from '../constants/game-modes.js';

export type MatchPhase = 'lobby' | 'dealing' | 'playing' | 'finished';

export interface MatchState {
  readonly matchId: string;
  readonly mode: GameMode;
  readonly phase: MatchPhase;

  /** Ordine dei turni (playerId). */
  readonly turnOrder: readonly string[];
  /** Indice del giocatore di turno. */
  readonly currentTurnIndex: number;
  /** Direzione corrente: 1 = orario, -1 = antiorario. */
  readonly direction: 1 | -1;

  /** Carta in cima alla pila di scarto. */
  readonly topCard: UnoCard | null;
  /** Colore attivo (dopo wild). */
  readonly activeColor: UnoColor | null;

  /** Accumulo stacking corrente (+2/+4 concatenati). */
  readonly pendingDrawCount: number;

  /** Conteggio pubblico carte per giocatore. */
  readonly handCounts: Readonly<Record<string, number>>;
  /** Carte SOLO del giocatore locale (client-specific). */
  readonly myHand?: readonly UnoCard[];

  /** Vincitore (null se non finito). */
  readonly winnerId: string | null;
}

/** Azione inviata dal client al server. */
export type MatchAction =
  | { type: 'play_card'; cardId: string; chosenColor?: UnoColor }
  | { type: 'draw_card' }
  | { type: 'call_uno' }
  | { type: 'challenge_wild4' };