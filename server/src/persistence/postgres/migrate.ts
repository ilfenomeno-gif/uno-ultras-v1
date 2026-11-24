// ============================================================
// UNO ULTRA Server — Idempotent PostgreSQL Migration Runner
// ============================================================

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPostgresPool } from './client.js';
import { logger } from '../../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resolveMigrationsDir(overrideDir?: string): Promise<string> {
  if (overrideDir) return overrideDir;
  const adjacent = path.join(__dirname, 'migrations');
  try {
    await fs.access(adjacent);
    return adjacent;
  } catch {
    return path.resolve(__dirname, '../../../src/persistence/postgres/migrations');
  }
}

const MIGRATIONS_LOCK_KEY = 78234109;

export async function runMigrations(migrationsDir?: string): Promise<string[]> {
  const dir = await resolveMigrationsDir(migrationsDir);
  const pool = getPostgresPool();
  const client = await pool.connect();
  const executed: string[] = [];

  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATIONS_LOCK_KEY]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const entries = await fs.readdir(dir, { withFileTypes: true });
    const sqlFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith('.sql'))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    for (const filename of sqlFiles) {
      const check = await client.query<{ filename: string }>(
        'SELECT filename FROM schema_migrations WHERE filename = $1 LIMIT 1',
        [filename]
      );
      if (check.rowCount && check.rowCount > 0) {
        continue;
      }

      const sql = await fs.readFile(path.join(dir, filename), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
        executed.push(filename);
        logger.info({ filename }, 'Applied SQL migration');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATIONS_LOCK_KEY]);
    } catch {
      // ignore unlock error on closed connection
    }
    client.release();
  }

  return executed;
}
