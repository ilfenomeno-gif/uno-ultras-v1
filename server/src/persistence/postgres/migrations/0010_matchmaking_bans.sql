-- ============================================================
-- UNO ULTRA — Migration 0010: Competitive Matchmaking Bans
-- ============================================================

CREATE TABLE IF NOT EXISTS player_matchmaking_bans (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  ban_expires_at TIMESTAMPTZ NOT NULL,
  offense_count INT NOT NULL DEFAULT 1,
  last_offense_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reason TEXT NOT NULL DEFAULT 'Abbandono anticipato partita competitiva'
);
