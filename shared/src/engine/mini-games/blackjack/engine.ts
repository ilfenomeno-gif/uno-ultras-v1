// ============================================================
// UNO ULTRA — Blackjack (1-4 players vs Dealer)
// ============================================================

import {
  createDeck52,
  type MiniGameEngine,
  type MiniGameStateBase,
  type StandardCard,
} from '../mini-game-contract.js';

export type BlackjackAction = { readonly type: 'hit' } | { readonly type: 'stand' } | { readonly type: 'double' };

export interface BlackjackState extends MiniGameStateBase {
  readonly deck: readonly StandardCard[];
  readonly hands: Readonly<Record<string, readonly StandardCard[]>>;
  readonly dealerHand: readonly StandardCard[];
  readonly stood: Readonly<Record<string, boolean>>;
  readonly doubled: Readonly<Record<string, boolean>>;
}

export function scoreBlackjackHand(cards: readonly StandardCard[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === 1) {
      aces += 1;
      total += 11;
    } else if (c.rank >= 10) {
      total += 10;
    } else {
      total += c.rank;
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 };
}

function advanceBlackjackTurn(
  state: BlackjackState,
): BlackjackState {
  const order = state.playerOrder;
  let nextIdx = state.currentTurnIndex + 1;
  while (nextIdx < order.length) {
    const pid = order[nextIdx]!;
    if (!state.stood[pid]) {
      return { ...state, currentTurnIndex: nextIdx };
    }
    nextIdx += 1;
  }
  // Tutti i giocatori hanno finito: gioca il banco fino a >= 17
  const deck = [...state.deck];
  const dealer = [...state.dealerHand];
  while (scoreBlackjackHand(dealer).total < 17 && deck.length > 0) {
    dealer.push(deck.shift()!);
  }
  const dealerScore = scoreBlackjackHand(dealer).total;
  const scores: Record<string, number> = { ...state.scores };
  let bestPid: string | null = null;
  let bestMargin = -999;

  for (const pid of order) {
    const pScore = scoreBlackjackHand(state.hands[pid] ?? []).total;
    const mult = state.doubled[pid] ? 2 : 1;
    if (pScore > 21) {
      scores[pid] = (scores[pid] ?? 0) - 10 * mult;
    } else if (dealerScore > 21 || pScore > dealerScore) {
      scores[pid] = (scores[pid] ?? 0) + 15 * mult;
      if (pScore - (dealerScore > 21 ? 0 : dealerScore) > bestMargin) {
        bestMargin = pScore;
        bestPid = pid;
      }
    } else if (pScore === dealerScore) {
      scores[pid] = (scores[pid] ?? 0) + 5;
      if (bestPid === null) bestPid = pid;
    }
  }
  if (bestPid === null && order.length > 0) {
    bestPid = [...order].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))[0] ?? null;
  }

  return {
    ...state,
    deck,
    dealerHand: dealer,
    phase: 'finished',
    winnerId: bestPid,
    scores,
  };
}

export const blackjackEngine: MiniGameEngine<BlackjackState, BlackjackAction> = {
  mode: 'blackjack',
  label: 'Blackjack 21',
  minPlayers: 1,
  maxPlayers: 4,

  createInitialState(matchId, playerIds, seed = Date.now()) {
    const order = playerIds.slice(0, 4);
    const deck = createDeck52(seed);
    const hands: Record<string, StandardCard[]> = {};
    const stood: Record<string, boolean> = {};
    const doubled: Record<string, boolean> = {};
    const scores: Record<string, number> = {};

    for (const pid of order) {
      const c1 = deck.shift()!;
      const c2 = deck.shift()!;
      hands[pid] = [c1, c2];
      const total = scoreBlackjackHand(hands[pid]!).total;
      stood[pid] = total === 21;
      doubled[pid] = false;
      scores[pid] = total === 21 ? 21 : 0;
    }
    const dealerHand = [deck.shift()!, deck.shift()!];
    const base: BlackjackState = {
      matchId,
      mode: 'blackjack',
      seed,
      playerOrder: order,
      currentTurnIndex: 0,
      round: 1,
      phase: 'playing',
      winnerId: null,
      scores,
      deck,
      hands,
      dealerHand,
      stood,
      doubled,
    };
    const firstPid = order[0];
    if (firstPid && stood[firstPid]) {
      return advanceBlackjackTurn(base);
    }
    return base;
  },

  getLegalActions(state, playerId) {
    if (state.phase !== 'playing') return [];
    if (state.playerOrder[state.currentTurnIndex] !== playerId) return [];
    const hand = state.hands[playerId] ?? [];
    if (state.stood[playerId] || scoreBlackjackHand(hand).total >= 21) return [];
    const actions: BlackjackAction[] = [{ type: 'hit' }, { type: 'stand' }];
    if (hand.length === 2 && state.deck.length > 0) actions.push({ type: 'double' });
    return actions;
  },

  applyAction(state, playerId, action) {
    if (state.phase !== 'playing' || state.playerOrder[state.currentTurnIndex] !== playerId) {
      throw new Error(`Blackjack: not ${playerId}'s turn`);
    }
    const deck = [...state.deck];
    const hand = [...(state.hands[playerId] ?? [])];
    const stood = { ...state.stood };
    const doubled = { ...state.doubled };

    if (action.type === 'hit') {
      const card = deck.shift();
      if (card) hand.push(card);
      if (scoreBlackjackHand(hand).total >= 21) {
        stood[playerId] = true;
      }
    } else if (action.type === 'double') {
      const card = deck.shift();
      if (card) hand.push(card);
      doubled[playerId] = true;
      stood[playerId] = true;
    } else {
      stood[playerId] = true;
    }

    const updated: BlackjackState = {
      ...state,
      deck,
      hands: { ...state.hands, [playerId]: hand },
      stood,
      doubled,
    };
    return stood[playerId] ? advanceBlackjackTurn(updated) : updated;
  },

  getPublicView(state, viewerId) {
    const visibleDealer =
      state.phase === 'finished' ? state.dealerHand : state.dealerHand.slice(0, 1);
    const handCounts = Object.fromEntries(
      state.playerOrder.map((pid) => [pid, (state.hands[pid] ?? []).length]),
    );
    return {
      matchId: state.matchId,
      mode: state.mode,
      phase: state.phase,
      currentPlayerId: state.playerOrder[state.currentTurnIndex] ?? null,
      winnerId: state.winnerId,
      scores: state.scores,
      handCounts,
      myHand: state.hands[viewerId] ?? [],
      dealerCards: visibleDealer,
      dealerHiddenCount: state.dealerHand.length - visibleDealer.length,
    };
  },
};
