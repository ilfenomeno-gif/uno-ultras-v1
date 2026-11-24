// ============================================================
// UNO ULTRA Server — Daily & Weekly Challenges Repository
// ============================================================

import {
  DAILY_CHALLENGES_POOL,
  SEASONAL_CHALLENGES_POOL,
  WEEKLY_CHALLENGES_POOL,
  type ChallengeDefinition,
  type ChallengePeriod,
} from '@uno/shared';
import { getPostgresPool, query } from '../client.js';
import { addBattleCardXp } from './battle-card.js';

export interface PlayerChallengeStatus {
  definition: ChallengeDefinition;
  progress: number;
  claimed: boolean;
  resetsAt: Date;
}

const ALL_CHALLENGES: readonly ChallengeDefinition[] = [
  ...DAILY_CHALLENGES_POOL,
  ...WEEKLY_CHALLENGES_POOL,
  ...SEASONAL_CHALLENGES_POOL,
];

function computeResetDate(period: ChallengePeriod): Date {
  const now = new Date();
  if (period === 'daily') {
    const next = new Date(now);
    next.setUTCHours(24, 0, 0, 0);
    return next;
  }
  if (period === 'seasonal') {
    const next = new Date(now);
    next.setUTCDate(now.getUTCDate() + 90);
    next.setUTCHours(0, 0, 0, 0);
    return next;
  }
  const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntilMonday);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

export async function getOrInitPlayerChallenges(
  playerId: string,
): Promise<PlayerChallengeStatus[]> {
  const ids = ALL_CHALLENGES.map((c) => c.id);
  const periods = ALL_CHALLENGES.map((c) => c.period);
  const targets = ALL_CHALLENGES.map((c) => c.target);
  const resets = ALL_CHALLENGES.map((c) => computeResetDate(c.period).toISOString());

  await query(
    `INSERT INTO player_challenges (player_id, challenge_id, period, progress, target, resets_at)
     SELECT $1, u.challenge_id, u.period, 0, u.target, u.resets_at
       FROM UNNEST($2::varchar[], $3::varchar[], $4::integer[], $5::timestamptz[])
            AS u(challenge_id, period, target, resets_at)
     ON CONFLICT (player_id, challenge_id)
     DO UPDATE SET
       progress  = CASE WHEN player_challenges.resets_at <= NOW() THEN 0 ELSE player_challenges.progress END,
       claimed   = CASE WHEN player_challenges.resets_at <= NOW() THEN FALSE ELSE player_challenges.claimed END,
       resets_at = CASE WHEN player_challenges.resets_at <= NOW() THEN EXCLUDED.resets_at ELSE player_challenges.resets_at END`,
    [playerId, ids, periods, targets, resets],
  );

  const res = await query<{
    challenge_id: string;
    progress: number;
    claimed: boolean;
    resets_at: Date;
  }>(
    `SELECT challenge_id, progress, claimed, resets_at
       FROM player_challenges
      WHERE player_id = $1`,
    [playerId],
  );
  const byId = new Map(res.rows.map((r) => [r.challenge_id, r]));

  return ALL_CHALLENGES.map((def) => {
    const row = byId.get(def.id);
    return {
      definition: def,
      progress: Number(row?.progress ?? 0),
      claimed: Boolean(row?.claimed ?? false),
      resetsAt: row?.resets_at ?? computeResetDate(def.period),
    };
  });
}

export async function incrementChallengeMetricsBatch(
  playerId: string,
  deltas: Partial<Record<ChallengeDefinition['metric'], number>>,
): Promise<void> {
  const challengeIds: string[] = [];
  const increments: number[] = [];
  for (const ch of ALL_CHALLENGES) {
    const d = deltas[ch.metric] ?? 0;
    if (d > 0) {
      challengeIds.push(ch.id);
      increments.push(Math.floor(d));
    }
  }
  if (challengeIds.length === 0) return;

  await getOrInitPlayerChallenges(playerId);
  await query(
    `UPDATE player_challenges pc
        SET progress = LEAST(pc.target, pc.progress + u.delta),
            updated_at = NOW()
       FROM UNNEST($2::varchar[], $3::integer[]) AS u(challenge_id, delta)
      WHERE pc.player_id = $1
        AND pc.challenge_id = u.challenge_id`,
    [playerId, challengeIds, increments],
  );
}

export async function incrementChallengeMetric(
  playerId: string,
  metric: ChallengeDefinition['metric'],
  delta: number,
): Promise<void> {
  if (delta <= 0) return;
  await incrementChallengeMetricsBatch(playerId, { [metric]: delta });
}

export async function claimChallengeReward(
  playerId: string,
  challengeId: string,
): Promise<{ challengeId: string; rewardVCard: number; rewardXp: number; vcardAfter: number }> {
  const def = ALL_CHALLENGES.find((c) => c.id === challengeId);
  if (!def) throw new Error(`Sfida inesistente: ${challengeId}`);

  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const rowRes = await client.query<{ progress: number; target: number; claimed: boolean }>(
      `SELECT progress, target, claimed
         FROM player_challenges
        WHERE player_id = $1 AND challenge_id = $2
        FOR UPDATE`,
      [playerId, challengeId],
    );
    const row = rowRes.rows[0];
    if (!row) throw new Error('Sfida non inizializzata');
    if (row.claimed) throw new Error('Ricompensa gia riscattata');
    if (Number(row.progress) < Number(row.target)) {
      throw new Error(`Sfida incompleta (${row.progress}/${row.target})`);
    }

    await client.query(
      `UPDATE player_challenges SET claimed = TRUE, updated_at = NOW()
        WHERE player_id = $1 AND challenge_id = $2`,
      [playerId, challengeId],
    );

    const pRes = await client.query<{ vcard: number }>(
      `UPDATE players
          SET vcard = vcard + $1, updated_at = NOW()
        WHERE id = $2
      RETURNING vcard`,
      [def.rewardVCard, playerId],
    );
    const vcardAfter = Number(pRes.rows[0]?.vcard ?? 0);

    await client.query(
      `INSERT INTO economy_transactions (player_id, tx_type, currency, amount_delta, balance_after, reference_id)
       VALUES ($1, 'challenge_reward', 'vcard', $2, $3, $4)`,
      [playerId, def.rewardVCard, vcardAfter, challengeId],
    );
    await client.query('COMMIT');

    await addBattleCardXp(playerId, def.rewardXp);
    return {
      challengeId,
      rewardVCard: def.rewardVCard,
      rewardXp: def.rewardXp,
      vcardAfter,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
