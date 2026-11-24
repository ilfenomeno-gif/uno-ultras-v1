-- ============================================================
-- UNO ULTRA — Migration 0004: Economy, Inventory & Challenges
-- ============================================================

CREATE TABLE IF NOT EXISTS player_inventory (
    player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id      VARCHAR(80) NOT NULL,
    category     VARCHAR(32) NOT NULL,
    quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    acquired_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_player ON player_inventory (player_id);

CREATE TABLE IF NOT EXISTS economy_transactions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    tx_type           VARCHAR(32) NOT NULL CHECK (
                          tx_type IN ('shop_purchase', 'crate_open', 'duplicate_refund',
                                      'battle_card_buy', 'battle_card_claim', 'challenge_reward',
                                      'tournament_entry', 'tournament_prize', 'match_reward', 'admin_grant')
                      ),
    currency          VARCHAR(24) NOT NULL DEFAULT 'vcard' CHECK (currency IN ('vcard', 'tournament_credits')),
    amount_delta      INTEGER NOT NULL,
    balance_after     INTEGER NOT NULL CHECK (balance_after >= 0),
    reference_id      VARCHAR(120),
    idempotency_key   VARCHAR(120) UNIQUE,
    metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_economy_tx_player ON economy_transactions (player_id, created_at DESC);

CREATE TABLE IF NOT EXISTS player_challenges (
    player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    challenge_id  VARCHAR(64) NOT NULL,
    period        VARCHAR(16) NOT NULL CHECK (period IN ('daily', 'weekly')),
    progress      INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
    target        INTEGER NOT NULL CHECK (target >= 1),
    claimed       BOOLEAN NOT NULL DEFAULT FALSE,
    resets_at     TIMESTAMPTZ NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_challenges_player ON player_challenges (player_id, period);
