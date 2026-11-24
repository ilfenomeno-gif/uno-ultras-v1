// ============================================================
// UNO ULTRA — Unit tests: Pure UNO Rules
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_UNO_RULES,
  canPlay,
  getPlayableCards,
  isDraw2,
  isDrawCard,
  isWildCard,
  isWildDraw4,
  mustDrawPending,
  type UnoCard,
  type UnoRules,
} from '../../../src/index.js';

const card = (
  id: string,
  color: UnoCard['color'],
  kind: UnoCard['kind'],
  value?: UnoCard['value']
): UnoCard => (value !== undefined ? { id, color, kind, value } : { id, color, kind });

describe('UNO Rules & Predicates', () => {
  it('identifica correttamente carte wild, draw2, wild_draw4 e draw generiche', () => {
    const w = card('w1', 'wild', 'wild');
    const w4 = card('w4', 'wild', 'wild_draw4');
    const d2 = card('d2', 'red', 'draw2');
    const num = card('r5', 'red', 'number', 5);

    expect(isWildCard(w)).toBe(true);
    expect(isWildCard(w4)).toBe(true);
    expect(isWildCard(num)).toBe(false);
    expect(isWildDraw4(w4)).toBe(true);
    expect(isWildDraw4(w)).toBe(false);
    expect(isDraw2(d2)).toBe(true);
    expect(isDrawCard(d2)).toBe(true);
    expect(isDrawCard(w4)).toBe(true);
    expect(isDrawCard(num)).toBe(false);
  });

  it('consente qualsiasi carta colorata se topCard e null', () => {
    const c = card('b3', 'blue', 'number', 3);
    expect(canPlay(c, null, null, [c], 0, DEFAULT_UNO_RULES)).toBe(true);
  });

  it('consente match per stesso colore', () => {
    const top = card('r1', 'red', 'number', 1);
    const play = card('r9', 'red', 'number', 9);
    expect(canPlay(play, top, 'red', [play], 0, DEFAULT_UNO_RULES)).toBe(true);
  });

  it('consente match per stesso valore numerico di colore diverso', () => {
    const top = card('r7', 'red', 'number', 7);
    const play = card('g7', 'green', 'number', 7);
    expect(canPlay(play, top, 'red', [play], 0, DEFAULT_UNO_RULES)).toBe(true);
  });

  it('consente match per stessa kind speciale (skip/reverse/draw2) su colore diverso', () => {
    const topSkip = card('r-skip', 'red', 'skip');
    const playSkip = card('b-skip', 'blue', 'skip');
    expect(canPlay(playSkip, topSkip, 'red', [playSkip], 0, DEFAULT_UNO_RULES)).toBe(true);
  });

  it('rifiuta carta numerica o speciale incompatibile', () => {
    const top = card('r7', 'red', 'number', 7);
    const play = card('b2', 'blue', 'number', 2);
    expect(canPlay(play, top, 'red', [play], 0, DEFAULT_UNO_RULES)).toBe(false);
  });

  it('consente sempre wild semplice', () => {
    const top = card('g4', 'green', 'number', 4);
    const w = card('w', 'wild', 'wild');
    expect(canPlay(w, top, 'green', [w], 0, DEFAULT_UNO_RULES)).toBe(true);
  });

  it('quando topCard e wild, matcha solo activeColor scelto', () => {
    const top = card('w', 'wild', 'wild');
    const ok = card('y3', 'yellow', 'number', 3);
    const bad = card('r3', 'red', 'number', 3);
    expect(canPlay(ok, top, 'yellow', [ok, bad], 0, DEFAULT_UNO_RULES)).toBe(true);
    expect(canPlay(bad, top, 'yellow', [ok, bad], 0, DEFAULT_UNO_RULES)).toBe(false);
    expect(canPlay(ok, top, null, [ok], 0, DEFAULT_UNO_RULES)).toBe(false);
  });

  it('wild_draw4 strict rifiuta se in mano esiste activeColor', () => {
    const top = card('r4', 'red', 'number', 4);
    const w4 = card('w4', 'wild', 'wild_draw4');
    const redInHand = card('r1', 'red', 'number', 1);
    expect(canPlay(w4, top, 'red', [w4, redInHand], 0, DEFAULT_UNO_RULES)).toBe(false);
  });

  it('wild_draw4 strict consente se activeColor manca in mano o activeColor e null', () => {
    const top = card('r4', 'red', 'number', 4);
    const w4 = card('w4', 'wild', 'wild_draw4');
    const blueInHand = card('b1', 'blue', 'number', 1);
    expect(canPlay(w4, top, 'red', [w4, blueInHand], 0, DEFAULT_UNO_RULES)).toBe(true);
    expect(canPlay(w4, top, null, [w4, blueInHand], 0, DEFAULT_UNO_RULES)).toBe(true);
  });

  it('wild_draw4 non-strict consente sempre il bluff', () => {
    const rules: UnoRules = { ...DEFAULT_UNO_RULES, wildDraw4Strict: false };
    const top = card('r4', 'red', 'number', 4);
    const w4 = card('w4', 'wild', 'wild_draw4');
    const redInHand = card('r1', 'red', 'number', 1);
    expect(canPlay(w4, top, 'red', [w4, redInHand], 0, rules)).toBe(true);
  });

  it('durante pendingDraw > 0 accetta draw2/wild_draw4 se stacking attivo e rifiuta non-draw', () => {
    const top = card('r-d2', 'red', 'draw2');
    const d2 = card('b-d2', 'blue', 'draw2');
    const w4 = card('w4', 'wild', 'wild_draw4');
    const r5 = card('r5', 'red', 'number', 5);
    const hand = [d2, w4, r5];

    expect(canPlay(d2, top, 'red', hand, 2, DEFAULT_UNO_RULES)).toBe(true);
    expect(canPlay(w4, top, 'red', hand, 2, DEFAULT_UNO_RULES)).toBe(true);
    expect(canPlay(r5, top, 'red', hand, 2, DEFAULT_UNO_RULES)).toBe(false);
  });

  it('rispetta flag draw2Stacking=false e draw4Stacking=false', () => {
    const rules: UnoRules = { ...DEFAULT_UNO_RULES, draw2Stacking: false, draw4Stacking: false };
    const top = card('r-d2', 'red', 'draw2');
    const d2 = card('b-d2', 'blue', 'draw2');
    const w4 = card('w4', 'wild', 'wild_draw4');

    expect(canPlay(d2, top, 'red', [d2], 2, rules)).toBe(false);
    expect(canPlay(w4, top, 'red', [w4], 2, rules)).toBe(false);
  });

  it('blocca ulteriore stacking quando pendingDraw raggiunge stackingCap', () => {
    const top = card('r-d2', 'red', 'draw2');
    const d2 = card('b-d2', 'blue', 'draw2');
    const w4 = card('w4', 'wild', 'wild_draw4');

    expect(canPlay(d2, top, 'red', [d2], DEFAULT_UNO_RULES.stackingCap, DEFAULT_UNO_RULES)).toBe(
      false
    );
    expect(canPlay(w4, top, 'red', [w4], DEFAULT_UNO_RULES.stackingCap, DEFAULT_UNO_RULES)).toBe(
      false
    );
  });

  it('getPlayableCards filtra correttamente le carte giocabili', () => {
    const top = card('r7', 'red', 'number', 7);
    const c1 = card('r2', 'red', 'number', 2);
    const c2 = card('g7', 'green', 'number', 7);
    const c3 = card('b9', 'blue', 'number', 9);
    const playable = getPlayableCards([c1, c2, c3], top, 'red', 0, DEFAULT_UNO_RULES);
    expect(playable.map((c) => c.id)).toEqual(['r2', 'g7']);
  });

  it('mustDrawPending ritorna true solo se pendingDraw > 0 e nessuna risposta legale', () => {
    const top = card('r-d2', 'red', 'draw2');
    const r5 = card('r5', 'red', 'number', 5);
    const bD2 = card('b-d2', 'blue', 'draw2');

    expect(mustDrawPending([r5], top, 'red', 0, DEFAULT_UNO_RULES)).toBe(false);
    expect(mustDrawPending([r5], top, 'red', 2, DEFAULT_UNO_RULES)).toBe(true);
    expect(mustDrawPending([r5, bD2], top, 'red', 2, DEFAULT_UNO_RULES)).toBe(false);
  });
});
