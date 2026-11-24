// ============================================================
// UNO ULTRA — Pure move handlers (playCard, drawCard, callUno, challenge)
// ============================================================

import type { UnoColor } from "../../constants/cards.js";
import { drawCards } from "./deck.js";
import { canPlay, isWildCard } from "./rules.js";
import type { EngineState } from "./state.js";
import type { MatchAction } from "../../types/match.js";

// ---------- helpers ----------

function nextTurnIndex(state: EngineState, steps = 1): number {
  const n = state.turnOrder.length;
  return (((state.currentTurnIndex + state.direction * steps) % n) + n) % n;
}

function cloneState(state: EngineState): EngineState {
  return {
    ...state,
    players: new Map(
      [...state.players].map(([id, p]) => [id, { ...p, hand: [...p.hand] }]),
    ),
    turnOrder: [...state.turnOrder],
    deck: [...state.deck],
    discardPile: [...state.discardPile],
  };
}

function assertPlaying(state: EngineState): void {
  if (state.phase !== "playing") throw new Error("Match is not in playing phase");
}

function assertTurn(state: EngineState, playerId: string): void {
  const currentId = state.turnOrder[state.currentTurnIndex];
  if (playerId !== currentId) throw new Error("Not your turn");
}

// ---------- move: play_card ----------

export function playCard(
  state: EngineState,
  playerId: string,
  action: Extract<MatchAction, { type: "play_card" }>,
): EngineState {
  assertPlaying(state);
  assertTurn(state, playerId);

  const player = state.players.get(playerId);
  if (!player) throw new Error("Unknown player");

  const cardIdx = player.hand.findIndex((c) => c.id === action.cardId);
  if (cardIdx < 0) throw new Error("Card not in hand");
  const card = player.hand[cardIdx]!;

  const topCard = state.discardPile[0] ?? null;
  if (!canPlay(card, topCard, state.activeColor, player.hand, state.pendingDrawCount, state.rules)) {
    throw new Error("Illegal play");
  }
  if (isWildCard(card) && !action.chosenColor) {
    throw new Error("Wild requires chosenColor");
  }

  const next = cloneState(state);
  const nextPlayer = next.players.get(playerId)!;
  nextPlayer.hand.splice(cardIdx, 1);
  next.discardPile.unshift(card);
  next.activeColor = isWildCard(card) ? action.chosenColor! : (card.color as UnoColor);
  nextPlayer.hasCalledUno = false;
  next.lastWildDraw4PlayerId = null;

  // Applica effetto carta
  switch (card.kind) {
    case "skip":
      next.currentTurnIndex = nextTurnIndex(next, 2);
      break;
    case "reverse":
      next.direction = next.direction === 1 ? -1 : 1;
      next.currentTurnIndex = nextTurnIndex(
        next,
        next.turnOrder.length === 2 ? 2 : 1,
      );
      break;
    case "draw2":
      next.pendingDrawCount = Math.min(next.rules.stackingCap, next.pendingDrawCount + 2);
      next.currentTurnIndex = nextTurnIndex(next, 1);
      break;
    case "wild_draw4": {
      const hadColor =
        state.activeColor !== null &&
        player.hand.some((c) => c.color === state.activeColor);
      next.lastWildDraw4PlayerId = playerId;
      next.lastWildDraw4WasLegal = !hadColor;
      next.pendingDrawCount = Math.min(next.rules.stackingCap, next.pendingDrawCount + 4);
      next.currentTurnIndex = nextTurnIndex(next, 1);
      break;
    }
    default:
      next.currentTurnIndex = nextTurnIndex(next, 1);
  }

  // Condizione di vittoria
  if (nextPlayer.hand.length === 0) {
    next.phase = "finished";
    next.winnerId = playerId;
  }

  return next;
}

// ---------- move: draw_card ----------

export function drawCard(state: EngineState, playerId: string): EngineState {
  assertPlaying(state);
  assertTurn(state, playerId);

  const next = cloneState(state);
  const player = next.players.get(playerId)!;

  const toDraw = next.pendingDrawCount > 0 ? next.pendingDrawCount : 1;
  const result = drawCards(next.deck, next.discardPile, toDraw, next.seed++);
  player.hand.push(...result.drawn);
  next.deck = result.newDeck;
  next.discardPile = result.newDiscard;
  next.pendingDrawCount = 0;
  next.lastWildDraw4PlayerId = null;
  next.currentTurnIndex = nextTurnIndex(next, 1);

  return next;
}

// ---------- move: call_uno ----------

export function callUno(state: EngineState, playerId: string): EngineState {
  const next = cloneState(state);
  const player = next.players.get(playerId);
  if (!player) throw new Error("Unknown player");
  if (player.hand.length !== 1) {
    throw new Error("Cannot call UNO with more than 1 card");
  }
  player.hasCalledUno = true;
  return next;
}

// ---------- move: challenge_wild4 ----------

export function challengeWild4(state: EngineState, challengerId: string): EngineState {
  assertPlaying(state);
  assertTurn(state, challengerId);
  if (!state.lastWildDraw4PlayerId) throw new Error("No wild4 to challenge");
  if (!state.rules.wildDraw4Challenge) throw new Error("Challenge disabled by rules");

  const next = cloneState(state);
  const challenger = next.players.get(challengerId)!;
  const challengedId = state.lastWildDraw4PlayerId;

  if (state.lastWildDraw4WasLegal) {
    // Challenge fallisce: challenger pesca 6 (4 + 2 penalita) e passa
    const result = drawCards(next.deck, next.discardPile, 6, next.seed++);
    challenger.hand.push(...result.drawn);
    next.deck = result.newDeck;
    next.discardPile = result.newDiscard;
    next.currentTurnIndex = nextTurnIndex(next, 1);
  } else {
    // Challenge riesce: il wild4 player pesca 4, il turno resta al challenger
    const wild4Player = next.players.get(challengedId)!;
    const result = drawCards(next.deck, next.discardPile, 4, next.seed++);
    wild4Player.hand.push(...result.drawn);
    next.deck = result.newDeck;
    next.discardPile = result.newDiscard;
  }

  next.pendingDrawCount = 0;
  next.lastWildDraw4PlayerId = null;
  return next;
}