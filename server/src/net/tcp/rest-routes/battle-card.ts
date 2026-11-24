// ============================================================
// UNO ULTRA Server — Battle Card (Lv. 1..100) REST Router
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { BATTLE_CARD_MAX_LEVEL, BATTLE_CARD_REWARDS } from '@uno/shared';
import { authRequired } from '../../../auth/middleware.js';
import { createRateLimiter } from '../../../security/rate-limiter.js';
import {
  claimBattleCardReward,
  getOrCreateBattleCard,
  purchaseBattleCardPass,
  unlockAllRemainingBattleCardLevels,
} from '../../../persistence/postgres/repositories/battle-card.js';
import { InsufficientFundsError } from '../../../persistence/postgres/repositories/transactions.js';

export const battleCardRouter = Router();
const bcLimiter = createRateLimiter({ scope: 'battle_card', max: 20, windowSeconds: 60 });

const BuyPlanSchema = z.object({
  plan: z.enum(['base', 'bundle20']),
});

const ClaimSchema = z.object({
  level: z.number().int().min(1).max(BATTLE_CARD_MAX_LEVEL),
  track: z.enum(['free', 'premium']),
});

battleCardRouter.get('/', authRequired, async (req, res) => {
  try {
    const state = await getOrCreateBattleCard(req.user!.sub);
    res.status(200).json({ state, rewards: BATTLE_CARD_REWARDS });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Errore Battle Card' });
  }
});

battleCardRouter.post('/buy', authRequired, bcLimiter, async (req, res) => {
  const parsed = BuyPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Piano Battle Card non valido' });
    return;
  }
  try {
    const out = await purchaseBattleCardPass(req.user!.sub, parsed.data.plan);
    res.status(200).json(out);
  } catch (err) {
    const status = err instanceof InsufficientFundsError ? 402 : 400;
    res.status(status).json({ error: err instanceof Error ? err.message : 'Acquisto fallito' });
  }
});

battleCardRouter.post('/unlock-all', authRequired, bcLimiter, async (req, res) => {
  try {
    const out = await unlockAllRemainingBattleCardLevels(req.user!.sub);
    res.status(200).json(out);
  } catch (err) {
    const status = err instanceof InsufficientFundsError ? 402 : 400;
    res.status(status).json({ error: err instanceof Error ? err.message : 'Sblocco fallito' });
  }
});

battleCardRouter.post('/claim', authRequired, bcLimiter, async (req, res) => {
  const parsed = ClaimSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Livello/traccia non valida' });
    return;
  }
  try {
    const out = await claimBattleCardReward(req.user!.sub, parsed.data.level, parsed.data.track);
    res.status(200).json(out);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Riscatto fallito' });
  }
});
