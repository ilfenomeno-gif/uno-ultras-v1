// ============================================================
// UNO ULTRA — Validatori Zod: azioni di partita (MatchAction)
// ============================================================

import { z } from 'zod';
import { UNO_COLORS } from '../../constants/cards.js';
import type { MatchAction } from '../../types/match.js';

// ── Schema discriminato per le 4 azioni possibili ────────────

const PlayCardSchema = z.object({
  type: z.literal('play_card'),
  cardId: z.string().min(1),
  /**
   * Colore scelto per wild/wild_draw4.
   * exactOptionalPropertyTypes: il campo è assente quando non fornito.
   */
  chosenColor: z.enum(UNO_COLORS).optional(),
});

const DrawCardSchema = z.object({
  type: z.literal('draw_card'),
});

const CallUnoSchema = z.object({
  type: z.literal('call_uno'),
});

const ChallengeWild4Schema = z.object({
  type: z.literal('challenge_wild4'),
});

export const MatchActionSchema = z.discriminatedUnion('type', [
  PlayCardSchema,
  DrawCardSchema,
  CallUnoSchema,
  ChallengeWild4Schema,
]);

// ── Helper di parsing ────────────────────────────────────────

/**
 * Valida e converte un payload grezzo in MatchAction.
 * Gestisce exactOptionalPropertyTypes evitando `chosenColor: undefined`.
 */
export function parseMatchAction(raw: unknown): MatchAction {
  const result = MatchActionSchema.parse(raw);
  if (result.type === 'play_card') {
    if (result.chosenColor !== undefined) {
      return {
        type: 'play_card',
        cardId: result.cardId,
        chosenColor: result.chosenColor,
      };
    }
    return {
      type: 'play_card',
      cardId: result.cardId,
    };
  }
  return result;
}

export type ParsedMatchAction = z.infer<typeof MatchActionSchema>;
