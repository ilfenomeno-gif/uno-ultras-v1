// ============================================================
// UNO ULTRA — Reducer dispatcher (pure: state, action -> state)
// ============================================================

import type { MatchAction } from "../../types/match.js";
import { callUno, challengeWild4, drawCard, playCard } from "./moves.js";
import type { EngineState } from "./state.js";

export { createInitialState, startMatch, type EngineState, type EnginePlayerState } from "./state.js";

/**
 * Applica un'"'"'azione del giocatore. Puro: non muta lo stato di input.
 * @throws Error se l'"'"'azione e illegale (turno, regola, carta assente).
 */
export function applyAction(
  state: EngineState,
  playerId: string,
  action: MatchAction,
): EngineState {
  switch (action.type) {
    case "play_card":
      return playCard(state, playerId, action);
    case "draw_card":
      return drawCard(state, playerId);
    case "call_uno":
      return callUno(state, playerId);
    case "challenge_wild4":
      return challengeWild4(state, playerId);
  }
}