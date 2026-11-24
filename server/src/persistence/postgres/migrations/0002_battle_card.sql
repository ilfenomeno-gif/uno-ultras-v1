-- ============================================================
-- UNO ULTRA — Migration 0002b: Battle Card Seasons & Player Progress
-- ============================================================

CREATE TABLE IF NOT EXISTS battle_card_seasons (
    season_id     VARCHAR(32) PRIMARY KEY,
    title         VARCHAR(120) NOT NULL,
    starts_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO battle_card_seasons (season_id, title, is_active)
VALUES ('S1', 'Stagione 1 — Neon Overdrive', TRUE)
ON CONFLICT (season_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS player_battle_cards (
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season_id       VARCHAR(32) NOT NULL DEFAULT 'S1' REFERENCES battle_card_seasons(season_id),
    tier            VARCHAR(16) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'base', 'bundle20')),
    level           INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 100),
    xp              INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    claimed_levels  JSONB NOT NULL DEFAULT '[]'::jsonb,
    purchased_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, season_id)
);

CREATE INDEX IF NOT EXISTS idx_battle_cards_player ON player_battle_cards (player_id);
