-- UNO ULTRA — Database initialization (first container start only)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS players (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username           VARCHAR(50) UNIQUE NOT NULL,
    password_hash      VARCHAR(255) NOT NULL,
    email              VARCHAR(255) UNIQUE,
    rank_tier          VARCHAR(30) NOT NULL DEFAULT 'Bronze I',
    mmr                INTEGER NOT NULL DEFAULT 0 CHECK (mmr >= 0),
    vcard              INTEGER NOT NULL DEFAULT 0,
    battle_card_level  INTEGER NOT NULL DEFAULT 1,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_username ON players (username);
CREATE INDEX IF NOT EXISTS idx_players_mmr      ON players (mmr DESC);

-- Additional tables (inventory, matches, tournaments, battle_card)
-- will be added via migrations in server/src/persistence/postgres/migrations/