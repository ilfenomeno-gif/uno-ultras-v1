// ============================================================
// UNO ULTRA — Card constants (108-card standard deck)
// ============================================================

/** I 4 colori ufficiali + wild. */
export const UNO_COLORS = ['red', 'yellow', 'green', 'blue'] as const;
export type UnoColor = (typeof UNO_COLORS)[number];

/** Colori giocabili (include wild come colore-agnostico). */
export type PlayableColor = UnoColor | 'wild';

/** Tipi di carta fisica. */
export const UNO_CARD_KINDS = [
  'number',
  'skip',
  'reverse',
  'draw2',
  'wild',
  'wild_draw4',
] as const;
export type UnoCardKind = (typeof UNO_CARD_KINDS)[number];

/** Valori numerici validi (0–9). */
export const UNO_NUMERIC_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type UnoNumericValue = (typeof UNO_NUMERIC_VALUES)[number];

/** Dimensione totale del mazzo standard (108). */
export const UNO_DECK_SIZE = 108 as const;

/** Soglia di punti per "UNO!" (una sola carta in mano). */
export const UNO_CALL_THRESHOLD = 1 as const;

/** Penalità per mancato "UNO!". */
export const UNO_PENALTY_DRAW = 2 as const;