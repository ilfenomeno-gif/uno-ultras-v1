// ============================================================
// UNO ULTRA Server — Offline Sync (Authoritative Caps), Lobby & ICE Router
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { GAME_MODES, validatePresetForPlayers, VARIANT_PRESETS } from '@uno/shared';
import { authRequired } from '../../../auth/middleware.js';
import { addBattleCardXp } from '../../../persistence/postgres/repositories/battle-card.js';
import { incrementChallengeMetricsBatch } from '../../../persistence/postgres/repositories/challenges.js';
import { applyBalanceDelta } from '../../../persistence/postgres/repositories/transactions.js';
import { query } from '../../../persistence/postgres/client.js';
import { createRateLimiter } from '../../../security/rate-limiter.js';
import { buildIceConfigurationForPlayer } from '../../turn/ice-config.js';
import { lobbyManager } from '../../../matchmaking/lobby-manager.js';

export const syncRouter = Router();

const MAX_OFFLINE_EVENTS_PER_UTC_DAY = 10;
const syncLimiter = createRateLimiter({ scope: 'offline_sync', max: 5, windowSeconds: 60 });

const OfflineEventSchema = z.object({
  id: z.string().min(1).max(80),
  kind: z.enum(['match_completed', 'challenge_progress', 'bot_xp']),
  mode: z.enum(GAME_MODES),
  won: z.boolean(),
  cardsPlayed: z.number().int().min(0).max(150),
  playedAt: z.string(),
});

const BatchSyncSchema = z.object({
  events: z.array(OfflineEventSchema).max(10),
});

const dailySyncFallbackCounts = new Map<string, { day: string; count: number }>();

async function getRemainingDailyOfflineQuota(playerId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const res = await query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt
         FROM economy_transactions
        WHERE player_id = $1
          AND idempotency_key LIKE $2
          AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC')`,
      [playerId, `offline:${playerId}:%`],
    );
    const used = Number(res.rows[0]?.cnt ?? 0);
    return Math.max(0, MAX_OFFLINE_EVENTS_PER_UTC_DAY - used);
  } catch {
    const rec = dailySyncFallbackCounts.get(playerId);
    const used = rec && rec.day === today ? rec.count : 0;
    return Math.max(0, MAX_OFFLINE_EVENTS_PER_UTC_DAY - used);
  }
}

function recordFallbackSyncUsage(playerId: string, used: number): void {
  const today = new Date().toISOString().slice(0, 10);
  const prev = dailySyncFallbackCounts.get(playerId);
  const nextCount = (prev && prev.day === today ? prev.count : 0) + used;
  dailySyncFallbackCounts.set(playerId, { day: today, count: nextCount });
}

syncRouter.post('/offline-batch', authRequired, syncLimiter, async (req, res) => {
  const parsed = BatchSyncSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload offline sync non valido' });
    return;
  }

  const playerId = req.user!.sub;
  let remainingQuota = await getRemainingDailyOfflineQuota(playerId);
  let applied = 0;
  let totalXp = 0;
  let totalVCard = 0;

  for (const ev of parsed.data.events) {
    if (remainingQuota <= 0) break;

    // Regole di ricompensa 100% autoritative server-side (qualsiasi delta inviato dal client è ignorato)
    const authVCard = ev.won ? 15 : 5;
    const authXp = ev.won ? 120 : 60;

    try {
      const tx = await applyBalanceDelta({
        playerId,
        txType: 'match_reward',
        currency: 'vcard',
        delta: authVCard,
        referenceId: `offline:${ev.mode}`,
        idempotencyKey: `offline:${playerId}:${ev.id}`,
      });
      if (tx.deduplicated) continue;

      totalVCard += authVCard;
      await addBattleCardXp(playerId, authXp);
      totalXp += authXp;

      await incrementChallengeMetricsBatch(playerId, {
        matches_played: 1,
        matches_won: ev.won ? 1 : 0,
        cards_played: Math.min(60, ev.cardsPlayed),
      });

      applied += 1;
      remainingQuota -= 1;
      recordFallbackSyncUsage(playerId, 1);
    } catch {
      // Skip individual failing event cleanly
    }
  }

  res.status(200).json({ applied, totalXp, totalVCard, remainingDailyQuota: remainingQuota });
});

syncRouter.get('/ice-servers', authRequired, (req, res) => {
  const config = buildIceConfigurationForPlayer(req.user!.sub);
  res.status(200).json(config);
});

syncRouter.get('/presets', (_req, res) => {
  res.status(200).json({ presets: VARIANT_PRESETS });
});

syncRouter.post('/lobbies/private', authRequired, (req, res) => {
  const mode = GAME_MODES.includes(req.body?.mode) ? req.body.mode : 'uno';
  const maxPlayers = Math.max(2, Math.min(4, Number(req.body?.maxPlayers ?? 4)));
  const check = validatePresetForPlayers(req.body?.customConfig ?? VARIANT_PRESETS.standard, maxPlayers);
  if (!check.ok || !check.config) {
    res.status(400).json({ error: check.error ?? 'Regole non valide' });
    return;
  }
  const lobby = lobbyManager.createLobby({
    hostId: req.user!.sub,
    mode,
    maxPlayers,
    customConfig: check.config,
  });
  res.status(201).json({
    code: lobby.code,
    mode: lobby.mode,
    maxPlayers: lobby.maxPlayers,
    customConfig: lobby.customConfig,
  });
});

syncRouter.post('/lobbies/:code/rematch', authRequired, (req, res) => {
  const votes = lobbyManager.voteRematch(String(req.params['code'] ?? ''), req.user!.sub);
  res.status(200).json({ votes });
});
