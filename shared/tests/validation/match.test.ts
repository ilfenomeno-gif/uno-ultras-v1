// ============================================================
// UNO ULTRA — Unit tests: Zod MatchAction Validators
// ============================================================

import { describe, expect, it } from 'vitest';
import { MatchActionSchema, parseMatchAction } from '../../src/index.js';

describe('MatchAction Validators', () => {
  it('valida play_card senza chosenColor omettendo la proprieta (exactOptionalPropertyTypes)', () => {
    const parsed = parseMatchAction({ type: 'play_card', cardId: 'red-7-0' });
    expect(parsed).toEqual({ type: 'play_card', cardId: 'red-7-0' });
    expect('chosenColor' in parsed).toBe(false);
  });

  it('valida play_card con chosenColor valido', () => {
    const parsed = parseMatchAction({
      type: 'play_card',
      cardId: 'wild-wild-0',
      chosenColor: 'blue',
    });
    expect(parsed).toEqual({
      type: 'play_card',
      cardId: 'wild-wild-0',
      chosenColor: 'blue',
    });
  });

  it('rifiuta play_card con cardId vuoto o chosenColor non valido', () => {
    expect(MatchActionSchema.safeParse({ type: 'play_card', cardId: '' }).success).toBe(false);
    expect(
      MatchActionSchema.safeParse({
        type: 'play_card',
        cardId: 'w1',
        chosenColor: 'purple',
      }).success
    ).toBe(false);
  });

  it('valida draw_card, call_uno e challenge_wild4', () => {
    expect(parseMatchAction({ type: 'draw_card' })).toEqual({ type: 'draw_card' });
    expect(parseMatchAction({ type: 'call_uno' })).toEqual({ type: 'call_uno' });
    expect(parseMatchAction({ type: 'challenge_wild4' })).toEqual({ type: 'challenge_wild4' });
  });

  it('rifiuta azioni sconosciute o payload malformati', () => {
    expect(() => parseMatchAction({ type: 'cheat_win' })).toThrow();
    expect(() => parseMatchAction(null)).toThrow();
  });
});
