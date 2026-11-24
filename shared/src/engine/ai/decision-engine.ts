// ============================================================
// UNO ULTRA — AI decision engine
// ============================================================

import type { MatchAction } from "../../types/match.js";
import { type AIProfile, type AIDifficulty, AI_THINK_MS } from "../../types/player.js";
import type { UnoCard } from "../../types/card.js";
import type { UnoColor } from "../../constants/cards.js";
import { getPlayableCards } from "../uno/rules.js";
import type { EngineState } from "../uno/state.js";
import * as aggressive from "./profile-aggressive.js";
import * as conservative from "./profile-conservative.js";
import * as strategic from "./profile-strategic.js";

interface ProfileImpl {
  score(card: UnoCard, state: EngineState, playerId: string): number;
  chooseColor(state: EngineState, playerId: string): UnoColor;
}

const PROFILES: Record<AIProfile, ProfileImpl> = {
  AGGR: aggressive,
  CONS: conservative,
  STRAT: strategic,
};

/** Decide la prossima azione del bot. Puro e deterministico. */
export function decideAction(state: EngineState, playerId: string): MatchAction {
  const player = state.players.get(playerId);
  if (!player) throw new Error(`AI: unknown player ${playerId}`);

  if (player.hand.length === 1 && !player.hasCalledUno) {
    return { type: "call_uno" };
  }

  const topCard = state.discardPile[0] ?? null;
  const playable = getPlayableCards(
    player.hand,
    topCard,
    state.activeColor,
    state.pendingDrawCount,
    state.rules,
  );

  if (playable.length === 0) {
    return { type: "draw_card" };
  }

  const profileKey = (player.aiProfile !== "" ? player.aiProfile : "STRAT") as AIProfile;
  const impl: ProfileImpl = PROFILES[profileKey] ?? PROFILES["STRAT"]!;

  let best = playable[0]!;
  let bestScore = impl.score(best, state, playerId);
  for (let i = 1; i < playable.length; i++) {
    const candidate = playable[i]!;
    const s = impl.score(candidate, state, playerId);
    if (s > bestScore) {
      best = candidate;
      bestScore = s;
    }
  }

  if (best.color === "wild") {
    const color = impl.chooseColor(state, playerId);
    return { type: "play_card", cardId: best.id, chosenColor: color };
  }
  return { type: "play_card", cardId: best.id };
}

/** Latenza di riflessione in ms (non-pura: usa Math.random). */
export function getThinkDelayMs(difficulty: AIDifficulty): number {
  const range = AI_THINK_MS[difficulty];
  const min = range[0];
  const max = range[1];
  return min + Math.random() * (max - min);
}