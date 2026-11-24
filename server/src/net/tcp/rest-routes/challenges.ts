// ============================================================
// UNO ULTRA Server — Challenges & Career / Leaderboard REST Routes
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../../auth/middleware.js';
import { createRateLimiter } from '../../../security/rate-limiter.js';
import {
  claimChallengeReward,
  getOrInitPlayerChallenges,
} from '../../../persistence/postgres/repositories/challenges.js';
import {
  getMatchReplay,
  getPlayerCareerSummary,
} from '../../../persistence/postgres/repositories/matches.js';
import { getTopLeaderboard } from '../../../persistence/redis/leaderboard.js';
import { listBotSocialProfilesNearMMR } from '../../../persistence/postgres/repositories/bot-social.js';

export const challengesRouter = Router();
const claimLimiter = createRateLimiter({ scope: 'challenge_claim', max: 20, windowSeconds: 60 });

const ClaimSchema = z.object({
  challengeId: z.string().min(1).max(64),
});

challengesRouter.get('/', authRequired, async (req, res) => {
  try {
    const challenges = await getOrInitPlayerChallenges(req.user!.sub);
    res.status(200).json({ challenges });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Errore sfide' });
  }
});

challengesRouter.post('/claim', authRequired, claimLimiter, async (req, res) => {
  const parsed = ClaimSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'challengeId non valido' });
    return;
  }
  try {
    const result = await claimChallengeReward(req.user!.sub, parsed.data.challengeId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Riscatto sfida fallito' });
  }
});

export const leaderboardRouter = Router();

leaderboardRouter.get('/top', async (req, res) => {
  const limit = Number(req.query['limit'] ?? 100);
  const entries = await getTopLeaderboard(Number.isFinite(limit) ? limit : 100);
  res.status(200).json({ entries });
});

leaderboardRouter.get('/career', authRequired, async (req, res) => {
  try {
    const summary = await getPlayerCareerSummary(req.user!.sub);
    res.status(200).json(summary);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Errore carriera' });
  }
});

leaderboardRouter.get('/replays/:matchId', authRequired, async (req, res) => {
  try {
    const replay = await getMatchReplay(String(req.params['matchId'] ?? ''));
    if (!replay) {
      res.status(404).json({ error: 'Replay non trovato' });
      return;
    }
    res.status(200).json(replay);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Errore replay' });
  }
});

leaderboardRouter.get('/bots', async (req, res) => {
  const mmr = Number(req.query['mmr'] ?? 800);
  const bots = await listBotSocialProfilesNearMMR(Number.isFinite(mmr) ? mmr : 800);
  res.status(200).json({ bots });
});
