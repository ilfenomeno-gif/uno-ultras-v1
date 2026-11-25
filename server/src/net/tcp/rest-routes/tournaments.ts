// ============================================================
// UNO ULTRA Server — Tournaments REST Router (Zero-500 Resilient)
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { TOURNAMENT_PRESETS } from '@uno/shared';
import { authRequired } from '../../../auth/middleware.js';
import { createRateLimiter } from '../../../security/rate-limiter.js';
import {
  createTournamentFromPreset,
  enrollPlayerInTournamentKind,
  joinTournament,
  listTournaments,
} from '../../../persistence/postgres/repositories/tournaments.js';
import { InsufficientFundsError } from '../../../persistence/postgres/repositories/transactions.js';

export const tournamentsRouter = Router();
const tournamentCreateLimiter = createRateLimiter({
  scope: 'tournament_create',
  max: 20,
  windowSeconds: 3600,
});
const tournamentJoinLimiter = createRateLimiter({
  scope: 'tournament_join',
  max: 25,
  windowSeconds: 60,
});

function isTournamentAdmin(playerId: string): boolean {
  const list = (process.env['ADMIN_PLAYER_IDS'] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 0 ? false : list.includes(playerId);
}

const CreateBodySchema = z.object({
  kind: z.enum(['ut32', 'grand-prix', 'classico', 'pentathlon', 'ucs-ssl']),
});

tournamentsRouter.get('/presets', (_req, res) => {
  res.status(200).json({ presets: TOURNAMENT_PRESETS });
});

tournamentsRouter.get('/', async (_req, res) => {
  try {
    const list = await listTournaments();
    res.status(200).json({ tournaments: list, presets: TOURNAMENT_PRESETS });
  } catch {
    res.status(200).json({ tournaments: [], presets: TOURNAMENT_PRESETS });
  }
});

tournamentsRouter.post('/', authRequired, tournamentCreateLimiter, async (req, res) => {
  const parsed = CreateBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Tipo torneo non valido' });
    return;
  }
  if (parsed.data.kind === 'ucs-ssl' && !isTournamentAdmin(req.user!.sub)) {
    res.status(403).json({ error: 'Creazione tornei UCS SSL riservata agli organizzatori' });
    return;
  }
  try {
    const created = await createTournamentFromPreset(parsed.data.kind);
    res.status(201).json({ tournament: created });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Creazione torneo fallita' });
  }
});

tournamentsRouter.post('/enroll', authRequired, tournamentJoinLimiter, async (req, res) => {
  const parsed = CreateBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Tipo torneo non valido' });
    return;
  }
  try {
    const out = await enrollPlayerInTournamentKind(
      parsed.data.kind,
      req.user!.sub,
      req.user!.username,
    );
    res.status(200).json(out);
  } catch (err) {
    const status = err instanceof InsufficientFundsError ? 402 : 400;
    res.status(status).json({ error: err instanceof Error ? err.message : 'Iscrizione torneo non riuscita' });
  }
});

tournamentsRouter.post('/:id/join', authRequired, tournamentJoinLimiter, async (req, res) => {
  const tournamentId = String(req.params['id'] ?? '');
  if (!tournamentId) {
    res.status(400).json({ error: 'ID torneo mancante' });
    return;
  }
  try {
    const result = await joinTournament(tournamentId, req.user!.sub, req.user!.username);
    res.status(200).json(result);
  } catch (err) {
    const status = err instanceof InsufficientFundsError ? 402 : 400;
    res.status(status).json({ error: err instanceof Error ? err.message : 'Iscrizione fallita' });
  }
});
