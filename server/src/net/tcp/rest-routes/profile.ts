// ============================================================
// UNO ULTRA Server — Public Player Profile REST Route
// ============================================================

import { Router } from 'express';
import { authRequired } from '../../../auth/middleware.js';
import { findPlayerByUsername } from '../../../persistence/postgres/repositories/players.js';
import { presenceService } from '../../../rooms/base/presence.js';
import { logger } from '../../../config/logger.js';

export const profileRouter = Router();

profileRouter.get('/:username/profile', authRequired, async (req, res) => {
  const rawUsername = req.params['username'];
  if (typeof rawUsername !== 'string' || rawUsername.trim().length < 3) {
    res.status(400).json({ error: 'Username non valido' });
    return;
  }

  try {
    const player = await findPlayerByUsername(rawUsername.trim());
    if (!player) {
      res.status(404).json({ error: 'Giocatore non trovato' });
      return;
    }

    const presenceStatus = await presenceService.getStatus(player.id);

    res.status(200).json({
      id: player.id,
      username: player.username,
      rank: player.rank_tier,
      mmr: player.mmr,
      battleCardLevel: player.battle_card_level,
      createdAt: player.created_at.toISOString(),
      presenceStatus,
    });
  } catch (err) {
    logger.error({ err }, 'Error loading public player profile');
    res.status(500).json({ error: 'Errore interno nel recupero del profilo' });
  }
});
