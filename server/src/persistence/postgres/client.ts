// ============================================================
// UNO ULTRA Server — PostgreSQL connection pool (parameterized)
// ============================================================

import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

let pool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      database: env.POSTGRES_DB,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on('error', (err) => {
      logger.error({ err }, 'PostgreSQL pool idle client error');
    });
  }
  return pool;
}

/** Esegue una query SQL parametrizzata ($1, $2, ...). */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: readonly unknown[]
): Promise<QueryResult<T>> {
  const client = getPostgresPool();
  return params ? client.query<T>(text, [...params]) : client.query<T>(text);
}

/** Health check leggero per /api/health. */
export async function checkPostgresHealth(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export async function closePostgres(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
