import { describe, expect, it } from 'vitest';
import { MINI_GAME_ENGINES, type AnyMiniGameMode } from '@uno/shared';
import {
  computeBlackjackTotal,
  findCardActions,
  formatMilleCardMeta,
  formatMilleHazardLabel,
  formatMiniGameActionLabel,
  formatScoreSummary,
  formatStandardCardLabel,
  pickMiniGameBotNames,
  pickMiniGameBotProfiles,
  type MiniGameActionLike,
} from '../src/ui/minigames/minigame-helpers.js';

const ALL_MODES = Object.keys(MINI_GAME_ENGINES) as AnyMiniGameMode[];

describe('7 Mini-Games Full-Screen UI Helpers', () => {
  it('maps all internal action types to natural Italian labels with zero raw IDs', () => {
    const sampleActions: MiniGameActionLike[] = [
      { type: 'hit' },
      { type: 'stand' },
      { type: 'double' },
      { type: 'draw_stock' },
      { type: 'draw_discard' },
      { type: 'draw_discard_pile' },
      { type: 'fold' },
      { type: 'check_call' },
      { type: 'raise', amount: 60 },
      { type: 'meld' },
      { type: 'play_card', cardId: 'coppe_7' },
      { type: 'play_distance', cardId: 'mille_12' },
      { type: 'play_remedy', cardId: 'mille_55' },
      { type: 'play_safety', cardId: 'mille_84' },
      { type: 'play_hazard', cardId: 'mille_44', targetPlayerId: 'Bot 1' },
      { type: 'discard', cardId: 'mille_10' },
    ];

    expect(ALL_MODES).toHaveLength(7);
    for (const mode of ALL_MODES) {
      for (const act of sampleActions) {
        const label = formatMiniGameActionLabel(mode, act);
        expect(label.length).toBeGreaterThan(2);
        expect(label).not.toContain('_');
        expect(label).not.toContain('mille_');
        expect(label).not.toContain('coppe_7');
      }
    }

    expect(formatMiniGameActionLabel('scala40', { type: 'draw_stock' })).toBe('Pesca dal mazzo');
    expect(formatMiniGameActionLabel('poker-texas', { type: 'check_call' })).toBe('Vedi / Chiama');
    expect(formatMiniGameActionLabel('poker-texas', { type: 'raise', amount: 60 })).toBe('Rilancia +60');
  });

  it('produces clean labels for live initial legal actions across all 7 engines', () => {
    for (const mode of ALL_MODES) {
      const engine = MINI_GAME_ENGINES[mode];
      const state = engine.createInitialState(`test_${mode}`, ['Tu', 'Bot_1'], 42);
      const cur = state.playerOrder[state.currentTurnIndex] ?? 'Tu';
      const actions = engine.getLegalActions(state, cur) as MiniGameActionLike[];
      for (const act of actions) {
        const label = formatMiniGameActionLabel(mode, act);
        expect(label).not.toMatch(/draw_stock|draw_discard|check_call|play_card|play_safety/);
      }
    }
  });

  it('matches play and discard actions cleanly per cardId', () => {
    const milleLegal: MiniGameActionLike[] = [
      { type: 'play_safety', cardId: 'mille_84' },
      { type: 'discard', cardId: 'mille_84' },
      { type: 'discard', cardId: 'mille_10' },
    ];
    const safetyMatch = findCardActions(milleLegal, 'mille_84');
    expect(safetyMatch.playAction?.type).toBe('play_safety');
    expect(safetyMatch.discardAction?.type).toBe('discard');

    const distMatch = findCardActions(milleLegal, 'mille_10');
    expect(distMatch.playAction).toBeNull();
    expect(distMatch.discardAction?.type).toBe('discard');
  });

  it('formats standard French & Italian cards accurately', () => {
    expect(formatStandardCardLabel({ id: 'h1', suit: 'hearts', rank: 1 })).toEqual({
      id: 'h1',
      rank: 'A',
      suitGlyph: '♥',
      suit: 'hearts',
      isRed: true,
      isItalian: false,
    });
    expect(formatStandardCardLabel({ id: 'd7', suit: 'denari', rank: 7 })).toEqual({
      id: 'd7',
      rank: '7',
      suitGlyph: '🪙',
      suit: 'denari',
      isRed: true,
      isItalian: true,
    });
  });

  it('formats Mille Miglia categories, hazard labels, Blackjack totals, and score summaries', () => {
    expect(formatMilleCardMeta({ category: 'safety', safety: 'driving_ace' })).toEqual({
      title: 'Asso del Volante',
      badge: 'SAFETY',
      category: 'safety',
      icon: '🛡️',
    });
    expect(formatMilleCardMeta({ category: 'hazard', hazard: 'flat_tire' }).title).toBe(
      'Gomma a Terra',
    );
    expect(formatMilleHazardLabel(null)).toBe('Via Libera');
    expect(formatMilleHazardLabel('out_of_gas')).toBe('Senza Benzina');

    expect(computeBlackjackTotal([{ rank: 1 }, { rank: 10 }])).toBe(21);
    expect(computeBlackjackTotal([{ rank: 1 }, { rank: 9 }, { rank: 5 }])).toBe(15);
    expect(formatScoreSummary({ scores: { Tu: 15, Bot_1: 0 } })).toBe('Tu: 15 · Bot_1: 0');

    const bots = pickMiniGameBotNames(3, 42);
    expect(bots).toHaveLength(3);
    expect(new Set(bots).size).toBe(3);
    expect(bots[0]).not.toMatch(/^Bot_/);

    const botProfiles = pickMiniGameBotProfiles(3, 42, 'blackjack');
    expect(botProfiles).toHaveLength(3);
    for (const bot of botProfiles) {
      expect(bot.rankTier.length).toBeGreaterThan(2);
      expect(bot.titleText.length).toBeGreaterThan(1);
      expect(bot.rankColor).toMatch(/^#/);
      expect(bot.avatarId).toMatch(/^avatar_/);
      expect(bot.frameId).toMatch(/^frame_/);
    }
  });
});
