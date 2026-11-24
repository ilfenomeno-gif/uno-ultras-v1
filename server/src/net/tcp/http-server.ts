// ============================================================
// UNO ULTRA Server — Express HTTP server setup
// ============================================================

import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { healthRouter } from './rest-routes/health.js';
import { authRouter } from './rest-routes/auth.js';
import { profileRouter } from './rest-routes/profile.js';
import { friendsRouter } from './rest-routes/friends.js';
import { notificationsRouter } from './rest-routes/notifications.js';
import { invitesRouter } from './rest-routes/invites.js';
import { shopRouter } from './rest-routes/shop.js';
import { inventoryRouter } from './rest-routes/inventory.js';
import { battleCardRouter } from './rest-routes/battle-card.js';
import { challengesRouter, leaderboardRouter } from './rest-routes/challenges.js';
import { tournamentsRouter } from './rest-routes/tournaments.js';
import { syncRouter } from './rest-routes/sync.js';
import { matchmakingRouter } from './rest-routes/matchmaking.js';
import { progressionRouter } from './rest-routes/progression.js';

export function createHttpApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  // CORS minimale per sviluppo client Vite e reverse proxy Nginx
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', env.CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // REST API routes
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/players', profileRouter);
  app.use('/api/friends', friendsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/invites', invitesRouter);
  app.use('/api/shop', shopRouter);
  app.use('/api/inventory', inventoryRouter);
  app.use('/api/battle-card', battleCardRouter);
  app.use('/api/challenges', challengesRouter);
  app.use('/api/leaderboard', leaderboardRouter);
  app.use('/api/tournaments', tournamentsRouter);
  app.use('/api/sync', syncRouter);
  app.use('/api/matchmaking', matchmakingRouter);
  app.use('/api/progression', progressionRouter);

  // 404 fallback per rotte API non gestite
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Endpoint API non trovato' });
  });

  // Global error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, 'Unhandled Express error');
    res.status(500).json({ error: 'Errore interno del server' });
  });

  return app;
}
