// ============================================================
// UNO ULTRA Server — UnoRoom message validator (Zod)
// ============================================================

import { parseMatchAction, type MatchAction } from '@uno/shared';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function validateMatchAction(raw: unknown): ValidationResult<MatchAction> {
  try {
    const value = parseMatchAction(raw);
    return { ok: true, value };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Azione di partita non valida',
    };
  }
}
