// ============================================================
// UNO ULTRA Server — Entry point (Express REST + Colyseus WS)
// ============================================================

import http from 'node:http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { createHttpApp } from './net/tcp/http-server.js';
import { createColyseusServer } from './net/tcp/websocket-server.js';
import { UnoRoom } from './rooms/uno/uno-room.js';
import { BlackjackRoom, GenericMiniGameRoom } from './rooms/mini-games/blackjack-room.js';
import { Scala40Room } from './rooms/mini-games/scala40-room.js';
import { ScopaRoom } from './rooms/mini-games/scopa-room.js';
import { recoverOrphanedMatchmakingTickets } from './net/tcp/rest-routes/matchmaking.js';
import { seedBotSocialProfiles } from './persistence/postgres/repositories/bot-social.js';
import { connectRedis, closeRedis } from './persistence/redis/client.js';
import { closePostgres } from './persistence/postgres/client.js';
import { runMigrations } from './persistence/postgres/migrate.js';

async function bootstrap(): Promise<void> {
  // Connessione Redis opzionale in dev (abilita RedisPresence/RedisDriver se disponibile)
  let redisConnected = false;
  try {
    await connectRedis();
    redisConnected = true;
    logger.info('Redis connected');
  } catch (err) {
    logger.warn({ err }, 'Redis not reachable at startup — continuing with local presence');
  }

  // Migrazioni idempotenti SQL (obbligatorie in produzione, opzionali in dev se Postgres non avviato)
  try {
    const applied = await runMigrations();
    if (applied.length > 0) {
      logger.info({ applied }, 'PostgreSQL migrations applied');
    }
  } catch (err) {
    if (env.NODE_ENV === 'production' || process.env['NODE_ENV'] === 'production') {
      logger.fatal({ err }, 'PostgreSQL migrations failed in production — aborting startup');
      throw err;
    }
    logger.warn({ err }, 'PostgreSQL migrations skipped at startup');
  }

  const app = createHttpApp();
  const httpServer = http.createServer(app);
  const gameServer = createColyseusServer(httpServer, { useRedis: redisConnected });

  // Registra le room autoritative (UNO + 7 mini-games)
  gameServer.define('uno', UnoRoom);
  gameServer.define('blackjack', BlackjackRoom);
  gameServer.define('scala40', Scala40Room);
  gameServer.define('scopa', ScopaRoom);
  gameServer.define('minigame', GenericMiniGameRoom);

  try {
    const recovered = await recoverOrphanedMatchmakingTickets();
    if (recovered > 0) {
      logger.info({ recovered }, 'Recovered orphaned matchmaking tickets after startup');
    }
  } catch (err) {
    logger.warn({ err }, 'Matchmaking startup ticket recovery failed');
  }

  try {
    await seedBotSocialProfiles();
  } catch {
    // non-fatal se Postgres offline
  }

  await gameServer.listen(env.WS_PORT);
  logger.info(
    { port: env.WS_PORT, env: env.NODE_ENV, redisClustered: redisConnected },
    `UNO ULTRA Server listening on http://localhost:${env.WS_PORT}`
  );

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down UNO ULTRA Server...');
    await gameServer.gracefullyShutdown(false);
    await Promise.allSettled([closeRedis(), closePostgres()]);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrap().catch((err) => {
  logger.fatal({ err }, 'Fatal error during server bootstrap');
  process.exit(1);
});
