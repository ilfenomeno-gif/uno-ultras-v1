// ============================================================
// UNO ULTRA Server — GeminiBotAdvisor (Fase 3b behind feature flag)
// ============================================================
// Vincoli di sicurezza & costo:
//  • Feature flag ENABLE_GEMINI_BOTS (default false).
//  • Bypassa l'API se botMMR < 800 (usa tier rookie / euristica pura),
//    se c'e una sola mossa legale, o se GEMINI_API_KEY e assente.
//  • Riceve SOLO stato pubblico + mano del bot (mai mani altrui).
//  • Output vincolato a un indice valido in [0 .. legalActions.length - 1]
//    con timeout stretto + fallback automatico a decideAction().
// ============================================================

import {
  decideAction,
  getPlayableCards,
  tierFromMMR,
  type BotTurnObservation,
  type EngineState,
  type GeminiDecisionPayload,
  type LegalActionSummary,
  type MatchAction,
  type UnoColor,
  UNO_COLORS,
} from '@uno/shared';
import { getFeatureFlags } from '../config/feature-flags.js';
import { metrics } from '../observability/metrics.js';

export interface GeminiAdvisorOptions {
  fetchImpl?: typeof fetch;
  botMMR?: number;
}

export function buildPublicBotObservation(
  state: EngineState,
  botId: string,
  botMMR: number,
): { observation: BotTurnObservation; actions: MatchAction[] } {
  const player = state.players.get(botId);
  if (!player) throw new Error(`GeminiBotAdvisor: unknown bot ${botId}`);

  const actions: MatchAction[] = [];
  if (player.hand.length === 1 && !player.hasCalledUno) {
    actions.push({ type: 'call_uno' });
  } else {
    const topCard = state.discardPile[0] ?? null;
    const playable = getPlayableCards(
      player.hand,
      topCard,
      state.activeColor,
      state.pendingDrawCount,
      state.rules,
    );
    if (playable.length === 0) {
      actions.push({ type: 'draw_card' });
    } else {
      for (const card of playable) {
        if (card.color === 'wild') {
          const dominantColor = pickMostFrequentHandColor(player.hand);
          actions.push({ type: 'play_card', cardId: card.id, chosenColor: dominantColor });
        } else {
          actions.push({ type: 'play_card', cardId: card.id });
        }
      }
    }
  }

  const legalActions: LegalActionSummary[] = actions.map((a, index) => {
    if (a.type === 'play_card') {
      const card = player.hand.find((c) => c.id === a.cardId);
      return {
        index,
        type: 'play_card',
        cardLabel: card ? `${card.color}:${card.value}` : a.cardId,
        ...(a.chosenColor !== undefined ? { chosenColor: a.chosenColor } : {}),
      };
    }
    return { index, type: a.type };
  });

  const opponentCardCounts = [...state.players.values()]
    .filter((p) => p.id !== botId)
    .map((p) => ({ playerId: p.id, count: p.hand.length }));

  const top = state.discardPile[0] ?? null;
  const observation: BotTurnObservation = {
    matchId: state.matchId,
    botId,
    botMMR,
    tier: tierFromMMR(botMMR),
    profile: (player.aiProfile || 'STRAT') as BotTurnObservation['profile'],
    topCard: top
      ? {
          color: top.color,
          kind: top.kind,
          ...(top.value !== undefined ? { value: top.value } : {}),
        }
      : null,
    activeColor: state.activeColor,
    pendingDrawCount: state.pendingDrawCount,
    direction: state.direction,
    botHand: player.hand.map((c) => ({
      color: c.color,
      kind: c.kind,
      ...(c.value !== undefined ? { value: c.value } : {}),
    })),
    opponentCardCounts,
    legalActions,
  };

  return { observation, actions };
}

function pickMostFrequentHandColor(hand: readonly { color: string }[]): UnoColor {
  const counts: Record<UnoColor, number> = { red: 0, yellow: 0, green: 0, blue: 0 };
  for (const c of hand) {
    if (c.color !== 'wild' && c.color in counts) {
      counts[c.color as UnoColor] += 1;
    }
  }
  return ([...UNO_COLORS].sort((a, b) => counts[b] - counts[a])[0] ?? 'red');
}

export async function adviseBotMove(
  state: EngineState,
  botId: string,
  options: GeminiAdvisorOptions = {},
): Promise<{ action: MatchAction; decision: GeminiDecisionPayload }> {
  const startedAt = Date.now();
  const botMMR = options.botMMR ?? 600;
  const flags = getFeatureFlags();
  const fallbackAction = decideAction(state, botId);

  const { observation, actions } = buildPublicBotObservation(state, botId, botMMR);

  // Cost & gatekeeping guardrails
  if (
    !flags.ENABLE_GEMINI_BOTS ||
    !flags.GEMINI_API_KEY ||
    botMMR < 800 ||
    actions.length <= 1
  ) {
    metrics.inc('gemini_advisor_heuristic_total');
    return {
      action: fallbackAction,
      decision: {
        actionIndex: 0,
        source: 'heuristic',
        latencyMs: Date.now() - startedAt,
      },
    };
  }

  const fetchFn = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), flags.GEMINI_TIMEOUT_MS);

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      flags.GEMINI_MODEL,
    )}:generateContent?key=${encodeURIComponent(flags.GEMINI_API_KEY)}`;

    const prompt = [
      'You are an UNO tactical bot advisor.',
      'Choose the best legal actionIndex integer from legalActions ONLY.',
      'Respond with strict JSON: {"actionIndex": <int>, "reasoning": "<short>"}',
      `State: ${JSON.stringify(observation)}`,
    ].join('\n');

    const res = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: observation.tier === 'grandmaster' ? 0.15 : 0.35,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const parsed = JSON.parse(rawText) as { actionIndex?: unknown; reasoning?: unknown };
    const idx = typeof parsed.actionIndex === 'number' ? Math.trunc(parsed.actionIndex) : -1;

    if (idx < 0 || idx >= actions.length) {
      throw new Error(`Out-of-bounds actionIndex ${idx}`);
    }

    metrics.inc('gemini_advisor_api_success_total');
    return {
      action: actions[idx]!,
      decision: {
        actionIndex: idx,
        source: 'gemini',
        model: flags.GEMINI_MODEL,
        ...(typeof parsed.reasoning === 'string' ? { reasoning: parsed.reasoning.slice(0, 140) } : {}),
        latencyMs: Date.now() - startedAt,
      },
    };
  } catch {
    metrics.inc('gemini_advisor_fallback_total');
    return {
      action: fallbackAction,
      decision: {
        actionIndex: 0,
        source: 'heuristic',
        latencyMs: Date.now() - startedAt,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
