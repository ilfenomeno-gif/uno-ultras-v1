-- ============================================================
-- UNO ULTRA — Migration 0006: Tournaments & Brackets
-- ============================================================

CREATE TABLE IF NOT EXISTS tournaments (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kind               VARCHAR(32) NOT NULL CHECK (kind IN ('ut32', 'grand-prix', 'classico', 'pentathlon', 'ucs-ssl')),
    title              VARCHAR(120) NOT NULL,
    status             VARCHAR(24) NOT NULL DEFAULT 'registering' CHECK (status IN ('registering', 'running', 'finished', 'cancelled')),
    max_players        INTEGER NOT NULL DEFAULT 32 CHECK (max_players >= 2 AND max_players <= 64),
    entry_fee_vcard    INTEGER NOT NULL DEFAULT 0 CHECK (entry_fee_vcard >= 0),
    prize_pool_credits INTEGER NOT NULL DEFAULT 0 CHECK (prize_pool_credits >= 0),
    min_mmr            INTEGER NOT NULL DEFAULT 0,
    bracket_data       JSONB NOT NULL DEFAULT '{}'::jsonb,
    champion_id        UUID REFERENCES players(id) ON DELETE SET NULL,
    starts_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    finished_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments (status, starts_at);

CREATE TABLE IF NOT EXISTS tournament_participants (
    tournament_id  UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id      UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    seed_rank      INTEGER NOT NULL DEFAULT 0,
    eliminated     BOOLEAN NOT NULL DEFAULT FALSE,
    placement      INTEGER,
    points         INTEGER NOT NULL DEFAULT 0,
    joined_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tournament_id, player_id)
);

CREATE TABLE IF NOT EXISTS tournament_matches (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id  UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number   INTEGER NOT NULL CHECK (round_number >= 1),
    wing           VARCHAR(16) NOT NULL DEFAULT 'left' CHECK (wing IN ('left', 'right', 'final')),
    slot_index     INTEGER NOT NULL CHECK (slot_index >= 0),
    player_a_id    UUID REFERENCES players(id) ON DELETE SET NULL,
    player_b_id    UUID REFERENCES players(id) ON DELETE SET NULL,
    winner_id      UUID REFERENCES players(id) ON DELETE SET NULL,
    status         VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'finished')),
    UNIQUE (tournament_id, round_number, wing, slot_index)
);
