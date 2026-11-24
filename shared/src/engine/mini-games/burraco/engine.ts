// ============================================================
// UNO ULTRA — Burraco (2 or 4 players, pozzetto + canasta scoring)
// ============================================================

import {
  createDeck52,
  type MiniGameEngine,
  type MiniGameStateBase,
  type StandardCard,
} from '../mini-game-contract.js';
import { isValidScalaMeld } from '../scala40/engine.js';

export type BurracoAction =
  | { readonly type: 'draw_stock' }
  | { readonly type: 'draw_discard_pile' }
  | { readonly type: 'meld'; readonly cardIds: readonly string[] }
  | { readonly type: 'discard'; readonly cardId: string };

export interface BurracoState extends MiniGameStateBase {
  readonly stock: readonly StandardCard[];
  readonly discardPile: readonly StandardCard[];
  readonly pozzetti: readonly (readonly StandardCard[])[];
  readonly hands: Readonly<Record<string, readonly StandardCard[]>>;
  readonly melds: Readonly<Record<string, readonly (readonly StandardCard[])[]>>;
  readonly tookPozzetto: Readonly<Record<string, boolean>>;
  readonly hasDrawnThisTurn: boolean;
}

function cardBurracoPoints(c: StandardCard): number {
  if (c.rank === 1) return 15;
  if (c.rank === 2) return 20;
  if (c.rank >= 8 && c.rank <= 13) return 10;
  return 5;
}

export const burracoEngine: MiniGameEngine<BurracoState, BurracoAction> = {
  mode: 'burraco',
  label: 'Burraco Online',
  minPlayers: 2,
  maxPlayers: 4,

  createInitialState(matchId, playerIds, seed = Date.now()) {
    const order = playerIds.slice(0, 4);
    const deck = createDeck52(seed).concat(createDeck52(seed + 7));
    const hands: Record<string, StandardCard[]> = {};
    const melds: Record<string, StandardCard[][]> = {};
    const tookPozzetto: Record<string, boolean> = {};
    const scores: Record<string, number> = {};
    for (const pid of order) {
      hands[pid] = deck.splice(0, 11);
      melds[pid] = [];
      tookPozzetto[pid] = false;
      scores[pid] = 0;
    }
    const pozzetti = [deck.splice(0, 11), deck.splice(0, 11)];
    const firstDiscard = deck.shift()!;
    return {
      matchId,
      mode: 'burraco',
      seed,
      playerOrder: order,
      currentTurnIndex: 0,
      round: 1,
      phase: 'playing',
      winnerId: null,
      scores,
      stock: deck,
      discardPile: [firstDiscard],
      pozzetti,
      hands,
      melds,
      tookPozzetto,
      hasDrawnThisTurn: false,
    };
  },

  getLegalActions(state, playerId) {
    if (state.phase !== 'playing' || state.playerOrder[state.currentTurnIndex] !== playerId) {
      return [];
    }
    if (!state.hasDrawnThisTurn) {
      const acts: BurracoAction[] = [];
      if (state.stock.length > 0) acts.push({ type: 'draw_stock' });
      if (state.discardPile.length > 0) acts.push({ type: 'draw_discard_pile' });
      return acts;
    }
    return (state.hands[playerId] ?? []).map((c) => ({ type: 'discard', cardId: c.id }));
  },

  applyAction(state, playerId, action) {
    if (state.phase !== 'playing' || state.playerOrder[state.currentTurnIndex] !== playerId) {
      throw new Error(`Burraco: not ${playerId}'s turn`);
    }
    const stock = [...state.stock];
    let discardPile = [...state.discardPile];
    let hand = [...(state.hands[playerId] ?? [])];
    const melds = Object.fromEntries(
      Object.entries(state.melds).map(([k, v]) => [k, v.map((m) => [...m])]),
    );
    const pozzetti = state.pozzetti.map((p) => [...p]);
    const tookPozzetto = { ...state.tookPozzetto };

    if (action.type === 'draw_stock') {
      if (state.hasDrawnThisTurn) throw new Error('Burraco: already drew');
      const card = stock.shift();
      if (!card) throw new Error('Burraco: empty stock');
      hand.push(card);
      return {
        ...state,
        stock,
        hands: { ...state.hands, [playerId]: hand },
        hasDrawnThisTurn: true,
      };
    }

    if (action.type === 'draw_discard_pile') {
      if (state.hasDrawnThisTurn) throw new Error('Burraco: already drew');
      if (discardPile.length === 0) throw new Error('Burraco: empty discard pile');
      hand = [...hand, ...discardPile];
      discardPile = [];
      return {
        ...state,
        discardPile,
        hands: { ...state.hands, [playerId]: hand },
        hasDrawnThisTurn: true,
      };
    }

    if (!state.hasDrawnThisTurn) throw new Error('Burraco: must draw first');

    if (action.type === 'meld') {
      const chosen = hand.filter((c) => action.cardIds.includes(c.id));
      if (chosen.length !== action.cardIds.length || !isValidScalaMeld(chosen)) {
        throw new Error('Burraco: invalid meld');
      }
      melds[playerId] = [...(melds[playerId] ?? []), chosen];
      hand = hand.filter((c) => !action.cardIds.includes(c.id));
      if (hand.length === 0 && !tookPozzetto[playerId] && pozzetti.length > 0) {
        hand = pozzetti.shift() ?? [];
        tookPozzetto[playerId] = true;
      }
      return {
        ...state,
        pozzetti,
        tookPozzetto,
        melds,
        hands: { ...state.hands, [playerId]: hand },
      };
    }

    const idx = hand.findIndex((c) => c.id === action.cardId);
    if (idx < 0) throw new Error('Burraco: card not in hand');
    const [removed] = hand.splice(idx, 1);
    if (removed) discardPile.push(removed);

    if (hand.length === 0 && !tookPozzetto[playerId] && pozzetti.length > 0) {
      hand = pozzetti.shift() ?? [];
      tookPozzetto[playerId] = true;
    }

    const nextHands = { ...state.hands, [playerId]: hand };
    const ended = (hand.length === 0 && tookPozzetto[playerId]) || stock.length === 0;
    if (ended) {
      const scores: Record<string, number> = {};
      for (const pid of state.playerOrder) {
        const playerMelds = melds[pid] ?? [];
        const meldPts = playerMelds
          .flat()
          .reduce((sum, c) => sum + cardBurracoPoints(c), 0);
        const burracoBonus = playerMelds.reduce((b, m) => b + (m.length >= 7 ? 100 : 0), 0);
        const closeBonus = pid === playerId && hand.length === 0 ? 100 : 0;
        const handPenalty = (nextHands[pid] ?? []).reduce((s, c) => s + cardBurracoPoints(c), 0);
        scores[pid] = meldPts + burracoBonus + closeBonus - handPenalty;
      }
      const winnerId =
        [...state.playerOrder].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))[0] ?? null;
      return {
        ...state,
        stock,
        discardPile,
        pozzetti,
        tookPozzetto,
        melds,
        hands: nextHands,
        phase: 'finished',
        winnerId,
        scores,
        hasDrawnThisTurn: false,
      };
    }

    return {
      ...state,
      stock,
      discardPile,
      pozzetti,
      tookPozzetto,
      melds,
      hands: nextHands,
      currentTurnIndex: (state.currentTurnIndex + 1) % state.playerOrder.length,
      round: state.round + (state.currentTurnIndex + 1 >= state.playerOrder.length ? 1 : 0),
      hasDrawnThisTurn: false,
    };
  },

  getPublicView(state, viewerId) {
    return {
      matchId: state.matchId,
      mode: state.mode,
      phase: state.phase,
      currentPlayerId: state.playerOrder[state.currentTurnIndex] ?? null,
      winnerId: state.winnerId,
      scores: state.scores,
      stockCount: state.stock.length,
      discardCount: state.discardPile.length,
      topDiscard: state.discardPile[state.discardPile.length - 1] ?? null,
      melds: state.melds,
      tookPozzetto: state.tookPozzetto,
      myHand: state.hands[viewerId] ?? [],
    };
  },
};
