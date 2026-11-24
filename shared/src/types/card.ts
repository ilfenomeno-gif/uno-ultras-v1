// ============================================================
// UNO ULTRA — Card type contracts
// ============================================================

import type { UnoColor, UnoCardKind, UnoNumericValue } from '../constants/cards.js';

/** Carta fisica UNO (immutable). */
export interface UnoCard {
  /** ID univoco globale (es. "red-7-a"). */
  readonly id: string;
  readonly color: UnoColor | 'wild';
  readonly kind: UnoCardKind;
  /** Presente solo per kind="number". */
  readonly value?: UnoNumericValue;
}

/** Stato di una pila di scarto. */
export interface DiscardPile {
  readonly top: UnoCard | null;
  /** Colore attivo corrente (puo differire da top.color se top e wild). */
  readonly activeColor: UnoColor | null;
}

/** Mano di un giocatore (rappresentazione client-side). */
export interface HandView {
  readonly playerId: string;
  readonly cards: readonly UnoCard[];
  readonly cardCount: number;
}