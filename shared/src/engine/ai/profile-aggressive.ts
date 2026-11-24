// ============================================================
// UNO ULTRA — AI profile AGGR (pressione immediata)
// ============================================================

import type { UnoCard } from "../../types/card.js";
import type { UnoColor } from "../../constants/cards.js";
import type { EngineState } from "../uno/state.js";

const BASE_SCORES: Record<string, number> = {
  number: 10,
  skip: 60,
  reverse: 45,
  draw2: 80,
  wild: 40,
  wild_draw4: 75,
};

export function score(card: UnoCard, state: EngineState, _playerId: string): number {
  let s = BASE_SCORES[card.kind] ?? 0;

  const n = state.turnOrder.length;
  const nextIdx = ((state.currentTurnIndex + state.direction) % n + n) % n;
  const nextId = state.turnOrder[nextIdx];
  if (nextId) {
    const next = state.players.get(nextId);
    if (next && next.hand.length <= 2) {
      if (card.kind === "draw2") s += 40;
      else if (card.kind === "wild_draw4") s += 50;
      else if (card.kind === "skip") s += 30;
    }
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