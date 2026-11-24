// ============================================================
// UNO ULTRA — Adaptive ELO calculation engine
// ============================================================

import { getKBase, getRankFromMMR, RANK_TIERS } from '../../constants/ranks.js';
import type { EloCalculationInput, EloCalculationResult } from '../../types/rank.js';

const ELO_CLAMP_MIN = -50;
const ELO_CLAMP_MAX = 50;

/**
 * Probabilita attesa di vittoria:
 * E = 1 / (1 + 10^((R_opp - R_me) / 400))
 */
export function expectedScore(playerMMR: number, opponentMMR: number): number {
  return 1 / (1 + 10 ** ((opponentMMR - playerMMR) / 400));
}

/**
 * K-Factor effettivo:
 * K_eff = K_base + (|ΔR| > 150 ? 5 : 0) + (|ΔR| > 300 ? 10 : 0)
 */
export function computeEffectiveK(playerMMR: number, opponentMMR: number): number {
  const kBase = getKBase(playerMMR);
  const absGap = Math.abs(opponentMMR - playerMMR);
  const bonus150 = absGap > 150 ? 5 : 0;
  const bonus300 = absGap > 300 ? 10 : 0;
  return kBase + bonus150 + bonus300;
}

function getMinWinGuardrail(playerMMR: number): number {
  if (playerMMR >= 1600) return 8;
  if (playerMMR >= 1200) return 6;
  return 5;
}

function getMaxLossGuardrail(playerMMR: number): number {
  if (playerMMR >= 1600) return 12;
  if (playerMMR >= 1400) return 18;
  if (playerMMR >= 1000) return 25;
  return 40;
}

/**
 * Calcola il delta MMR adattivo secondo la formula ufficiale UNO ULTRA:
 *   Δ_raw   = round(K_eff * (S - E)) + upsetBonus
 *   Δ_final = clamp(Δ_guardrailed, -50, +50)
 */
export function calculateEloDelta(input: EloCalculationInput): EloCalculationResult {
  const playerMMR = Math.max(0, input.playerMMR);
  const opponentMMR = Math.max(0, input.opponentMMR);
  const multiplier = input.playlistMultiplier ?? 1;

  const expected = expectedScore(playerMMR, opponentMMR);
  const kBase = getKBase(playerMMR);
  const kEff = computeEffectiveK(playerMMR, opponentMMR);
  const score = input.won ? 1 : 0;

  const diff = opponentMMR - playerMMR;
  let upsetBonus = 0;
  if (input.won && diff > 400) {
    upsetBonus = 10;
  } else if (!input.won && -diff > 400) {
    upsetBonus = -10;
  }

  const deltaRaw = Math.round(kEff * (score - expected) * multiplier) + upsetBonus;

  let deltaGuarded: number;
  if (input.won) {
    const minWin = getMinWinGuardrail(playerMMR);
    deltaGuarded = Math.max(minWin, deltaRaw);
  } else {
    const maxLoss = getMaxLossGuardrail(playerMMR);
    deltaGuarded = Math.max(-maxLoss, Math.min(-1, deltaRaw));
  }

  const delta = Math.max(ELO_CLAMP_MIN, Math.min(ELO_CLAMP_MAX, deltaGuarded));
  const newMMR = Math.max(0, playerMMR + delta);

  const previousTier = getRankFromMMR(playerMMR);
  const newTier = getRankFromMMR(newMMR);
  const promoted = RANK_TIERS.indexOf(newTier) > RANK_TIERS.indexOf(previousTier);

  return {
    delta,
    newMMR,
    previousTier,
    newTier,
    promoted,
    kBase,
    kEff,
    expected,
    upsetBonus,
  };
}
