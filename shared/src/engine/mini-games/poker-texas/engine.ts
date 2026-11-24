// ============================================================
// UNO ULTRA — Poker Texas Hold'em (2-4 players, 4-street No-Limit)
// ============================================================

import {
  createDeck52,
  type MiniGameEngine,
  type MiniGameStateBase,
  type StandardCard,
} from '../mini-game-contract.js';

export type PokerAction =
  | { readonly type: 'fold' }
  | { readonly type: 'check_call' }
  | { readonly type: 'raise'; readonly amount: number };

export type PokerStreet = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface PokerTexasState extends MiniGameStateBase {
  readonly deck: readonly StandardCard[];
  readonly communityCards: readonly StandardCard[];
  readonly holeCards: Readonly<Record<string, readonly StandardCard[]>>;
  readonly chips: Readonly<Record<string, number>>;
  readonly bets: Readonly<Record<string, number>>;
  readonly folded: Readonly<Record<string, boolean>>;
  readonly actedInStreet: Readonly<Record<string, boolean>>;
  readonly pot: number;
  readonly currentBet: number;
  readonly street: PokerStreet;
}

/** Valuta forza mano a 7 carte (rank 0..8 * 1e6 + tiebreaker). */
export function evaluateBestPokerScore(cards: readonly StandardCard[]): number {
  const ranks = cards.map((c) => (c.rank === 1 ? 14 : c.rank)).sort((a, b) => b - a);
  const rankCounts = new Map<number, number>();
  const suitCounts = new Map<string, number[]>();
  for (const c of cards) {
    const r = c.rank === 1 ? 14 : c.rank;
    rankCounts.set(r, (rankCounts.get(r) ?? 0) + 1);
    const list = suitCounts.get(c.suit) ?? [];
    list.push(r);
    suitCounts.set(c.suit, list);
  }
  const counts = [...rankCounts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flushSuit = [...suitCounts.values()].find((arr) => arr.length >= 5);

  const uniqueSorted = [...new Set(ranks)].sort((a, b) => b - a);
  if (uniqueSorted.includes(14)) uniqueSorted.push(1);
  let straightHigh = 0;
  for (let i = 0; i <= uniqueSorted.length - 5; i++) {
    if (uniqueSorted[i]! - uniqueSorted[i + 4]! === 4) {
      straightHigh = uniqueSorted[i]!;
      break;
    }
  }

  const highCard = ranks[0] ?? 0;
  if (flushSuit && straightHigh > 0) return 8_000_000 + straightHigh;
  if ((counts[0]?.[1] ?? 0) === 4) return 7_000_000 + (counts[0]?.[0] ?? 0) * 100 + highCard;
  if ((counts[0]?.[1] ?? 0) === 3 && (counts[1]?.[1] ?? 0) >= 2) {
    return 6_000_000 + (counts[0]?.[0] ?? 0) * 100 + (counts[1]?.[0] ?? 0);
  }
  if (flushSuit) return 5_000_000 + Math.max(...flushSuit);
  if (straightHigh > 0) return 4_000_000 + straightHigh;
  if ((counts[0]?.[1] ?? 0) === 3) return 3_000_000 + (counts[0]?.[0] ?? 0) * 100 + highCard;
  if ((counts[0]?.[1] ?? 0) === 2 && (counts[1]?.[1] ?? 0) === 2) {
    return 2_000_000 + (counts[0]?.[0] ?? 0) * 100 + (counts[1]?.[0] ?? 0);
  }
  if ((counts[0]?.[1] ?? 0) === 2) return 1_000_000 + (counts[0]?.[0] ?? 0) * 100 + highCard;
  return highCard;
}

function advancePoker(state: PokerTexasState): PokerTexasState {
  const active = state.playerOrder.filter((pid) => !state.folded[pid]);
  if (active.length <= 1) {
    const winnerId = active[0] ?? null;
    const chips = { ...state.chips };
    if (winnerId) chips[winnerId] = (chips[winnerId] ?? 0) + state.pot;
    return {
      ...state,
      chips,
      scores: chips,
      street: 'showdown',
      phase: 'finished',
      winnerId,
    };
  }

  const allMatchedAndActed = active.every(
    (pid) =>
      state.actedInStreet[pid] &&
      ((state.bets[pid] ?? 0) === state.currentBet || (state.chips[pid] ?? 0) === 0),
  );

  if (!allMatchedAndActed) {
    let nextIdx = (state.currentTurnIndex + 1) % state.playerOrder.length;
    while (state.folded[state.playerOrder[nextIdx]!]) {
      nextIdx = (nextIdx + 1) % state.playerOrder.length;
    }
    return { ...state, currentTurnIndex: nextIdx };
  }

  // Avanza street
  const deck = [...state.deck];
  const communityCards = [...state.communityCards];
  let nextStreet: PokerStreet = state.street;
  if (state.street === 'preflop') {
    communityCards.push(...deck.splice(0, 3));
    nextStreet = 'flop';
  } else if (state.street === 'flop') {
    communityCards.push(...deck.splice(0, 1));
    nextStreet = 'turn';
  } else if (state.street === 'turn') {
    communityCards.push(...deck.splice(0, 1));
    nextStreet = 'river';
  } else {
    // Showdown
    const evaluated = active.map((pid) => ({
      pid,
      score: evaluateBestPokerScore([...(state.holeCards[pid] ?? []), ...communityCards]),
    }));
    evaluated.sort((a, b) => b.score - a.score);
    const winnerId = evaluated[0]?.pid ?? null;
    const chips = { ...state.chips };
    if (winnerId) chips[winnerId] = (chips[winnerId] ?? 0) + state.pot;
    return {
      ...state,
      chips,
      scores: chips,
      street: 'showdown',
      phase: 'finished',
      winnerId,
    };
  }

  const resetBets = Object.fromEntries(state.playerOrder.map((pid) => [pid, 0]));
  const resetActed = Object.fromEntries(state.playerOrder.map((pid) => [pid, false]));
  const firstActiveIdx = state.playerOrder.findIndex((pid) => !state.folded[pid]);
  return {
    ...state,
    deck,
    communityCards,
    bets: resetBets,
    actedInStreet: resetActed,
    currentBet: 0,
    street: nextStreet,
    currentTurnIndex: Math.max(0, firstActiveIdx),
  };
}

export const pokerTexasEngine: MiniGameEngine<PokerTexasState, PokerAction> = {
  mode: 'poker-texas',
  label: "Poker Texas Hold'em",
  minPlayers: 2,
  maxPlayers: 4,

  createInitialState(matchId, playerIds, seed = Date.now()) {
    const order = playerIds.slice(0, 4);
    const deck = createDeck52(seed);
    const holeCards: Record<string, StandardCard[]> = {};
    const chips: Record<string, number> = {};
    const bets: Record<string, number> = {};
    const folded: Record<string, boolean> = {};
    const actedInStreet: Record<string, boolean> = {};

    let pot = 0;
    order.forEach((pid, idx) => {
      holeCards[pid] = deck.splice(0, 2);
      const blind = idx === 0 ? 10 : idx === 1 ? 20 : 0;
      chips[pid] = 1000 - blind;
      bets[pid] = blind;
      pot += blind;
      folded[pid] = false;
      actedInStreet[pid] = false;
    });

    return {
      matchId,
      mode: 'poker-texas',
      seed,
      playerOrder: order,
      currentTurnIndex: order.length > 2 ? 2 : 0,
      round: 1,
      phase: 'playing',
      winnerId: null,
      scores: chips,
      deck,
      communityCards: [],
      holeCards,
      chips,
      bets,
      folded,
      actedInStreet,
      pot,
      currentBet: 20,
      street: 'preflop',
    };
  },

  getLegalActions(state, playerId) {
    if (state.phase !== 'playing' || state.playerOrder[state.currentTurnIndex] !== playerId) {
      return [];
    }
    const acts: PokerAction[] = [{ type: 'fold' }, { type: 'check_call' }];
    if ((state.chips[playerId] ?? 0) > 20) {
      acts.push({ type: 'raise', amount: 40 });
    }
    return acts;
  },

  applyAction(state, playerId, action) {
    if (state.phase !== 'playing' || state.playerOrder[state.currentTurnIndex] !== playerId) {
      throw new Error(`Poker: not ${playerId}'s turn`);
    }
    const chips = { ...state.chips };
    const bets = { ...state.bets };
    const folded = { ...state.folded };
    const actedInStreet = { ...state.actedInStreet, [playerId]: true };
    let pot = state.pot;
    let currentBet = state.currentBet;

    if (action.type === 'fold') {
      folded[playerId] = true;
    } else if (action.type === 'check_call') {
      const toCall = Math.min(chips[playerId] ?? 0, Math.max(0, currentBet - (bets[playerId] ?? 0)));
      chips[playerId] = (chips[playerId] ?? 0) - toCall;
      bets[playerId] = (bets[playerId] ?? 0) + toCall;
      pot += toCall;
    } else {
      const raiseBy = Math.max(20, action.amount);
      const targetBet = currentBet + raiseBy;
      const needed = Math.min(chips[playerId] ?? 0, targetBet - (bets[playerId] ?? 0));
      chips[playerId] = (chips[playerId] ?? 0) - needed;
      bets[playerId] = (bets[playerId] ?? 0) + needed;
      pot += needed;
      if ((bets[playerId] ?? 0) > currentBet) {
        currentBet = bets[playerId]!;
      }
    }

    return advancePoker({
      ...state,
      chips,
      bets,
      folded,
      actedInStreet,
      pot,
      currentBet,
      scores: chips,
    });
  },

  getPublicView(state, viewerId) {
    return {
      matchId: state.matchId,
      mode: state.mode,
      phase: state.phase,
      street: state.street,
      currentPlayerId: state.playerOrder[state.currentTurnIndex] ?? null,
      winnerId: state.winnerId,
      pot: state.pot,
      currentBet: state.currentBet,
      communityCards: state.communityCards,
      chips: state.chips,
      bets: state.bets,
      folded: state.folded,
      myHoleCards: state.holeCards[viewerId] ?? [],
    };
  },
};
