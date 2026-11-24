-- Widen player_challenges.period check constraint to allow seasonal challenges

ALTER TABLE player_challenges
  DROP CONSTRAINT IF EXISTS player_challenges_period_check;

ALTER TABLE player_challenges
  ADD CONSTRAINT player_challenges_period_check
  CHECK (period IN ('daily', 'weekly', 'seasonal'));
