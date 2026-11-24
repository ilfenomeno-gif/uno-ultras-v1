// ============================================================
// UNO ULTRA — Pure rule predicates (canPlay, stacking, wild4 strict)
// ============================================================

import type { UnoColor } from "../../constants/cards.js";
import type { UnoRules } from "../../constants/rules.js";
import type { UnoCard } from "../../types/card.js";

export function isWildCard(card: UnoCard): boolean {
  return card.color === "wild";
}

export function isWildDraw4(card: UnoCard): boolean {
  return card.kind === "wild_draw4";
}

export function isDraw2(card: UnoCard): boolean {
  return card.kind === "draw2";
}

export function isDrawCard(card: UnoCard): boolean {
  return isDraw2(card) || isWildDraw4(card);
}

/**
 * Determina se `card` e giocabile sullo stato attuale del tavolo.
 *
 * @param hand        mano del giocatore (necessaria per wild4 strict)
 * @param pendingDraw accumulo stacking corrente (+2/+4 concatenati)
 */
export function canPlay(
  card: UnoCard,
  topCard: UnoCard | null,
  activeColor: UnoColor | null,
  hand: readonly UnoCard[],
  pendingDraw: number,
  rules: UnoRules,
): boolean {
  // Fase stacking: solo draw card dello stesso tipo entro stackingCap
  if (pendingDraw > 0) {
    if (pendingDraw >= rules.stackingCap) return false;
    if (isDraw2(card)) return rules.draw2Stacking;
    if (isWildDraw4(card)) return rules.draw4Stacking;
    return false;
  }

  // Wild semplice: sempre giocabile
  if (card.kind === "wild") return true;

  // Wild Draw4: se strict, solo senza colore attivo in mano
  if (isWildDraw4(card)) {
    if (!rules.wildDraw4Strict) return true;
    if (!activeColor) return true;
    return !hand.some((c) => c.color === activeColor);
  }

  if (!topCard) return true;

  // Top e wild: matcha solo sul colore scelto
  if (isWildCard(topCard)) {
    return activeColor !== null && card.color === activeColor;
  }

  // Stesso colore
  if (card.color === topCard.color) return true;

  // Stesso valore numerico
  if (topCard.kind === "number" && card.kind === "number" && card.value === topCard.value) {
    return true;
  }

  // Stessa kind non numerica (skip/reverse/draw2)
  if (card.kind !== "number" && card.kind === topCard.kind) return true;

  return false;
}

export function getPlayableCards(
  hand: readonly UnoCard[],
  topCard: UnoCard | null,
  activeColor: UnoColor | null,
  pendingDraw: number,
  rules: UnoRules,
): UnoCard[] {
  return hand.filter((c) => canPlay(c, topCard, activeColor, hand, pendingDraw, rules));
}

/** true se il giocatore e costretto a pescare l'accumulo stacking. */
export function mustDrawPending(
  hand: readonly UnoCard[],
  topCard: UnoCard | null,
  activeColor: UnoColor | null,
  pendingDraw: number,
  rules: UnoRules,
): boolean {
  if (pendingDraw === 0) return false;
  return getPlayableCards(hand, topCard, activeColor, pendingDraw, rules).length === 0;
}