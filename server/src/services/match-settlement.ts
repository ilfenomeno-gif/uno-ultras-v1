// ============================================================
// UNO ULTRA Server — Authoritative Match Settlement Orchestrator
// ============================================================

import { logger } from '../config/logger.js';
import { settleRankedMatchForPlayers } from '../matchmaking/mmr.js';
import { addBattleCardXp } from '../persistence/postgres/repositories/battle-card.js';
import { incrementChallengeMetricsBatch } from '../persistence/postgres/repositories/challenges.js';
import {
  recordFinishedMatch,
  type MatchParticipantRecord,
} from '../persistence/postgres/repositories/matches.js';
import { findPlayerById } from '../persistence/postgres/repositories/players.js';
import { applyBalanceDelta } from '../persistence/postgres/repositories/transactions.js';
import { metrics } from '../observability/metrics.js';

export interface FinishedParticipantInput {
  readonly id: string;
  readonly username: string;
  readonly isBot: boolean;
  readonly score: number;
  readonly cardsPlayed?: number;
  readonly unoCalls?: number;
  readonly drawStacks?: number;
}

export interface SettleFinishedMatchInput {
  readonly matchId: string;
  readonly mode: string;
  readonly variant?: string;
  readonly isRanked: boolean;
  readonly winnerId: string;
  readonly turnCount: number;
  readonly durationSec: number;
  readonly participants: readonly FinishedParticipantInput[];
  readonly replaySeed?: number;
  readonly replayEvents?: readonly Record<string, unknown>[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function settleFinishedMatch(input: SettleFinishedMatchInput): Promise<void> {
  try {
    const rankedHumans = new Map<string, { mmr: number; username: string }>();

    for (const p of input.participants) {
      if (p.isBot || !UUID_RE.test(p.id)) continue;
      try {
        const row = await findPlayerById(p.id);
        if (row) rankedHumans.set(p.id, { mmr: Number(row.mmr), username: row.username });
      } catch {
        // Ignore individual DB lookup failure
      }
    }

    const mmrUpdates = new Map<string, { before: number; after: number; delta: number }>();
    if (input.isRanked && rankedHumans.size > 0) {
      const settlements = await settleRankedMatchForPlayers({
        winnerId: input.winnerId,
        participants: input.participants.map((p) => ({
          playerId: p.id,
          username: rankedHumans.get(p.id)?.username ?? p.username,
          mmr: rankedHumans.get(p.id)?.mmr ?? 400,
          isBot: p.isBot || !UUID_RE.test(p.id),
        })),
      });
      for (const s of settlements) {
        mmrUpdates.set(s.playerId, { before: s.mmrBefore, after: s.mmrAfter, delta: s.delta });
      }
    }

    const sorted = [...input.participants].sort((a, b) => {
      if (a.id === input.winnerId) return -1;
      if (b.id === input.winnerId) return 1;
      return b.score - a.score;
    });

    const participantRecords: MatchParticipantRecord[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i]!;
      const placement = i + 1;
      const won = p.id === input.winnerId;
      const isPersistedHuman = !p.isBot && UUID_RE.test(p.id) && rankedHumans.has(p.id);
      const vcardEarned = isPersistedHuman ? (won ? 35 : 10) : 0;
      const xpEarned = isPersistedHuman ? (won ? 250 : 100) : 0;
      const mmrInfo = mmrUpdates.get(p.id);

      participantRecords.push({
        ...(isPersistedHuman ? { playerId: p.id } : { botName: p.username }),
        isBot: !isPersistedHuman,
        placement,
        score: p.score,
        mmrBefore: mmrInfo?.before ?? 0,
        mmrAfter: mmrInfo?.after ?? 0,
        mmrDelta: mmrInfo?.delta ?? 0,
        vcardEarned,
        xpEarned,
      });

      if (isPersistedHuman) {
        try {
          await applyBalanceDelta({
            playerId: p.id,
            txType: 'match_reward',
            currency: 'vcard',
            delta: vcardEarned,
            referenceId: `${input.mode}:${input.matchId}`,
            idempotencyKey: `match:${input.matchId}:${p.id}`,
          });
          await addBattleCardXp(p.id, xpEarned);
          await incrementChallengeMetricsBatch(p.id, {
            matches_played: 1,
            matches_won: won ? 1 : 0,
            cards_played: p.cardsPlayed ?? 0,
            uno_calls: p.unoCalls ?? 0,
            draw_stacks: p.drawStacks ?? 0,
          });
        } catch (err) {
          logger.warn({ err, playerId: p.id, matchId: input.matchId }, 'Match reward update failed');
        }
      }
    }

    const winnerObj = input.participants.find((p) => p.id === input.winnerId);
    const persistedWinnerId =
      winnerObj && !winnerObj.isBot && UUID_RE.test(winnerObj.id) && rankedHumans.has(winnerObj.id)
        ? winnerObj.id
        : undefined;

    await recordFinishedMatch({
      mode: input.mode,
      variant: input.variant ?? 'standard',
      isRanked: input.isRanked,
      ...(persistedWinnerId !== undefined ? { winnerId: persistedWinnerId } : {}),
      winnerLabel: winnerObj?.username ?? input.winnerId,
      turnCount: input.turnCount,
      durationSec: input.durationSec,
      participants: participantRecords,
      ...(input.replaySeed !== undefined ? { replaySeed: input.replaySeed } : {}),
      ...(input.replayEvents !== undefined ? { replayEvents: input.replayEvents } : {}),
    });

    metrics.inc('matches_settled_total');
  } catch (err) {
    logger.warn({ err, matchId: input.matchId }, 'settleFinishedMatch failed (non-fatal)');
  }
}
