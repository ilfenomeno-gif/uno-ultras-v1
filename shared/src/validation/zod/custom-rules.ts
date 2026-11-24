// ============================================================
// UNO ULTRA — Custom Rules, Blitz, Chaos & Team Presets (Zod)
// ============================================================

import { z } from 'zod';
import { DEFAULT_UNO_RULES, type UnoRules } from '../../constants/rules.js';

export const MATCH_VARIANTS = ['standard', 'blitz', 'chaos', 'team', 'custom'] as const;
export type MatchVariant = (typeof MATCH_VARIANTS)[number];

export interface CustomMatchConfig {
  readonly variant: MatchVariant;
  readonly rules: UnoRules;
  readonly teamPlay: boolean;
  readonly allowSpectators: boolean;
  readonly allowRematch: boolean;
  readonly chaosFlipIntervalTurns: number;
}

export const CustomRulesSchema = z.object({
  stackingCap: z.number().int().min(0).max(50).default(DEFAULT_UNO_RULES.stackingCap),
  stackingOverload: z.number().int().min(4).max(80).default(DEFAULT_UNO_RULES.stackingOverload),
  wildDraw4Challenge: z.boolean().default(DEFAULT_UNO_RULES.wildDraw4Challenge),
  wildDraw4Strict: z.boolean().default(DEFAULT_UNO_RULES.wildDraw4Strict),
  draw2Stacking: z.boolean().default(DEFAULT_UNO_RULES.draw2Stacking),
  draw4Stacking: z.boolean().default(DEFAULT_UNO_RULES.draw4Stacking),
  forcePlayOnStart: z.boolean().default(DEFAULT_UNO_RULES.forcePlayOnStart),
  turnTimeoutSeconds: z.number().int().min(0).max(120).default(DEFAULT_UNO_RULES.turnTimeoutSeconds),
  initialHandSize: z.number().int().min(3).max(15).default(DEFAULT_UNO_RULES.initialHandSize),
});

export const CustomMatchConfigSchema = z.object({
  variant: z.enum(MATCH_VARIANTS).default('standard'),
  rules: CustomRulesSchema.default(DEFAULT_UNO_RULES),
  teamPlay: z.boolean().default(false),
  allowSpectators: z.boolean().default(true),
  allowRematch: z.boolean().default(true),
  chaosFlipIntervalTurns: z.number().int().min(0).max(20).default(0),
});

export const VARIANT_PRESETS: Record<MatchVariant, CustomMatchConfig> = {
  standard: {
    variant: 'standard',
    rules: { ...DEFAULT_UNO_RULES },
    teamPlay: false,
    allowSpectators: true,
    allowRematch: true,
    chaosFlipIntervalTurns: 0,
  },
  blitz: {
    variant: 'blitz',
    rules: {
      ...DEFAULT_UNO_RULES,
      turnTimeoutSeconds: 10,
      initialHandSize: 5,
      stackingCap: 16,
    },
    teamPlay: false,
    allowSpectators: true,
    allowRematch: true,
    chaosFlipIntervalTurns: 0,
  },
  chaos: {
    variant: 'chaos',
    rules: {
      ...DEFAULT_UNO_RULES,
      stackingCap: 40,
      stackingOverload: 50,
      wildDraw4Strict: false,
      turnTimeoutSeconds: 20,
      initialHandSize: 9,
    },
    teamPlay: false,
    allowSpectators: true,
    allowRematch: true,
    chaosFlipIntervalTurns: 4,
  },
  team: {
    variant: 'team',
    rules: {
      ...DEFAULT_UNO_RULES,
      turnTimeoutSeconds: 25,
    },
    teamPlay: true,
    allowSpectators: true,
    allowRematch: true,
    chaosFlipIntervalTurns: 0,
  },
  custom: {
    variant: 'custom',
    rules: { ...DEFAULT_UNO_RULES },
    teamPlay: false,
    allowSpectators: true,
    allowRematch: true,
    chaosFlipIntervalTurns: 0,
  },
};

export interface PresetValidationResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly config?: CustomMatchConfig;
}

/** Valida configurazione custom o preset in base al numero giocatori. */
export function validatePresetForPlayers(
  raw: unknown,
  playerCount: number,
): PresetValidationResult {
  const parsed = CustomMatchConfigSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid custom rules' };
  }
  const cfg = parsed.data;
  if (cfg.rules.stackingOverload < cfg.rules.stackingCap) {
    return {
      ok: false,
      error: 'stackingOverload deve essere >= stackingCap',
    };
  }
  if ((cfg.variant === 'team' || cfg.teamPlay) && playerCount !== 4) {
    return {
      ok: false,
      error: 'La modalita Team 2v2 richiede esattamente 4 giocatori',
    };
  }
  if (cfg.variant === 'blitz' && cfg.rules.turnTimeoutSeconds > 15) {
    return {
      ok: false,
      error: 'La modalita Blitz richiede turnTimeoutSeconds <= 15',
    };
  }
  return { ok: true, config: cfg };
}
