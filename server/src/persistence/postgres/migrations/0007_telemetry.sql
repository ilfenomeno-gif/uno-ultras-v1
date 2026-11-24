-- ============================================================
-- UNO ULTRA — Migration 0007: Bot Social Profiles & Telemetry Snapshots
-- ============================================================

CREATE TABLE IF NOT EXISTS bot_social_profiles (
    id            VARCHAR(64) PRIMARY KEY,
    display_name  VARCHAR(64) UNIQUE NOT NULL,
    ai_profile    VARCHAR(16) NOT NULL CHECK (ai_profile IN ('AGGR', 'CONS', 'STRAT')),
    mmr           INTEGER NOT NULL DEFAULT 400,
    rank_tier     VARCHAR(30) NOT NULL DEFAULT 'Silver I',
    avatar_id     VARCHAR(64) NOT NULL DEFAULT 'avatar_neon_fox',
    frame_id      VARCHAR(64) NOT NULL DEFAULT 'frame_default',
    favorite_mode VARCHAR(32) NOT NULL DEFAULT 'uno',
    wins          INTEGER NOT NULL DEFAULT 0,
    matches       INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry_snapshots (
    id             BIGSERIAL PRIMARY KEY,
    match_id       VARCHAR(80) NOT NULL,
    player_id      VARCHAR(80) NOT NULL,
    avg_rtt_ms     DOUBLE PRECISION NOT NULL DEFAULT 0,
    packet_loss    DOUBLE PRECISION NOT NULL DEFAULT 0,
    jitter_ms      DOUBLE PRECISION NOT NULL DEFAULT 0,
    recorded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_match ON telemetry_snapshots (match_id, recorded_at DESC);
