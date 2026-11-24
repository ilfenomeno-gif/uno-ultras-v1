// ============================================================
// UNO ULTRA — EngineState (autoritativo, include mani private)
// ============================================================
// Distinto da `MatchState` (types/match.ts) che e la vista PUBBLICA
// inviata ai client. EngineState non deve mai essere serializzato
// verso il client cosi com'"'"'e.

import type { UnoColor } from "../../constants/cards.js";
import { DEFAULT_UNO_RULES, type UnoRules } from "../../constants/rules.js";
import type { UnoCard } from "../../types/card.js";
import type { AIProfile } from "../../types/player.js";
import { createUnoDeck, drawCards, shuffleDeck } from "./deck.js";

export interface EnginePlayerState {
  id: string;
  username: string;
  hand: UnoCard[];
  hasCalledUno: boolean;
  isBot: boolean;
  aiProfile: AIProfile | "";
  isConnected: boolean;
}

export type EnginePhase = "lobby" | "dealing" | "playing" | "finished";

export interface EngineState {
  matchId: string;
  players: Map<string, EnginePlayerState>;
  turnOrder: string[];
  currentTurnIndex: number;
  direction: 1 | -1;

  deck: UnoCard[];
  /** Pila di scarto: discardPile[0] e la carta in cima. */
  discardPile: UnoCard[];
  activeColor: UnoColor | null;
  pendingDrawCount: number;

  rules: UnoRules;
  phase: EnginePhase;
  winnerId: string | null;

  /** Seed incrementale per drawCards (replay deterministico). */
  seed: number;

  /** Ultimo wild4 giocato — per la challenge. */
  lastWildDraw4PlayerId: string | null;
  /** true se il wild4 era legale al momento del play. */
  lastWildDraw4WasLegal: boolean;
}

export interface CreateInitialStateOpts {
  matchId: string;
  players: ReadonlyArray<{
    id: string;
    username: string;
    isBot?: boolean;
    aiProfile?: AIProfile;
  }>;
  rules?: Partial<UnoRules>;
  seed: number;
}

export function createInitialState(opts: CreateInitialStateOpts): EngineState {
  const rules: UnoRules = { ...DEFAULT_UNO_RULES, ...opts.rules };
  const deck = shuffleDeck(createUnoDeck(), opts.seed);
  const players = new Map<string, EnginePlayerState>();
  for (const p of opts.players) {
    players.set(p.id, {
      id: p.id,
      username: p.username,
      hand: [],
      hasCalledUno: false,
      isBot: p.isBot ?? false,
      aiProfile: p.aiProfile ?? "",
      isConnected: true,
    });
  }

  return {
    matchId: opts.matchId,
    players,
    turnOrder: opts.players.map((p) => p.id),
    currentTurnIndex: 0,
    direction: 1,
    deck,
    discardPile: [],
    activeColor: null,
    pendingDrawCount: 0,
    rules,
    phase: "lobby",
    winnerId: null,
    seed: opts.seed + 1,
    lastWildDraw4PlayerId: null,
    lastWildDraw4WasLegal: true,
  };
}

/** Distribuisce le mani iniziali e apre la partita. */
export function startMatch(state: EngineState): EngineState {
  if (state.phase !== "lobby") throw new Error("Match already started");

  const players = new Map(
    [...state.players].map(([id, p]) => [id, { ...p, hand: [] as UnoCard[] }]),
  );
  let deck = [...state.deck];
  let discardPile: UnoCard[] = [];
  let seed = state.seed;

  for (const playerId of state.turnOrder) {
    const result = drawCards(deck, discardPile, state.rules.initialHandSize, seed++);
    players.get(playerId)!.hand = result.drawn;
    deck = result.newDeck;
    discardPile = result.newDiscard;
  }

  // Pesca la prima carta non-wild come inizio scarto
  let topCard: UnoCard | null = null;
  const skippedWilds: UnoCard[] = [];
  while (deck.length > 0) {
    const candidate = deck.pop()!;
    if (candidate.kind !== "wild" && candidate.kind !== "wild_draw4") {
      topCard = candidate;
      break;
    }
    skippedWilds.push(candidate);
  }
  if (!topCard) throw new Error("No valid starting card");

  return {
    ...state,
    players,
    deck: [...deck, ...skippedWilds],
    discardPile: [topCard],
    activeColor: topCard.color as UnoColor,
    phase: "playing",
    seed,
  };
}