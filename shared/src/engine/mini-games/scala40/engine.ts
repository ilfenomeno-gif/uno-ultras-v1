// ============================================================
// UNO ULTRA — Scala 40 (2-4 players, set/sequence melds + 40pt opening)
// ============================================================

import {
  createDeck52,
  type MiniGameEngine,
  type MiniGameStateBase,
  type StandardCard,
} from '../mini-game-contract.js';

export type Scala40Action =
  | { readonly type: 'draw_stock' }
  | { readonly type: 'draw_discard' }
  | { readonly type: 'meld'; readonly cardIds: readonly string[] }
  | { readonly type: 'discard'; readonly cardId: string };

export interface Scala40State extends MiniGameStateBase {
  readonly stock: readonly StandardCard[];
  readonly discardPile: readonly StandardCard[];
  readonly hands: Readonly<Record<string, readonly StandardCard[]>>;
  readonly tableMelds: readonly (readonly StandardCard[])[];
  readonly opened: Readonly<Record<string, boolean>>;
  readonly hasDrawnThisTurn: boolean;
}

export function cardScalaValue(card: StandardCard): number {
  if (card.rank === 1) return 11;
  if (card.rank >= 10) return 10;
  return card.rank;
}

export function isValidScalaMeld(cards: readonly StandardCard[]): boolean {
  if (cards.length < 3) return false;
  // Tris/Poker: stesso rank, semi distinti
  const sameRank = cards.every((c) => c.rank === cards[0]!.rank);
  if (sameRank && cards.length <= 4) {
    const suits = new Set(cards.map((c) => c.suit));
    return suits.size === cards.length;
  }
  // Scala: stesso seme, rank consecutivi
  const sameSuit = cards.every((c) => c.suit === cards[0]!.suit);
  if (!sameSuit) return false;
  const sorted = [...cards].sort((a, b) => a.rank - b.rank);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]!.rank !== sorted[i - 1]!.rank + 1) return false;
  }
  return true;
}

export const scala40Engine: MiniGameEngine<Scala40State, Scala40Action> = {
  mode: 'scala40',
  label: 'Scala 40',
  minPlayers: 2,
  maxPlayers: 4,

  createInitialState(matchId, playerIds, seed = Date.now()) {
    const order = playerIds.slice(0, 4);
    const deck = createDeck52(seed).concat(createDeck52(seed + 1));
    const hands: Record<string, StandardCard[]> = {};
    const opened: Record<string, boolean> = {};
    const scores: Record<string, number> = {};
    for (const pid of order) {
      hands[pid] = deck.splice(0, 13);
      opened[pid] = false;
      scores[pid] = 0;
    }
    const firstDiscard = deck.shift()!;
    return {
      matchId,
      mode: 'scala40',
      seed,
      playerOrder: order,
      currentTurnIndex: 0,
      round: 1,
      phase: 'playing',
      winnerId: null,
      scores,
      stock: deck,
      discardPile: [firstDiscard],
      hands,
      tableMelds: [],
      opened,
      hasDrawnThisTurn: false,
    };
  },

  getLegalActions(state, playerId) {
    if (state.phase !== 'playing' || state.playerOrder[state.currentTurnIndex] !== playerId) {
      return [];
    }
    if (!state.hasDrawnThisTurn) {
      const acts: Scala40Action[] = [];
      if (state.stock.length > 0) acts.push({ type: 'draw_stock' });
      if (state.discardPile.length > 0) acts.push({ type: 'draw_discard' });
      return acts;
    }
    const hand = state.hands[playerId] ?? [];
    return hand.map((c) => ({ type: 'discard', cardId: c.id }));
  },

  applyAction(state, playerId, action) {
    if (state.phase !== 'playing' || state.playerOrder[state.currentTurnIndex] !== playerId) {
      throw new Error(`Scala40: not ${playerId}'s turn`);
    }
    const stock = [...state.stock];
    const discardPile = [...state.discardPile];
    const hand = [...(state.hands[playerId] ?? [])];
    const opened = { ...state.opened };
    const tableMelds = [...state.tableMelds];

    if (action.type === 'draw_stock') {
      if (state.hasDrawnThisTurn) throw new Error('Scala40: already drew');
      const card = stock.shift();
      if (!card) throw new Error('Scala40: empty stock');
      hand.push(card);
      return {
        ...state,
        stock,
        hands: { ...state.hands, [playerId]: hand },
        hasDrawnThisTurn: true,
      };
    }

    if (action.type === 'draw_discard') {
      if (state.hasDrawnThisTurn) throw new Error('Scala40: already drew');
      const card = discardPile.pop();
      if (!card) throw new Error('Scala40: empty discard');
      hand.push(card);
      return {
        ...state,
        discardPile,
        hands: { ...state.hands, [playerId]: hand },
        hasDrawnThisTurn: true,
      };
    }

    if (!state.hasDrawnThisTurn) {
      throw new Error('Scala40: must draw before meld/discard');
    }

    if (action.type === 'meld') {
      const selected = hand.filter((c) => action.cardIds.includes(c.id));
      if (selected.length !== action.cardIds.length || !isValidScalaMeld(selected)) {
        throw new Error('Scala40: invalid meld');
      }
      const meldPoints = selected.reduce((sum, c) => sum + cardScalaValue(c), 0);
      if (!opened[playerId] && meldPoints < 40) {
        throw new Error('Scala40: opening meld requires >= 40 points');
      }
      opened[playerId] = true;
      tableMelds.push(selected);
      const nextHand = hand.filter((c) => !action.cardIds.includes(c.id));
      return {
        ...state,
        hands: { ...state.hands, [playerId]: nextHand },
        tableMelds,
        opened,
      };
    }

    // discard
    const idx = hand.findIndex((c) => c.id === action.cardId);
    if (idx < 0) throw new Error('Scala40: card not in hand');
    const [removed] = hand.splice(idx, 1);
    if (removed) discardPile.push(removed);

    const nextHands = { ...state.hands, [playerId]: hand };
    if (hand.length === 0 || stock.length === 0) {
      const scores: Record<string, number> = {};
      for (const pid of state.playerOrder) {
        const penalty = (nextHands[pid] ?? []).reduce((s, c) => s + cardScalaValue(c), 0);
        scores[pid] = pid === playerId && hand.length === 0 ? 100 : Math.max(0, 100 - penalty);
      }
      const winnerId =
        hand.length === 0
          ? playerId
          : [...state.playerOrder].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))[0] ?? null;
      return {
        ...state,
        stock,
        discardPile,
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
      topDiscard: state.discardPile[state.discardPile.length - 1] ?? null,
      tableMelds: state.tableMelds,
      opened: state.opened,
      handCounts: Object.fromEntries(
        state.playerOrder.map((pid) => [pid, (state.hands[pid] ?? []).length]),
      ),
      myHand: state.hands[viewerId] ?? [],
    };
  },
};
