// ============================================================
// UNO ULTRA — Ruba Mazzetto (2-4 players, Italian 40-card steal stack)
// ============================================================

import {
  createDeck40,
  type ItalianCard,
  type MiniGameEngine,
  type MiniGameStateBase,
} from '../mini-game-contract.js';

export type RubaMazzettoAction = { readonly type: 'play_card'; readonly cardId: string };

export interface RubaMazzettoState extends MiniGameStateBase {
  readonly stock: readonly ItalianCard[];
  readonly tableCards: readonly ItalianCard[];
  readonly hands: Readonly<Record<string, readonly ItalianCard[]>>;
  readonly stacks: Readonly<Record<string, readonly ItalianCard[]>>;
  readonly lastCapturerId: string | null;
}

function dealNextBatch(
  stock: ItalianCard[],
  hands: Record<string, ItalianCard[]>,
  order: readonly string[],
): boolean {
  const anyCardsLeft = order.some((pid) => (hands[pid] ?? []).length > 0);
  if (anyCardsLeft || stock.length === 0) return false;
  for (const pid of order) {
    hands[pid] = stock.splice(0, 3);
  }
  return true;
}

export const rubaMazzettoEngine: MiniGameEngine<RubaMazzettoState, RubaMazzettoAction> = {
  mode: 'ruba-mazzetto',
  label: 'Ruba Mazzetto',
  minPlayers: 2,
  maxPlayers: 4,

  createInitialState(matchId, playerIds, seed = Date.now()) {
    const order = playerIds.slice(0, 4);
    const deck = createDeck40(seed);
    const hands: Record<string, ItalianCard[]> = {};
    const stacks: Record<string, ItalianCard[]> = {};
    const scores: Record<string, number> = {};
    for (const pid of order) {
      hands[pid] = deck.splice(0, 3);
      stacks[pid] = [];
      scores[pid] = 0;
    }
    const tableCards = deck.splice(0, 4);
    return {
      matchId,
      mode: 'ruba-mazzetto',
      seed,
      playerOrder: order,
      currentTurnIndex: 0,
      round: 1,
      phase: 'playing',
      winnerId: null,
      scores,
      stock: deck,
      tableCards,
      hands,
      stacks,
      lastCapturerId: null,
    };
  },

  getLegalActions(state, playerId) {
    if (state.phase !== 'playing' || state.playerOrder[state.currentTurnIndex] !== playerId) {
      return [];
    }
    return (state.hands[playerId] ?? []).map((c) => ({ type: 'play_card', cardId: c.id }));
  },

  applyAction(state, playerId, action) {
    if (state.phase !== 'playing' || state.playerOrder[state.currentTurnIndex] !== playerId) {
      throw new Error(`RubaMazzetto: not ${playerId}'s turn`);
    }
    const hand = [...(state.hands[playerId] ?? [])];
    const idx = hand.findIndex((c) => c.id === action.cardId);
    if (idx < 0) throw new Error('RubaMazzetto: card not in hand');
    const [played] = hand.splice(idx, 1);
    if (!played) throw new Error('RubaMazzetto: missing card');

    const tableCards = [...state.tableCards];
    const stacks: Record<string, ItalianCard[]> = Object.fromEntries(
      Object.entries(state.stacks).map(([k, v]) => [k, [...v]]),
    );
    let lastCapturerId = state.lastCapturerId;

    // Controlla prima se puo rubare il mazzetto di un avversario
    const victimId = state.playerOrder.find((pid) => {
      if (pid === playerId) return false;
      const st = stacks[pid] ?? [];
      const top = st[st.length - 1];
      return top !== undefined && top.rank === played.rank;
    });

    const tableIdx = tableCards.findIndex((c) => c.rank === played.rank);
    if (victimId) {
      const stolen = stacks[victimId] ?? [];
      stacks[victimId] = [];
      stacks[playerId] = [...(stacks[playerId] ?? []), ...stolen, played];
      lastCapturerId = playerId;
    } else if (tableIdx >= 0) {
      const [captured] = tableCards.splice(tableIdx, 1);
      stacks[playerId] = [...(stacks[playerId] ?? []), ...(captured ? [captured] : []), played];
      lastCapturerId = playerId;
    } else {
      tableCards.push(played);
    }

    const stock = [...state.stock];
    const nextHands: Record<string, ItalianCard[]> = Object.fromEntries(
      state.playerOrder.map((pid) => [pid, pid === playerId ? hand : [...(state.hands[pid] ?? [])]]),
    );
    dealNextBatch(stock, nextHands, state.playerOrder);

    const noCardsRemain =
      stock.length === 0 && state.playerOrder.every((pid) => (nextHands[pid] ?? []).length === 0);

    if (noCardsRemain) {
      if (lastCapturerId && tableCards.length > 0) {
        stacks[lastCapturerId] = [...(stacks[lastCapturerId] ?? []), ...tableCards];
        tableCards.length = 0;
      }
      const scores: Record<string, number> = {};
      for (const pid of state.playerOrder) {
        scores[pid] = (stacks[pid] ?? []).length;
      }
      const winnerId =
        [...state.playerOrder].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))[0] ?? null;
      return {
        ...state,
        stock,
        tableCards,
        hands: nextHands,
        stacks,
        lastCapturerId,
        phase: 'finished',
        winnerId,
        scores,
      };
    }

    const scores = Object.fromEntries(
      state.playerOrder.map((pid) => [pid, (stacks[pid] ?? []).length]),
    );
    return {
      ...state,
      stock,
      tableCards,
      hands: nextHands,
      stacks,
      lastCapturerId,
      scores,
      currentTurnIndex: (state.currentTurnIndex + 1) % state.playerOrder.length,
      round: state.round + (state.currentTurnIndex + 1 >= state.playerOrder.length ? 1 : 0),
    };
  },

  getPublicView(state, viewerId) {
    const stackTops = Object.fromEntries(
      state.playerOrder.map((pid) => {
        const s = state.stacks[pid] ?? [];
        return [pid, { count: s.length, top: s[s.length - 1] ?? null }];
      }),
    );
    return {
      matchId: state.matchId,
      mode: state.mode,
      phase: state.phase,
      currentPlayerId: state.playerOrder[state.currentTurnIndex] ?? null,
      winnerId: state.winnerId,
      scores: state.scores,
      stockCount: state.stock.length,
      tableCards: state.tableCards,
      stackTops,
      myHand: state.hands[viewerId] ?? [],
    };
  },
};
