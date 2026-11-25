-- Independent competitive ranks per (mode, playerCount) playlist (1v1 / 3p / 4p)

CREATE TABLE IF NOT EXISTS player_playlist_ranks (
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mode VARCHAR(32) NOT NULL,
  player_count SMALLINT NOT NULL CHECK (player_count IN (2, 3, 4)),
  mmr INTEGER NOT NULL DEFAULT 0,
  rank_tier VARCHAR(32) NOT NULL DEFAULT 'Bronze I',
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, mode, player_count)
);

CREATE INDEX IF NOT EXISTS idx_playlist_ranks_leaderboard
  ON player_playlist_ranks (mode, player_count, mmr DESC);
