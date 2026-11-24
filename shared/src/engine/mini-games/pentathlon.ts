// ============================================================
// UNO ULTRA — Pentathlon (5-event championship F1 scoring)
// ============================================================

import type { GameMode } from '../../constants/game-modes.js';

export const PENTATHLON_SEQUENCE: readonly GameMode[] = [
  'uno',
  'blackjack',
  'scala40',
  'scopa',
  'poker-texas',
];

const F1_POINTS = [25, 18, 15, 12] as const;

export interface PentathlonEventResult {
  readonly eventIndex: number;
  readonly mode: GameMode;
  readonly standings: readonly string[]; // 1st .. 4th playerId
}

export interface PentathlonMatchState {
  readonly tournamentId: string;
  readonly playerIds: readonly string[];
  readonly completedEvents: readonly PentathlonEventResult[];
  readonly totals: Readonly<Record<string, number>>;
  readonly currentEventIndex: number;
  readonly currentMode: GameMode | null;
  readonly championId: string | null;
}

export function createPentathlonMatch(
  tournamentId: string,
  playerIds: readonly string[],
): PentathlonMatchState {
  const totals = Object.fromEntries(playerIds.map((pid) => [pid, 0]));
  return {
    tournamentId,
    playerIds,
    completedEvents: [],
    totals,
    currentEventIndex: 0,
    currentMode: PENTATHLON_SEQUENCE[0] ?? null,
    championId: null,
  };
}

export function recordPentathlonEvent(
  state: PentathlonMatchState,
  standings: readonly string[],
): PentathlonMatchState {
  if (state.currentEventIndex >= PENTATHLON_SEQUENCE.length) {
    return state;
  }
  const mode = PENTATHLON_SEQUENCE[state.currentEventIndex]!;
  const totals = { ...state.totals };
  standings.forEach((pid, rankIdx) => {
    const pts = F1_POINTS[rankIdx] ?? 5;
    totals[pid] = (totals[pid] ?? 0) + pts;
  });

  const completedEvents = [
    ...state.completedEvents,
    { eventIndex: state.currentEventIndex, mode, standings },
  ];
  const nextIdx = state.currentEventIndex + 1;
  const done = nextIdx >= PENTATHLON_SEQUENCE.length;
  const championId = done
    ? [...state.playerIds].sort((a, b) => (totals[b] ?? 0) - (totals[a] ?? 0))[0] ?? null
    : null;

  return {
    ...state,
    completedEvents,
    totals,
    currentEventIndex: nextIdx,
    currentMode: done ? null : (PENTATHLON_SEQUENCE[nextIdx] ?? null),
    championId,
  };
}
