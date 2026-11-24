// ============================================================
// UNO ULTRA — Configurable rule parameters (shared contract)
// ============================================================

export interface UnoRules {
  /** Cap di stacking cumulativo per +2/+4 (default 20). */
  stackingCap: number;
  /** Overload che causa auto-sconfitta (default 30). */
  stackingOverload: number;
  /** Se true, +4 puo essere contestato con challenge. */
  wildDraw4Challenge: boolean;
  /** Se true, Wild Draw 4 puo essere giocato solo senza colore in mano. */
  wildDraw4Strict: boolean;
  /** Se true, +2 puo essere risposto con altro +2 (stacking attivo). */
  draw2Stacking: boolean;
  /** Se true, +4 puo essere risposto con +4 (stacking attivo). */
  draw4Stacking: boolean;
  /** Se true, il primo giocatore puo giocare su una carta iniziale random. */
  forcePlayOnStart: boolean;
  /** Secondi di timeout per turno (0 = nessun timeout). */
  turnTimeoutSeconds: number;
  /** Numero di carte iniziali per giocatore (default 7). */
  initialHandSize: number;
}

export const DEFAULT_UNO_RULES: UnoRules = {
  stackingCap: 20,
  stackingOverload: 30,
  wildDraw4Challenge: true,
  wildDraw4Strict: true,
  draw2Stacking: true,
  draw4Stacking: true,
  forcePlayOnStart: true,
  turnTimeoutSeconds: 30,
  initialHandSize: 7,
};