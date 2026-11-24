-- ============================================================
-- UNO ULTRA — Migration 0008: Align defaults & add audit indexes
-- ============================================================

ALTER TABLE players
    ALTER COLUMN rank_tier TYPE VARCHAR(30),
    ALTER COLUMN mmr SET DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_economy_tx_ref
    ON economy_transactions (reference_id)
    WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_expires
    ON notifications (expires_at)
    WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_match_participants_placement
    ON match_participants (match_id, placement);
