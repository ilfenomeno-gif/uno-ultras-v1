// ============================================================
// UNO ULTRA Shared Tests — Mini-Games, Pentathlon, Economy & Custom Rules
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  BATTLE_CARD_MAX_LEVEL,
  BATTLE_CARD_REWARDS,
  MINI_GAME_ENGINES,
  PENTATHLON_SEQUENCE,
  VARIANT_PRESETS,
  blackjackEngine,
  createPentathlonMatch,
  pokerTexasEngine,
  recordPentathlonEvent,
  rubaMazzettoEngine,
  scopaEngine,
  validatePresetForPlayers,
  type AnyMiniGameMode,
} from '../../src/index.js';

describe('MINI_GAME_ENGINES — all 7 engines deterministic & private-hand safe', () => {
  const modes = Object.keys(MINI_GAME_ENGINES) as AnyMiniGameMode[];

  it('registers all 7 mini-games matching GAME_MODES non-uno entries', () => {
    expect(modes).toHaveLength(7);
    expect(modes.sort()).toEqual([
      'blackjack',
      'burraco',
      'mille-miglia',
      'poker-texas',
      'ruba-mazzetto',
      'scala40',
      'scopa',
    ]);
  });

  it('never leaks opponent private hands in getPublicView()', () => {
    for (const mode of modes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const engine = MINI_GAME_ENGINES[mode] as any;
      const state = engine.createInitialState(`m_${mode}`, ['p1', 'p2'], 42);
      const viewP1 = engine.getPublicView(state, 'p1') as Record<string, unknown>;
      expect(viewP1['mode']).toBe(mode);
      expect(viewP1['hands']).toBeUndefined();
      expect(viewP1['holeCards']).toBeUndefined();

      if (mode !== 'poker-texas') {
        expect(Array.isArray(viewP1['myHand'])).toBe(true);
      } else {
        expect(Array.isArray(viewP1['myHoleCards'])).toBe(true);
      }
    }
  });

  it('completes a full Blackjack match cleanly', () => {
    let state = blackjackEngine.createInitialState('bj-1', ['p1', 'p2'], 101);
    let safety = 0;
    while (state.phase === 'playing' && safety++ < 20) {
      const pid = state.playerOrder[state.currentTurnIndex]!;
      state = blackjackEngine.applyAction(state, pid, { type: 'stand' });
    }
    expect(state.phase).toBe('finished');
    expect(state.winnerId).not.toBeNull();
    expect(state.dealerHand.length).toBeGreaterThanOrEqual(2);
  });

  it('resolves Poker Texas Holdem pot immediately when opponent folds', () => {
    let state = pokerTexasEngine.createInitialState('pk-1', ['p1', 'p2'], 7);
    const activePid = state.playerOrder[state.currentTurnIndex]!;
    state = pokerTexasEngine.applyAction(state, activePid, { type: 'fold' });
    expect(state.phase).toBe('finished');
    expect(state.winnerId).toBe(activePid === 'p1' ? 'p2' : 'p1');
  });

  it('completes a full deterministic Scopa match via first legal action', () => {
    let state = scopaEngine.createInitialState('sc-1', ['p1', 'p2'], 99);
    let guard = 0;
    while (state.phase === 'playing' && guard++ < 60) {
      const pid = state.playerOrder[state.currentTurnIndex]!;
      const legal = scopaEngine.getLegalActions(state, pid);
      state = scopaEngine.applyAction(state, pid, legal[0]!);
    }
    expect(state.phase).toBe('finished');
    expect(state.winnerId).not.toBeNull();
  });

  it('completes a full deterministic Ruba Mazzetto match', () => {
    let state = rubaMazzettoEngine.createInitialState('rm-1', ['p1', 'p2'], 55);
    let guard = 0;
    while (state.phase === 'playing' && guard++ < 60) {
      const pid = state.playerOrder[state.currentTurnIndex]!;
      const legal = rubaMazzettoEngine.getLegalActions(state, pid);
      state = rubaMazzettoEngine.applyAction(state, pid, legal[0]!);
    }
    expect(state.phase).toBe('finished');
    const totalStacked =
      (state.scores['p1'] ?? 0) + (state.scores['p2'] ?? 0) + state.tableCards.length;
    expect(totalStacked).toBe(40);
  });
});

describe('Pentathlon 5-event championship & Economy invariants', () => {
  it('awards F1 points across 5 Pentathlon rounds and crowns champion', () => {
    let match = createPentathlonMatch('t-pent', ['p1', 'p2', 'p3', 'p4']);
    expect(PENTATHLON_SEQUENCE).toHaveLength(5);
    for (let i = 0; i < 5; i++) {
      match = recordPentathlonEvent(match, ['p2', 'p1', 'p3', 'p4']);
    }
    expect(match.totals['p2']).toBe(125);
    expect(match.totals['p1']).toBe(90);
    expect(match.championId).toBe('p2');
    expect(match.currentMode).toBeNull();
  });

  it('Battle Card Lv. 1..100 pays exactly 500 Free + 500 Premium = 1000 V-Card', () => {
    expect(BATTLE_CARD_REWARDS).toHaveLength(BATTLE_CARD_MAX_LEVEL);
    const freeVCard = BATTLE_CARD_REWARDS.reduce(
      (sum, r) => sum + (r.free?.kind === 'vcard' ? (r.free.vcardAmount ?? 0) : 0),
      0,
    );
    const premVCard = BATTLE_CARD_REWARDS.reduce(
      (sum, r) => sum + (r.premium?.kind === 'vcard' ? (r.premium.vcardAmount ?? 0) : 0),
      0,
    );
    expect(freeVCard).toBe(500);
    expect(premVCard).toBe(500);
    expect(freeVCard + premVCard).toBe(1000);
  });
});

describe('Custom Rules & Match Variant Validation', () => {
  it('validates Team 2v2 requires 4 players and rejects Blitz timeout > 15s', () => {
    expect(validatePresetForPlayers(VARIANT_PRESETS.team, 2).ok).toBe(false);
    expect(validatePresetForPlayers(VARIANT_PRESETS.team, 4).ok).toBe(true);

    const invalidBlitz = {
      ...VARIANT_PRESETS.blitz,
      rules: { ...VARIANT_PRESETS.blitz.rules, turnTimeoutSeconds: 30 },
    };
    expect(validatePresetForPlayers(invalidBlitz, 4).ok).toBe(false);

    const invalidOverload = {
      ...VARIANT_PRESETS.custom,
      rules: { ...VARIANT_PRESETS.custom.rules, stackingCap: 20, stackingOverload: 10 },
    };
    expect(validatePresetForPlayers(invalidOverload, 4).ok).toBe(false);
  });
});
