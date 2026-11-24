-- ============================================================
-- UNO ULTRA — Migration 0002: Case-insensitive identity,
--             reserved usernames & refresh tokens
-- ============================================================

ALTER TABLE players
    ADD COLUMN IF NOT EXISTS username_canonical  VARCHAR(50),
    ADD COLUMN IF NOT EXISTS tournament_credits  INTEGER NOT NULL DEFAULT 0 CHECK (tournament_credits >= 0),
    ADD COLUMN IF NOT EXISTS xp                  BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
    ADD COLUMN IF NOT EXISTS account_level       INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS equipped_avatar     VARCHAR(64) NOT NULL DEFAULT 'default',
    ADD COLUMN IF NOT EXISTS equipped_frame      VARCHAR(64) NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS equipped_card_style VARCHAR(64) NOT NULL DEFAULT 'classic',
    ADD COLUMN IF NOT EXISTS equipped_title      VARCHAR(64) NOT NULL DEFAULT 't1',
    ADD COLUMN IF NOT EXISTS deleted_at          TIMESTAMPTZ;

UPDATE players
   SET username_canonical = LOWER(TRIM(username))
 WHERE username_canonical IS NULL;

ALTER TABLE players
    ALTER COLUMN username_canonical SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_username_lower
    ON players (LOWER(username))
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_username_canonical
    ON players (username_canonical)
    WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS reserved_usernames (
    canonical_name VARCHAR(50) PRIMARY KEY,
    reason         VARCHAR(50) NOT NULL -- 'system' | 'bot_pool' | 'offensive'
);

INSERT INTO reserved_usernames (canonical_name, reason) VALUES
    ('admin', 'system'),
    ('administrator', 'system'),
    ('root', 'system'),
    ('system', 'system'),
    ('mod', 'system'),
    ('moderator', 'system'),
    ('bot', 'bot_pool'),
    ('guest', 'system'),
    ('player', 'system'),
    ('uno', 'system'),
    ('ultra', 'system')
ON CONFLICT (canonical_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    token_hash  VARCHAR(128) UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_player ON refresh_tokens (player_id);
