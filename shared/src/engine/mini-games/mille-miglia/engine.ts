// ============================================================
// UNO ULTRA — Mille Miglia (2-4 players, 1000 km race with hazards & safeties)
// ============================================================

import {
  shuffleWithSeed,
  type MiniGameEngine,
  type MiniGameStateBase,
} from '../mini-game-contract.js';

export type MilleCardKind =
  | { readonly category: 'distance'; readonly km: 25 | 50 | 75 | 100 | 200 }
  | { readonly category: 'hazard'; readonly hazard: 'stop' | 'out_of_gas' | 'flat_tire' }
  | { readonly category: 'remedy'; readonly remedy: 'roll' | 'gasoline' | 'spare_tire' }
  | { readonly category: 'safety'; readonly safety: 'driving_ace' | 'extra_tank' | 'puncture_proof' };

export interface MilleCard {
  readonly id: string;
  readonly spec: MilleCardKind;
}

export type MilleAction =
  | { readonly type: 'play_distance'; readonly cardId: string }
  | { readonly type: 'play_remedy'; readonly cardId: string }
  | { readonly type: 'play_safety'; readonly cardId: string }
  | { readonly type: 'play_hazard'; readonly cardId: string; readonly targetPlayerId: string }
  | { readonly type: 'discard'; readonly cardId: string };

export interface MilleMigliaState extends MiniGameStateBase {
  readonly deck: readonly MilleCard[];
  readonly hands: Readonly<Record<string, readonly MilleCard[]>>;
  readonly distances: Readonly<Record<string, number>>;
  readonly activeHazard: Readonly<Record<string, 'stop' | 'out_of_gas' | 'flat_tire' | null>>;
  readonly safeties: Readonly<Record<string, readonly string[]>>;
}

function createMilleDeck(seed: number): MilleCard[] {
  const cards: MilleCard[] = [];
  let seq = 0;
  const push = (count: number, spec: MilleCardKind): void => {
    for (let i = 0; i < count; i++) {
      seq += 1;
      cards.push({ id: `mille_${seq}`, spec });
    }
  };
  push(10, { category: 'distance', km: 25 });
  push(10, { category: 'distance', km: 50 });
  push(10, { category: 'distance', km: 75 });
  push(12, { category: 'distance', km: 100 });
  push(4, { category: 'distance', km: 200 });
  push(5, { category: 'hazard', hazard: 'stop' });
  push(3, { category: 'hazard', hazard: 'out_of_gas' });
  push(3, { category: 'hazard', hazard: 'flat_tire' });
  push(14, { category: 'remedy', remedy: 'roll' });
  push(6, { category: 'remedy', remedy: 'gasoline' });
  push(6, { category: 'remedy', remedy: 'spare_tire' });
  push(2, { category: 'safety', safety: 'driving_ace' });
  push(2, { category: 'safety', safety: 'extra_tank' });
  push(2, { category: 'safety', safety: 'puncture_proof' });
  return shuffleWithSeed(cards, seed);
}

const REMEDY_FOR_HAZARD: Record<string, string> = {
  stop: 'roll',
  out_of_gas: 'gasoline',
  flat_tire: 'spare_tire',
};

const SAFETY_FOR_HAZARD: Record<string, string> = {
  stop: 'driving_ace',
  out_of_gas: 'extra_tank',
  flat_tire: 'puncture_proof',
};

export const milleMigliaEngine: MiniGameEngine<MilleMigliaState, MilleAction> = {
  mode: 'mille-miglia',
  label: 'Mille Miglia 1000',
  minPlayers: 2,
  maxPlayers: 4,

  createInitialState(matchId, playerIds, seed = Date.now()) {
    const order = playerIds.slice(0, 4);
    const deck = createMilleDeck(seed);
    const hands: Record<string, MilleCard[]> = {};
    const distances: Record<string, number> = {};
    const activeHazard: Record<string, 'stop' | 'out_of_gas' | 'flat_tire' | null> = {};
    const safeties: Record<string, string[]> = {};

    for (const pid of order) {
      hands[pid] = deck.splice(0, 6);
      distances[pid] = 0;
      activeHazard[pid] = null;
      safeties[pid] = [];
    }
    return {
      matchId,
      mode: 'mille-miglia',
      seed,
      playerOrder: order,
      currentTurnIndex: 0,
      round: 1,
      phase: 'playing',
      winnerId: null,
      scores: distances,
      deck,
      hands,
      distances,
      activeHazard,
      safeties,
    };
  },

  getLegalActions(state, playerId) {
    if (state.phase !== 'playing' || state.playerOrder[state.currentTurnIndex] !== playerId) {
      return [];
    }
    const hand = state.hands[playerId] ?? [];
    const actions: MilleAction[] = [];
    const myHazard = state.activeHazard[playerId] ?? null;
    const myDist = state.distances[playerId] ?? 0;

    for (const c of hand) {
      if (c.spec.category === 'distance' && myHazard === null && myDist + c.spec.km <= 1000) {
        actions.push({ type: 'play_distance', cardId: c.id });
      } else if (
        c.spec.category === 'remedy' &&
        myHazard !== null &&
        REMEDY_FOR_HAZARD[myHazard] === c.spec.remedy
      ) {
        actions.push({ type: 'play_remedy', cardId: c.id });
      } else if (c.spec.category === 'safety') {
        actions.push({ type: 'play_safety', cardId: c.id });
      } else if (c.spec.category === 'hazard') {
        for (const opp of state.playerOrder) {
          if (opp === playerId) continue;
          const oppSafeties = state.safeties[opp] ?? [];
          if (!oppSafeties.includes(SAFETY_FOR_HAZARD[c.spec.hazard] ?? '')) {
            actions.push({ type: 'play_hazard', cardId: c.id, targetPlayerId: opp });
          }
        }
      }
      actions.push({ type: 'discard', cardId: c.id });
    }
    return actions;
  },

  applyAction(state, playerId, action) {
    if (state.phase !== 'playing' || state.playerOrder[state.currentTurnIndex] !== playerId) {
      throw new Error(`MilleMiglia: not ${playerId}'s turn`);
    }
    const deck = [...state.deck];
    const hand = [...(state.hands[playerId] ?? [])];
    const idx = hand.findIndex((c) => c.id === action.cardId);
    if (idx < 0) throw new Error('MilleMiglia: card not in hand');
    const [card] = hand.splice(idx, 1);
    if (!card) throw new Error('MilleMiglia: missing card');

    const distances = { ...state.distances };
    const activeHazard = { ...state.activeHazard };
    const safeties = Object.fromEntries(
      Object.entries(state.safeties).map(([k, v]) => [k, [...v]]),
    );

    if (action.type === 'play_distance') {
      if (card.spec.category !== 'distance' || activeHazard[playerId] !== null) {
        throw new Error('MilleMiglia: cannot advance distance');
      }
      if ((distances[playerId] ?? 0) + card.spec.km > 1000) {
        throw new Error('MilleMiglia: exceeds 1000 km');
      }
      distances[playerId] = (distances[playerId] ?? 0) + card.spec.km;
    } else if (action.type === 'play_remedy') {
      const currentHaz = activeHazard[playerId];
      if (
        card.spec.category !== 'remedy' ||
        !currentHaz ||
        REMEDY_FOR_HAZARD[currentHaz] !== card.spec.remedy
      ) {
        throw new Error('MilleMiglia: remedy mismatch');
      }
      activeHazard[playerId] = null;
    } else if (action.type === 'play_safety') {
      if (card.spec.category !== 'safety') throw new Error('MilleMiglia: not a safety');
      safeties[playerId] = [...(safeties[playerId] ?? []), card.spec.safety];
      if (activeHazard[playerId] && SAFETY_FOR_HAZARD[activeHazard[playerId]!] === card.spec.safety) {
        activeHazard[playerId] = null;
      }
    } else if (action.type === 'play_hazard') {
      if (card.spec.category !== 'hazard' || action.targetPlayerId === playerId) {
        throw new Error('MilleMiglia: invalid hazard');
      }
      const targetSafeties = safeties[action.targetPlayerId] ?? [];
      if (targetSafeties.includes(SAFETY_FOR_HAZARD[card.spec.hazard] ?? '')) {
        throw new Error('MilleMiglia: target immune via safety');
      }
      activeHazard[action.targetPlayerId] = card.spec.hazard;
    }

    if (deck.length > 0 && hand.length < 6) {
      hand.push(deck.shift()!);
    }

    const nextHands = { ...state.hands, [playerId]: hand };
    const finished =
      (distances[playerId] ?? 0) >= 1000 ||
      (deck.length === 0 && state.playerOrder.every((pid) => (nextHands[pid] ?? []).length === 0));

    if (finished) {
      const winnerId =
        (distances[playerId] ?? 0) >= 1000
          ? playerId
          : [...state.playerOrder].sort((a, b) => (distances[b] ?? 0) - (distances[a] ?? 0))[0] ??
            null;
      return {
        ...state,
        deck,
        hands: nextHands,
        distances,
        activeHazard,
        safeties,
        scores: distances,
        phase: 'finished',
        winnerId,
      };
    }

    return {
      ...state,
      deck,
      hands: nextHands,
      distances,
      activeHazard,
      safeties,
      scores: distances,
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
      distances: state.distances,
      activeHazard: state.activeHazard,
      safeties: state.safeties,
      deckCount: state.deck.length,
      myHand: state.hands[viewerId] ?? [],
    };
  },
};
