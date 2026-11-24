// ============================================================
// UNO ULTRA — Gemini Bot Advisor shared contracts (public-only info)
// ============================================================

import type { UnoColor } from '../../constants/cards.js';
import type { UnoCard } from '../../types/card.js';
import type { AIProfile } from '../../types/player.js';

export type BotIntelligenceTier = 'rookie' | 'tactical' | 'grandmaster';

export function tierFromMMR(mmr: number): BotIntelligenceTier {
  if (mmr >= 1400) return 'grandmaster';
  if (mmr >= 800) return 'tactical';
  return 'rookie';
}

export interface LegalActionSummary {
  readonly index: number;
  readonly type: 'play_card' | 'draw_card' | 'call_uno' | 'challenge_wild4';
  readonly cardLabel?: string;
  readonly chosenColor?: UnoColor;
}

/**
 * Snapshot sicuro passato a GeminiBotAdvisor:
 * - contiene SOLO la mano del bot, la cima degli scarti, i contatori pubblici e le azioni legali.
 * - NON contiene mai le mani private degli altri giocatori.
 */
export interface BotTurnObservation {
  readonly matchId: string;
  readonly botId: string;
  readonly botMMR: number;
  readonly tier: BotIntelligenceTier;
  readonly profile: AIProfile;
  readonly topCard: Pick<UnoCard, 'color' | 'kind' | 'value'> | null;
  readonly activeColor: UnoColor | null;
  readonly pendingDrawCount: number;
  readonly direction: 1 | -1;
  readonly botHand: readonly Pick<UnoCard, 'color' | 'kind' | 'value'>[];
  readonly opponentCardCounts: readonly { readonly playerId: string; readonly count: number }[];
  readonly legalActions: readonly LegalActionSummary[];
}

export interface GeminiDecisionPayload {
  readonly actionIndex: number;
  readonly source: 'gemini' | 'heuristic';
  readonly model?: string;
  readonly reasoning?: string;
  readonly latencyMs: number;
}
