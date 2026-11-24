// ============================================================
// UNO ULTRA — 108-card deck creation, deterministic shuffle, drawing
// ============================================================

import {
  UNO_DECK_SIZE,
  UNO_COLORS,
  type UnoNumericValue,
} from "../../constants/cards.js";
import type { UnoCard } from "../../types/card.js";

/**
 * Crea il mazzo UNO standard da 108 carte.
 *   Per colore: 1x0, 2x1-9, 2xskip, 2xreverse, 2xdraw2  -> 25 x 4 = 100
 *   + 4xwild, 4xwild_draw4                                -> 8
 *   Totale: 108
 */
export function createUnoDeck(): UnoCard[] {
  const cards: UnoCard[] = [];

  for (const color of UNO_COLORS) {
    cards.push({ id: `${color}-0-0`, color, kind: "number", value: 0 as UnoNumericValue });
    for (let v = 1; v <= 9; v++) {
      const val = v as UnoNumericValue;
      cards.push({ id: `${color}-${v}-0`, color, kind: "number", value: val });
      cards.push({ id: `${color}-${v}-1`, color, kind: "number", value: val });
    }
    for (const kind of ["skip", "reverse", "draw2"] as const) {
      cards.push({ id: `${color}-${kind}-0`, color, kind });
      cards.push({ id: `${color}-${kind}-1`, color, kind });
    }
  }

  for (let i = 0; i < 4; i++) {
    cards.push({ id: `wild-wild-${i}`, color: "wild", kind: "wild" });
    cards.push({ id: `wild-wild_draw4-${i}`, color: "wild", kind: "wild_draw4" });
  }

  if (cards.length !== UNO_DECK_SIZE) {
    throw new Error(`Deck size mismatch: expected ${UNO_DECK_SIZE}, got ${cards.length}`);
  }
  return cards;
}

/** PRNG deterministico (mulberry32): stessa seed => stesso shuffle. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates deterministico. Riproducibile per replay/audit. */
export function shuffleDeck(deck: readonly UnoCard[], seed: number): UnoCard[] {
  const rng = mulberry32(seed);
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = result[i]!;
    const b = result[j]!;
    result[i] = b;
    result[j] = a;
  }
  return result;
}

/**
 * Pesca `count` carte. Se il mazzo si esaurisce, rimescola gli scarti
 * (mantenendo la carta in cima) con seed incrementale.
 */
export function drawCards(
  deck: readonly UnoCard[],
  discardPile: readonly UnoCard[],
  count: number,
  seed: number,
): { drawn: UnoCard[]; newDeck: UnoCard[]; newDiscard: UnoCard[] } {
  const drawn: UnoCard[] = [];
  let currentDeck = [...deck];
  let currentDiscard = [...discardPile];

  for (let i = 0; i < count; i++) {
    if (currentDeck.length === 0) {
      if (currentDiscard.length <= 1) {
        throw new Error("Cannot draw: deck and discard exhausted");
      }
      const [top, ...rest] = currentDiscard;
      currentDeck = shuffleDeck(rest, seed + i);
      currentDiscard = [top!];
    }
    drawn.push(currentDeck.pop()!);
  }

  return { drawn, newDeck: currentDeck, newDiscard: currentDiscard };
}