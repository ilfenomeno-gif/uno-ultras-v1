// ============================================================
// UNO ULTRA — Scopa (2-4 players, sum capture + Settebello + Primiera)
// ============================================================

import {
  createDeck40,
  type ItalianCard,
  type MiniGameEngine,
  type MiniGameStateBase,
} from '../mini-game-contract.js';

export type ScopaAction = { readonly type: 'play_card'; readonly cardId: string };

export interface ScopaState extends MiniGameStateBase {
  readonly stock: readonly ItalianCard[];
  readonly tableCards: readonly ItalianCard[];
  readonly hands: Readonly<Record<string, readonly ItalianCard[]>>;
  readonly captured: Readonly<Record<string, readonly ItalianCard[]>>;
  readonly scopaCounts: Readonly<Record<string, number>>;
  readonly lastCapturerId: string | null;
}

const PRIMIERA_SCORE: Readonly<Record<number, number>> = {
  7: 21,
  6: 18,
  1: 16,
  5: 15,
  4: 14,
  3: 13,
  2: 12,
  8: 10,
  9: 10,
  10: 10,
};

function findBestTableCapture(table: readonly ItalianCard[], targetRank: number): ItalianCard[] {
  const exact = table.find((c) => c.rank === targetRank);
  if (exact) return [exact];

  // Subset sum per 2..n carte
  let bestCombo: ItalianCard[] = [];
  function search(start: number, sum: number, chosen: ItalianCard[]): void {
    if (sum === targetRank && chosen.length > bestCombo.length) {
      bestCombo = [...chosen];
      return;
    }
    if (sum >= targetRank) return;
    for (let i = start; i < table.length; i++) {
      const card = table[i]!;
      chosen.push(card);
      search(i + 1, sum + card.rank, chosen);
      chosen.pop();
    }
  }
  search(0, 0, []);
  return bestCombo;
}

function computePrimiera(cards: readonly ItalianCard[]): number {
  const suits: readonly ItalianCard['suit'][] = ['coppe', 'denari', 'spade', 'bastoni'];
  let total = 0;
  for (const s of suits) {
    const best = cards
      .filter((c) => c.suit === s)
      .reduce((max, c) => Math.max(max, PRIMIERA_SCORE[c.rank] ?? 0), 0);
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

export const scopaEngine: MiniGameEngine<ScopaState, ScopaAction> = {
  mode: 'scopa',
  label: 'Scopa Classica',
  minPlayers: 2,
  maxPlayers: 4,

  createInitialState(matchId, playerIds, seed = Date.now()) {
    const order = playerIds.slice(0, 4);
    const deck = createDeck40(seed);
    const hands: Record<string, ItalianCard[]> = {};
    const captured: Record<string, ItalianCard[]> = {};
    const scopaCounts: Record<string, number> = {};
    const scores: Record<string, number> = {};
    for (const pid of order) {
      hands[pid] = deck.splice(0, 3);
      captured[pid] = [];
      scopaCounts[pid] = 0;
      scores[pid] = 0;
    }
    const tableCards = deck.splice(0, 4);
    return {
      matchId,
      mode: 'scopa',
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
      captured,
      scopaCounts,
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
      throw new Error(`Scopa: not ${playerId}'s turn`);
    }
    const hand = [...(state.hands[playerId] ?? [])];
    const idx = hand.findIndex((c) => c.id === action.cardId);
    if (idx < 0) throw new Error('Scopa: card not in hand');
    const [played] = hand.splice(idx, 1);
    if (!played) throw new Error('Scopa: missing card');

    let tableCards = [...state.tableCards];
    const captured: Record<string, ItalianCard[]> = Object.fromEntries(
      Object.entries(state.captured).map(([k, v]) => [k, [...v]]),
    );
    const scopaCounts = { ...state.scopaCounts };
    let lastCapturerId = state.lastCapturerId;

    const match = findBestTableCapture(tableCards, played.rank);
    const stock = [...state.stock];
    const nextHands: Record<string, ItalianCard[]> = Object.fromEntries(
      state.playerOrder.map((pid) => [pid, pid === playerId ? hand : [...(state.hands[pid] ?? [])]]),
    );

    const allHandsEmptyAfterMove = state.playerOrder.every(
      (pid) => (nextHands[pid] ?? []).length === 0,
    );
    const isVeryLastMove = allHandsEmptyAfterMove && stock.length === 0;

    if (match.length > 0) {
      const takenIds = new Set(match.map((c) => c.id));
      tableCards = tableCards.filter((c) => !takenIds.has(c.id));
      captured[playerId] = [...(captured[playerId] ?? []), ...match, played];
      lastCapturerId = playerId;
      if (tableCards.length === 0 && !isVeryLastMove) {
        scopaCounts[playerId] = (scopaCounts[playerId] ?? 0) + 1;
      }
    } else {
      tableCards.push(played);
    }

    if (allHandsEmptyAfterMove && stock.length > 0) {
      for (const pid of state.playerOrder) {
        nextHands[pid] = stock.splice(0, 3);
      }
    }

    if (isVeryLastMove) {
      if (lastCapturerId && tableCards.length > 0) {
        captured[lastCapturerId] = [...(captured[lastCapturerId] ?? []), ...tableCards];
        tableCards = [];
      }
      const scores: Record<string, number> = Object.fromEntries(
        state.playerOrder.map((pid) => [pid, scopaCounts[pid] ?? 0]),
      );
      // Settebello (7 di denari)
      for (const pid of state.playerOrder) {
        if ((captured[pid] ?? []).some((c) => c.suit === 'denari' && c.rank === 7)) {
          scores[pid] = (scores[pid] ?? 0) + 1;
        }
      }
      // Carte, Denari, Primiera (maggioranza stretta)
      const awardMajority = (metric: (pid: string) => number): void => {
        const ranked = state.playerOrder
          .map((pid) => ({ pid, val: metric(pid) }))
          .sort((a, b) => b.val - a.val);
        if (ranked[0] && (!ranked[1] || ranked[0].val > ranked[1].val)) {
          scores[ranked[0].pid] = (scores[ranked[0].pid] ?? 0) + 1;
        }
      };
      awardMajority((pid) => (captured[pid] ?? []).length);
      awardMajority((pid) => (captured[pid] ?? []).filter((c) => c.suit === 'denari').length);
      awardMajority((pid) => computePrimiera(captured[pid] ?? []));

      const winnerId =
        [...state.playerOrder].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))[0] ?? null;
      return {
        ...state,
        stock,
        tableCards,
        hands: nextHands,
        captured,
        scopaCounts,
        lastCapturerId,
        phase: 'finished',
        winnerId,
        scores,
      };
    }

    return {
      ...state,
      stock,
      tableCards,
      hands: nextHands,
      captured,
      scopaCounts,
      lastCapturerId,
      currentTurnIndex: (state.currentTurnIndex + 1) % state.playerOrder.length,
      round: state.round + (state.currentTurnIndex + 1 >= state.playerOrder.length ? 1 : 0),
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
      tableCards: state.tableCards,
      scopaCounts: state.scopaCounts,
      capturedCounts: Object.fromEntries(
        state.playerOrder.map((pid) => [pid, (state.captured[pid] ?? []).length]),
      ),
      myHand: state.hands[viewerId] ?? [],
    };
  },
};
