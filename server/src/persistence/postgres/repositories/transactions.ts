// ============================================================
// UNO ULTRA Server — Atomic Economy Transactions Repository
// ============================================================

import crypto from 'node:crypto';
import { getPostgresPool, query } from '../client.js';
import { canUseDevFallback, readDevState, updateDevState } from '../dev-store.js';
import { getDevPlayerSnapshot, updateDevPlayerSnapshot } from './players.js';

export type EconomyTxType =
  | 'shop_purchase'
  | 'crate_open'
  | 'duplicate_refund'
  | 'battle_card_buy'
  | 'battle_card_claim'
  | 'challenge_reward'
  | 'tournament_entry'
  | 'tournament_prize'
  | 'match_reward'
  | 'admin_grant';

export type EconomyCurrency = 'vcard' | 'tournament_credits';

export interface EconomyTransactionRow {
  id: string;
  player_id: string;
  tx_type: EconomyTxType;
  currency: EconomyCurrency;
  amount_delta: number;
  balance_after: number;
  reference_id: string | null;
  idempotency_key: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface WalletBalances {
  vcard: number;
  tournamentCredits: number;
}

export class InsufficientFundsError extends Error {
  constructor(currency: EconomyCurrency, required: number, available: number) {
    super(`Saldo ${currency} insufficiente: richiesti ${required}, disponibili ${available}`);
    this.name = 'InsufficientFundsError';
  }
}

export async function getPlayerBalances(playerId: string): Promise<WalletBalances> {
  try {
    const res = await query<{ vcard: number; tournament_credits: number }>(
      `SELECT vcard, tournament_credits
         FROM players
        WHERE id = $1 AND deleted_at IS NULL
        LIMIT 1`,
      [playerId],
    );
    const row = res.rows[0];
    if (!row) {
      throw new Error(`Player ${playerId} not found`);
    }
    return {
      vcard: Number(row.vcard),
      tournamentCredits: Number(row.tournament_credits),
    };
  } catch (err) {
    if (canUseDevFallback(err)) {
      const row = getDevPlayerSnapshot(playerId);
      if (!row) {
        throw new Error(`Player ${playerId} not found`);
      }
      const credits = readDevState().tournamentCredits[playerId] ?? 0;
      return {
        vcard: Number(row.vcard),
        tournamentCredits: Number(credits),
      };
    }
    throw err;
  }
}

/**
 * Applica una variazione atomica su `vcard` o `tournament_credits` con SELECT ... FOR UPDATE
 * e idempotenza opzionale via `idempotency_key`.
 */
export async function applyBalanceDelta(input: {
  playerId: string;
  txType: EconomyTxType;
  currency: EconomyCurrency;
  delta: number;
  referenceId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ balanceAfter: number; tx: EconomyTransactionRow; deduplicated: boolean }> {
  try {
    const pool = getPostgresPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (input.idempotencyKey) {
        const existing = await client.query<EconomyTransactionRow>(
          `SELECT id, player_id, tx_type, currency, amount_delta, balance_after,
                  reference_id, idempotency_key, metadata, created_at
             FROM economy_transactions
            WHERE idempotency_key = $1
            LIMIT 1`,
          [input.idempotencyKey],
        );
        if (existing.rows[0]) {
          await client.query('COMMIT');
          return {
            balanceAfter: Number(existing.rows[0].balance_after),
            tx: existing.rows[0],
            deduplicated: true,
          };
        }
      }

      const col = input.currency === 'vcard' ? 'vcard' : 'tournament_credits';
      const lockRes = await client.query<{ balance: number }>(
        `SELECT ${col} AS balance
           FROM players
          WHERE id = $1 AND deleted_at IS NULL
          FOR UPDATE`,
        [input.playerId],
      );
      const current = lockRes.rows[0]?.balance;
      if (current === undefined) {
        throw new Error(`Player ${input.playerId} not found`);
      }

      const nextBalance = Number(current) + input.delta;
      if (nextBalance < 0) {
        throw new InsufficientFundsError(input.currency, Math.abs(input.delta), Number(current));
      }

      await client.query(
        `UPDATE players SET ${col} = $1, updated_at = NOW() WHERE id = $2`,
        [nextBalance, input.playerId],
      );

      const txRes = await client.query<EconomyTransactionRow>(
        `INSERT INTO economy_transactions
           (player_id, tx_type, currency, amount_delta, balance_after, reference_id, idempotency_key, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
         RETURNING id, player_id, tx_type, currency, amount_delta, balance_after,
                   reference_id, idempotency_key, metadata, created_at`,
        [
          input.playerId,
          input.txType,
          input.currency,
          input.delta,
          nextBalance,
          input.referenceId ?? null,
          input.idempotencyKey ?? null,
          JSON.stringify(input.metadata ?? {}),
        ],
      );
      await client.query('COMMIT');
      return { balanceAfter: nextBalance, tx: txRes.rows[0]!, deduplicated: false };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;

    return updateDevState((state) => {
      if (input.idempotencyKey && input.idempotencyKey in state.idempotencyBalances) {
        const bal = state.idempotencyBalances[input.idempotencyKey]!;
        const existingTx = state.transactions.find((t) => t.idempotency_key === input.idempotencyKey);
        return {
          balanceAfter: bal,
          tx: existingTx
            ? {
                ...existingTx,
                tx_type: existingTx.tx_type as EconomyTxType,
                created_at: new Date(existingTx.created_at),
              }
            : {
                id: crypto.randomUUID(),
                player_id: input.playerId,
                tx_type: input.txType,
                currency: input.currency,
                amount_delta: input.delta,
                balance_after: bal,
                reference_id: input.referenceId ?? null,
                idempotency_key: input.idempotencyKey ?? null,
                metadata: input.metadata ?? {},
                created_at: new Date(),
              },
          deduplicated: true,
        };
      }

      const player = getDevPlayerSnapshot(input.playerId);
      if (!player) {
        throw new Error(`Player ${input.playerId} not found`);
      }

      const current =
        input.currency === 'vcard'
          ? Number(player.vcard)
          : Number(state.tournamentCredits[input.playerId] ?? 0);
      const nextBalance = current + input.delta;
      if (nextBalance < 0) {
        throw new InsufficientFundsError(input.currency, Math.abs(input.delta), current);
      }

      if (input.currency === 'vcard') {
        updateDevPlayerSnapshot(input.playerId, { vcard: nextBalance });
      } else {
        state.tournamentCredits[input.playerId] = nextBalance;
      }

      const now = new Date();
      const devTx = {
        id: crypto.randomUUID(),
        player_id: input.playerId,
        tx_type: input.txType,
        currency: input.currency,
        amount_delta: input.delta,
        balance_after: nextBalance,
        reference_id: input.referenceId ?? null,
        idempotency_key: input.idempotencyKey ?? null,
        metadata: input.metadata ?? {},
        created_at: now.toISOString(),
      };
      state.transactions.unshift(devTx);
      if (state.transactions.length > 500) state.transactions.length = 500;
      if (input.idempotencyKey) {
        state.idempotencyBalances[input.idempotencyKey] = nextBalance;
      }

      return {
        balanceAfter: nextBalance,
        tx: {
          ...devTx,
          tx_type: input.txType,
          created_at: now,
        },
        deduplicated: false,
      };
    });
  }
}

export async function listPlayerTransactions(
  playerId: string,
  limit = 30,
): Promise<EconomyTransactionRow[]> {
  try {
    const res = await query<EconomyTransactionRow>(
      `SELECT id, player_id, tx_type, currency, amount_delta, balance_after,
              reference_id, idempotency_key, metadata, created_at
         FROM economy_transactions
        WHERE player_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [playerId, Math.max(1, Math.min(100, limit))],
    );
    return res.rows;
  } catch (err) {
    if (canUseDevFallback(err)) {
      const cap = Math.max(1, Math.min(100, limit));
      return readDevState()
        .transactions.filter((t) => t.player_id === playerId)
        .slice(0, cap)
        .map((t) => ({
          ...t,
          tx_type: t.tx_type as EconomyTxType,
          created_at: new Date(t.created_at),
        }));
    }
    throw err;
  }
}
