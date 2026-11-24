// ============================================================
// UNO ULTRA — Unit tests: Deck (108 cards, deterministic shuffle, draw)
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  UNO_COLORS,
  UNO_DECK_SIZE,
  createUnoDeck,
  drawCards,
  shuffleDeck,
} from '../../../src/index.js';

describe('UNO Deck', () => {
  it('crea esattamente 108 carte', () => {
    const deck = createUnoDeck();
    expect(deck).toHaveLength(UNO_DECK_SIZE);
    expect(deck).toHaveLength(108);
  });

  it('rispetta la distribuzione ufficiale per ciascuno dei 4 colori (25 x 4 = 100)', () => {
    const deck = createUnoDeck();
    for (const color of UNO_COLORS) {
      const ofColor = deck.filter((c) => c.color === color);
      expect(ofColor).toHaveLength(25);

      const zeros = ofColor.filter((c) => c.kind === 'number' && c.value === 0);
      expect(zeros).toHaveLength(1);

      for (let v = 1; v <= 9; v++) {
        expect(ofColor.filter((c) => c.kind === 'number' && c.value === v)).toHaveLength(2);
      }

      expect(ofColor.filter((c) => c.kind === 'skip')).toHaveLength(2);
      expect(ofColor.filter((c) => c.kind === 'reverse')).toHaveLength(2);
      expect(ofColor.filter((c) => c.kind === 'draw2')).toHaveLength(2);
    }
  });

  it('include 4 wild e 4 wild_draw4 con ID tutti univoci', () => {
    const deck = createUnoDeck();
    expect(deck.filter((c) => c.kind === 'wild')).toHaveLength(4);
    expect(deck.filter((c) => c.kind === 'wild_draw4')).toHaveLength(4);
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(108);
  });

  it('shuffleDeck e deterministico a parita di seed', () => {
    const base = createUnoDeck();
    const s1 = shuffleDeck(base, 424242);
    const s2 = shuffleDeck(base, 424242);
    expect(s1.map((c) => c.id)).toEqual(s2.map((c) => c.id));
  });

  it('shuffleDeck produce ordini diversi con seed differenti e non muta l input', () => {
    const base = createUnoDeck();
    const snapshot = base.map((c) => c.id);
    const s1 = shuffleDeck(base, 1);
    const s2 = shuffleDeck(base, 99999);

    expect(base.map((c) => c.id)).toEqual(snapshot);
    expect(s1.map((c) => c.id)).not.toEqual(s2.map((c) => c.id));
    expect(s1).toHaveLength(108);
  });

  it('drawCards pesca dalla cima (fine array) senza modificare gli array originali', () => {
    const deck = createUnoDeck();
    const originalLen = deck.length;
    const expectedTop = [deck[originalLen - 1]!, deck[originalLen - 2]!];

    const res = drawCards(deck, [], 2, 100);
    expect(res.drawn).toEqual(expectedTop);
    expect(res.newDeck).toHaveLength(106);
    expect(deck).toHaveLength(108);
  });

  it('drawCards rimescola gli scarti quando il mazzo si esaurisce preservando la topCard', () => {
    const base = createUnoDeck();
    const deck = base.slice(0, 1);
    const topDiscard = base[10]!;
    const discardPile = [topDiscard, base[11]!, base[12]!, base[13]!];

    const res = drawCards(deck, discardPile, 3, 777);
    expect(res.drawn).toHaveLength(3);
    expect(res.newDiscard).toEqual([topDiscard]);
    expect(res.newDeck).toHaveLength(1);
    expect(res.drawn.some((c) => c.id === topDiscard.id)).toBe(false);
  });

  it('drawCards lancia errore quando sia mazzo che scarti (<= 1) sono esauriti', () => {
    const base = createUnoDeck();
    expect(() => drawCards([], [base[0]!], 1, 1)).toThrow(
      'Cannot draw: deck and discard exhausted'
    );
    expect(() => drawCards([], [], 1, 1)).toThrow(
      'Cannot draw: deck and discard exhausted'
    );
  });
});
