// ============================================================
// UNO ULTRA — AI profile CONS (accumula speciali per il finale)
// ============================================================

import type { UnoCard } from "../../types/card.js";
import type { UnoColor } from "../../constants/cards.js";
import type { EngineState } from "../uno/state.js";

const ENDGAME_HAND_SIZE = 3;

const ENDGAME_SCORES: Record<string, number> = {
  number: 20, skip: 70, reverse: 60, draw2: 80, wild: 60, wild_draw4: 90,
};

const EARLY_SCORES: Record<string, number> = {
  number: 50, skip: 5, reverse: 5, draw2: 5, wild: 0, wild_draw4: 0,
};

export function score(card: UnoCard, state: EngineState, playerId: string): number {
  const player = state.players.get(playerId);
  if (!player) return 0;
  const table = player.hand.length <= ENDGAME_HAND_SIZE ? ENDGAME_SCORES : EARLY_SCORES;
  return table[card.kind] ?? 0;
}

export function chooseColor(state: EngineState, playerId: string): UnoColor {
  const player = state.players.get(playerId);
  if (!player) return "red";
  const counts: Record<UnoColor, number> = { red: 0, yellow: 0, green: 0, blue: 0 };
  for (const c of player.hand) {
    if (c.color === "wild") continue;
    counts[c.color as UnoColor]++;
  }
  let best: UnoColor = "red";
  let bestCount = -1;
  for (const color of Object.keys(counts) as UnoColor[]) {
    if ((counts[color] ?? 0) > bestCount) {
      best = color;
      bestCount = counts[color] ?? 0;
    }
  }
  return best;
}