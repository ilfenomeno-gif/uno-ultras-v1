// ============================================================
// UNO ULTRA — AI profile STRAT (mantiene flessibilita, traccia colori)
// ============================================================

import type { UnoCard } from "../../types/card.js";
import type { UnoColor } from "../../constants/cards.js";
import type { EngineState } from "../uno/state.js";

const BASE_SCORES: Record<string, number> = {
  number: 30, skip: 50, reverse: 40, draw2: 70, wild: 20, wild_draw4: 60,
};

export function score(card: UnoCard, state: EngineState, _playerId: string): number {
  let s = BASE_SCORES[card.kind] ?? 0;

  if (card.color !== "wild" && card.color === state.activeColor) s += 10;

  const n = state.turnOrder.length;
  const nextIdx = ((state.currentTurnIndex + state.direction) % n + n) % n;
  const nextId = state.turnOrder[nextIdx];
  if (nextId) {
    const next = state.players.get(nextId);
    if (next && next.hand.length === 1) s += 20;
  }
  return s;
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