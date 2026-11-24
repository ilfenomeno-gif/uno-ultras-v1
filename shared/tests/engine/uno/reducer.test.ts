// ============================================================
// UNO ULTRA — Unit tests: Engine Reducer & Lifecycle
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  createInitialState,
  startMatch,
} from '../../../src/index.js';

const PLAYERS = [
  { id: 'p1', username: 'Alice' },
  { id: 'p2', username: 'Bob' },
  { id: 'p3', username: 'Charlie', isBot: true, aiProfile: 'STRAT' as const },
];

describe('UNO Reducer & Lifecycle', () => {
  it('createInitialState inizializza mazzo da 108 carte, fase lobby e seed incrementato', () => {
    const state = createInitialState({ matchId: 'match-1', players: PLAYERS, seed: 500 });
    expect(state.phase).toBe('lobby');
    expect(state.deck).toHaveLength(108);
    expect(state.turnOrder).toEqual(['p1', 'p2', 'p3']);
    expect(state.seed).toBe(501);
    expect(state.players.get('p3')?.isBot).toBe(true);
    expect(state.players.get('p3')?.aiProfile).toBe('STRAT');
  });

  it('createInitialState applica regole custom parziali', () => {
    const state = createInitialState({
      matchId: 'match-2',
      players: PLAYERS,
      seed: 10,
      rules: { initialHandSize: 5, stackingCap: 12 },
    });
    expect(state.rules.initialHandSize).toBe(5);
    expect(state.rules.stackingCap).toBe(12);
    const started = startMatch(state);
    expect(started.players.get('p1')?.hand).toHaveLength(5);
  });

  it('startMatch distribuisce 7 carte a testa, sceglie prima carta non-wild e passa a playing', () => {
    const initial = createInitialState({ matchId: 'match-3', players: PLAYERS, seed: 1234 });
    const started = startMatch(initial);

    expect(started.phase).toBe('playing');
    for (const p of PLAYERS) {
      expect(started.players.get(p.id)?.hand).toHaveLength(7);
    }
    expect(started.discardPile).toHaveLength(1);
    const top = started.discardPile[0]!;
    expect(top.color).not.toBe('wild');
    expect(started.activeColor).toBe(top.color);
    // 108 - (3*7) - 1 = 86 carte rimaste nel mazzo
    expect(started.deck).toHaveLength(86);
  });

  it('startMatch lancia errore se la partita e gia avviata o non ci sono carte non-wild', () => {
    const started = startMatch(
      createInitialState({ matchId: 'match-4', players: PLAYERS, seed: 7 })
    );
    expect(() => startMatch(started)).toThrow('Match already started');

    const onlyWilds = createInitialState({ matchId: 'match-w', players: PLAYERS, seed: 1 });
    onlyWilds.deck = onlyWilds.deck.filter((c) => c.color === 'wild');
    onlyWilds.rules.initialHandSize = 1;
    expect(() => startMatch(onlyWilds)).toThrow('No valid starting card');
  });

  it('applyAction smista draw_card mantenendo l immutabilita dello stato precedente', () => {
    const s0 = startMatch(createInitialState({ matchId: 'm5', players: PLAYERS, seed: 99 }));
    const s1 = applyAction(s0, 'p1', { type: 'draw_card' });

    expect(s0.players.get('p1')?.hand).toHaveLength(7);
    expect(s1.players.get('p1')?.hand).toHaveLength(8);
    expect(s1.currentTurnIndex).toBe(1);
  });

  it('applyAction smista play_card correttamente', () => {
    const s0 = startMatch(createInitialState({ matchId: 'm6', players: PLAYERS, seed: 99 }));
    const p1 = s0.players.get('p1')!;
    const redCard = { id: 'forced-red-1', color: 'red' as const, kind: 'number' as const, value: 1 as const };
    p1.hand.push(redCard);
    s0.discardPile[0] = { id: 'top-red-0', color: 'red', kind: 'number', value: 0 };
    s0.activeColor = 'red';

    const s1 = applyAction(s0, 'p1', { type: 'play_card', cardId: 'forced-red-1' });
    expect(s1.discardPile[0]?.id).toBe('forced-red-1');
  });

  it('applyAction smista call_uno', () => {
    const s0 = startMatch(createInitialState({ matchId: 'm7', players: PLAYERS, seed: 99 }));
    s0.players.get('p2')!.hand = [{ id: 'single', color: 'blue', kind: 'number', value: 3 }];
    const s1 = applyAction(s0, 'p2', { type: 'call_uno' });
    expect(s1.players.get('p2')?.hasCalledUno).toBe(true);
  });

  it('applyAction smista challenge_wild4', () => {
    const s0 = startMatch(createInitialState({ matchId: 'm8', players: PLAYERS, seed: 99 }));
    s0.lastWildDraw4PlayerId = 'p3';
    s0.lastWildDraw4WasLegal = true;
    const s1 = applyAction(s0, 'p1', { type: 'challenge_wild4' });
    expect(s1.players.get('p1')?.hand).toHaveLength(13); // 7 + 6
    expect(s1.lastWildDraw4PlayerId).toBeNull();
  });
});
