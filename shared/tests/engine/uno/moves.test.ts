// ============================================================
// UNO ULTRA — Unit tests: Pure Move Handlers
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_UNO_RULES,
  callUno,
  challengeWild4,
  createUnoDeck,
  drawCard,
  playCard,
  type EngineState,
  type UnoCard,
  type UnoRules,
} from '../../../src/index.js';

const c = (
  id: string,
  color: UnoCard['color'],
  kind: UnoCard['kind'],
  value?: UnoCard['value']
): UnoCard => (value !== undefined ? { id, color, kind, value } : { id, color, kind });

function makePlayingState(opts?: {
  players?: Array<{ id: string; hand: UnoCard[]; hasCalledUno?: boolean }>;
  discardTop?: UnoCard;
  activeColor?: UnoCard['color'];
  rules?: Partial<UnoRules>;
  pendingDrawCount?: number;
  lastWildDraw4PlayerId?: string | null;
  lastWildDraw4WasLegal?: boolean;
  phase?: EngineState['phase'];
}): EngineState {
  const deck = createUnoDeck();
  const list = opts?.players ?? [
    { id: 'p1', hand: [c('r2', 'red', 'number', 2), c('b9', 'blue', 'number', 9)] },
    { id: 'p2', hand: [c('r4', 'red', 'number', 4), c('g4', 'green', 'number', 4)] },
    { id: 'p3', hand: [c('y1', 'yellow', 'number', 1), c('y2', 'yellow', 'number', 2)] },
  ];

  const players = new Map(
    list.map((p) => [
      p.id,
      {
        id: p.id,
        username: p.id.toUpperCase(),
        hand: p.hand,
        hasCalledUno: p.hasCalledUno ?? false,
        isBot: false,
        aiProfile: '' as const,
        isConnected: true,
      },
    ])
  );

  const discardTop = opts?.discardTop ?? c('r7', 'red', 'number', 7);

  return {
    matchId: 'm1',
    players,
    turnOrder: list.map((p) => p.id),
    currentTurnIndex: 0,
    direction: 1,
    deck,
    discardPile: [discardTop],
    activeColor: (opts?.activeColor as EngineState['activeColor']) ?? 'red',
    pendingDrawCount: opts?.pendingDrawCount ?? 0,
    rules: { ...DEFAULT_UNO_RULES, ...opts?.rules },
    phase: opts?.phase ?? 'playing',
    winnerId: null,
    seed: 100,
    lastWildDraw4PlayerId: opts?.lastWildDraw4PlayerId ?? null,
    lastWildDraw4WasLegal: opts?.lastWildDraw4WasLegal ?? true,
  };
}

describe('UNO Moves', () => {
  it('playCard su carta numerica aggiorna scarto, rimuove dalla mano e avanza il turno', () => {
    const state = makePlayingState();
    const next = playCard(state, 'p1', { type: 'play_card', cardId: 'r2' });

    expect(next.discardPile[0]?.id).toBe('r2');
    expect(next.players.get('p1')?.hand).toHaveLength(1);
    expect(next.currentTurnIndex).toBe(1);
    expect(next.activeColor).toBe('red');
    // Immutabilita
    expect(state.players.get('p1')?.hand).toHaveLength(2);
  });

  it('playCard skip salta il giocatore successivo', () => {
    const state = makePlayingState({
      players: [
        { id: 'p1', hand: [c('r-skip', 'red', 'skip'), c('r9', 'red', 'number', 9)] },
        { id: 'p2', hand: [c('r1', 'red', 'number', 1)] },
        { id: 'p3', hand: [c('r2', 'red', 'number', 2)] },
      ],
    });
    const next = playCard(state, 'p1', { type: 'play_card', cardId: 'r-skip' });
    expect(next.currentTurnIndex).toBe(2);
  });

  it('playCard reverse inverte direzione con 3+ giocatori e funge da skip in 1v1', () => {
    const three = makePlayingState({
      players: [
        { id: 'p1', hand: [c('r-rev', 'red', 'reverse'), c('r9', 'red', 'number', 9)] },
        { id: 'p2', hand: [c('r1', 'red', 'number', 1)] },
        { id: 'p3', hand: [c('r2', 'red', 'number', 2)] },
      ],
    });
    const next3 = playCard(three, 'p1', { type: 'play_card', cardId: 'r-rev' });
    expect(next3.direction).toBe(-1);
    expect(next3.currentTurnIndex).toBe(2);

    const duel = makePlayingState({
      players: [
        { id: 'p1', hand: [c('r-rev', 'red', 'reverse'), c('r9', 'red', 'number', 9)] },
        { id: 'p2', hand: [c('r1', 'red', 'number', 1)] },
      ],
    });
    const next2 = playCard(duel, 'p1', { type: 'play_card', cardId: 'r-rev' });
    expect(next2.direction).toBe(-1);
    expect(next2.currentTurnIndex).toBe(0);
  });

  it('playCard draw2 accumula pendingDrawCount e rispetta stackingCap', () => {
    const state = makePlayingState({
      players: [
        { id: 'p1', hand: [c('r-d2', 'red', 'draw2'), c('b1', 'blue', 'number', 1)] },
        { id: 'p2', hand: [c('r2', 'red', 'number', 2)] },
      ],
      pendingDrawCount: 18,
    });
    const next = playCard(state, 'p1', { type: 'play_card', cardId: 'r-d2' });
    expect(next.pendingDrawCount).toBe(20);
  });

  it('playCard wild richiede chosenColor e imposta activeColor', () => {
    const state = makePlayingState({
      players: [
        { id: 'p1', hand: [c('w1', 'wild', 'wild'), c('r1', 'red', 'number', 1)] },
        { id: 'p2', hand: [c('g2', 'green', 'number', 2)] },
      ],
    });
    expect(() => playCard(state, 'p1', { type: 'play_card', cardId: 'w1' })).toThrow(
      'Wild requires chosenColor'
    );
    const next = playCard(state, 'p1', {
      type: 'play_card',
      cardId: 'w1',
      chosenColor: 'blue',
    });
    expect(next.activeColor).toBe('blue');
  });

  it('playCard dell ultima carta chiude la partita e proclama winnerId', () => {
    const state = makePlayingState({
      players: [
        { id: 'p1', hand: [c('r2', 'red', 'number', 2)] },
        { id: 'p2', hand: [c('r4', 'red', 'number', 4)] },
      ],
    });
    const next = playCard(state, 'p1', { type: 'play_card', cardId: 'r2' });
    expect(next.phase).toBe('finished');
    expect(next.winnerId).toBe('p1');
  });

  it('rifiuta mosse fuori fase, fuori turno, carta assente, giocatore ignoto o mossa illegale', () => {
    expect(() =>
      playCard(makePlayingState({ phase: 'lobby' }), 'p1', { type: 'play_card', cardId: 'r2' })
    ).toThrow('Match is not in playing phase');

    const state = makePlayingState();
    expect(() => playCard(state, 'p2', { type: 'play_card', cardId: 'r4' })).toThrow(
      'Not your turn'
    );
    expect(() => playCard(state, 'p1', { type: 'play_card', cardId: 'missing' })).toThrow(
      'Card not in hand'
    );
    expect(() => playCard(state, 'p1', { type: 'play_card', cardId: 'b9' })).toThrow(
      'Illegal play'
    );

    const ghostState = makePlayingState();
    ghostState.turnOrder[0] = 'ghost';
    expect(() => playCard(ghostState, 'ghost', { type: 'play_card', cardId: 'x' })).toThrow(
      'Unknown player'
    );
  });

  it('drawCard pesca 1 carta normalmente oppure tutto il pendingDrawCount e passa turno', () => {
    const s1 = makePlayingState();
    const n1 = drawCard(s1, 'p1');
    expect(n1.players.get('p1')?.hand).toHaveLength(3);
    expect(n1.currentTurnIndex).toBe(1);

    const s2 = makePlayingState({
      pendingDrawCount: 4,
      lastWildDraw4PlayerId: 'p2',
    });
    const n2 = drawCard(s2, 'p1');
    expect(n2.players.get('p1')?.hand).toHaveLength(6);
    expect(n2.pendingDrawCount).toBe(0);
    expect(n2.lastWildDraw4PlayerId).toBeNull();
  });

  it('callUno funziona con 1 sola carta in mano e rifiuta negli altri casi', () => {
    const s1 = makePlayingState({
      players: [
        { id: 'p1', hand: [c('r1', 'red', 'number', 1)] },
        { id: 'p2', hand: [c('r2', 'red', 'number', 2), c('r3', 'red', 'number', 3)] },
      ],
    });
    expect(callUno(s1, 'p1').players.get('p1')?.hasCalledUno).toBe(true);
    expect(() => callUno(s1, 'p2')).toThrow('Cannot call UNO with more than 1 card');
    expect(() => callUno(s1, 'nobody')).toThrow('Unknown player');
  });

  it('challengeWild4 gestisce successo (bluff -> +4 al +4 player) e fallimento (legale -> +6 challenger)', () => {
    // Bluff con wildDraw4Strict=false
    const bluffSetup = makePlayingState({
      rules: { wildDraw4Strict: false },
      players: [
        { id: 'p1', hand: [c('w4', 'wild', 'wild_draw4'), c('r1', 'red', 'number', 1)] },
        { id: 'p2', hand: [c('b2', 'blue', 'number', 2)] },
      ],
    });
    const afterBluff = playCard(bluffSetup, 'p1', {
      type: 'play_card',
      cardId: 'w4',
      chosenColor: 'green',
    });
    expect(afterBluff.lastWildDraw4WasLegal).toBe(false);

    const afterSuccess = challengeWild4(afterBluff, 'p2');
    expect(afterSuccess.players.get('p1')?.hand).toHaveLength(5); // 1 rimasta + 4 penalita
    expect(afterSuccess.currentTurnIndex).toBe(1); // p2 mantiene il turno
    expect(afterSuccess.pendingDrawCount).toBe(0);

    // Wild4 legale -> challenge fallisce: p2 pesca 6 e perde turno
    const legalSetup = makePlayingState({
      players: [
        { id: 'p1', hand: [c('w4', 'wild', 'wild_draw4'), c('b1', 'blue', 'number', 1)] },
        { id: 'p2', hand: [c('b2', 'blue', 'number', 2)] },
      ],
    });
    const afterLegal = playCard(legalSetup, 'p1', {
      type: 'play_card',
      cardId: 'w4',
      chosenColor: 'yellow',
    });
    expect(afterLegal.lastWildDraw4WasLegal).toBe(true);

    const afterFail = challengeWild4(afterLegal, 'p2');
    expect(afterFail.players.get('p2')?.hand).toHaveLength(7); // 1 + 6
    expect(afterFail.currentTurnIndex).toBe(0); // turno passa oltre p2
    expect(afterFail.pendingDrawCount).toBe(0);
  });

  it('challengeWild4 rifiuta se assente wild4 recente o challenge disabilitata', () => {
    const noWild = makePlayingState();
    expect(() => challengeWild4(noWild, 'p1')).toThrow('No wild4 to challenge');

    const disabled = makePlayingState({
      lastWildDraw4PlayerId: 'p2',
      rules: { wildDraw4Challenge: false },
    });
    expect(() => challengeWild4(disabled, 'p1')).toThrow('Challenge disabled by rules');
  });
});
