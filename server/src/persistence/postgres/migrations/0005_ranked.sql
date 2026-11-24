-- ============================================================
-- UNO ULTRA — Migration 0005: Ranked Matches, History & Replays
-- ============================================================

CREATE TABLE IF NOT EXISTS matches (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mode           VARCHAR(32) NOT NULL,
    variant        VARCHAR(32) NOT NULL DEFAULT 'standard',
    is_ranked      BOOLEAN NOT NULL DEFAULT FALSE,
    status         VARCHAR(24) NOT NULL DEFAULT 'finished' CHECK (status IN ('playing', 'finished', 'aborted')),
    winner_id      UUID REFERENCES players(id) ON DELETE SET NULL,
    winner_label   VARCHAR(64),
    turn_count     INTEGER NOT NULL DEFAULT 0 CHECK (turn_count >= 0),
    duration_sec   INTEGER NOT NULL DEFAULT 0 CHECK (duration_sec >= 0),
    rules_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_matches_mode_created ON matches (mode, created_at DESC);

CREATE TABLE IF NOT EXISTS match_participants (
    id            BIGSERIAL PRIMARY KEY,
    match_id      UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id     UUID REFERENCES players(id) ON DELETE SET NULL,
    bot_name      VARCHAR(64),
    is_bot        BOOLEAN NOT NULL DEFAULT FALSE,
    placement     INTEGER NOT NULL CHECK (placement >= 1 AND placement <= 8),
    score         INTEGER NOT NULL DEFAULT 0,
    mmr_before    INTEGER NOT NULL DEFAULT 0,
    mmr_after     INTEGER NOT NULL DEFAULT 0,
    mmr_delta     INTEGER NOT NULL DEFAULT 0,
    vcard_earned  INTEGER NOT NULL DEFAULT 0,
    xp_earned     INTEGER NOT NULL DEFAULT 0,
    CHECK (player_id IS NOT NULL OR bot_name IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_match_participants_human
    ON match_participants (match_id, player_id)
    WHERE player_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_match_participants_bot
    ON match_participants (match_id, bot_name)
    WHERE bot_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_match_participants_player
    ON match_participants (player_id, match_id);

CREATE TABLE IF NOT EXISTS match_replays (
    match_id    UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
    seed        BIGINT NOT NULL DEFAULT 0,
    events      JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_mode_stats (
    player_id        UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    mode             VARCHAR(32) NOT NULL,
    matches_played   INTEGER NOT NULL DEFAULT 0,
    wins             INTEGER NOT NULL DEFAULT 0,
    best_streak      INTEGER NOT NULL DEFAULT 0,
    current_streak   INTEGER NOT NULL DEFAULT 0,
    cards_played     INTEGER NOT NULL DEFAULT 0,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, mode)
);
