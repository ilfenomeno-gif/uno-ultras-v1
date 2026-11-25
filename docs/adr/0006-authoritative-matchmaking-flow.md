# ADR 0006 — Flusso Autoritativo Matchmaking Coda → Stanza

- **Stato:** Accettato
- **Data:** 2026-11-25
- **Contesto:** Collegamento del ciclo competitivo online dalla coda REST (`POST /api/matchmaking/enqueue`) all'ingresso reale nella stanza Colyseus (`UnoRoom`), chiudendo le superfici di abuso lato client, gli effetti collaterali su GET e le race condition tra fallback bot e giocatori umani.

## Decisione Architetturale

1. **Creazione Autoritativa della Stanza & Prenotazione Posti (`onAuth` + `setPrivate`)**
   - `POST /api/matchmaking/enqueue` (con `app.set('trust proxy', 1)` dietro Nginx, limiter dedicati per utente/IP `enqueueLimiter: 12/min`, `statusLimiter: 180/min`, `cancelLimiter: 30/min` e tetto stanze `MAX_ACTIVE_MATCHMADE_ROOMS` calcolato su `matchMaker.query({ name: 'uno' })` via `RedisDriver`, `503` se saturo) inserisce il ticket in `MatchmakingQueue` / Redis ZSET e, non appena `popMatches()` forma un gruppo compatibile per modalità/ranked/MMR, crea la stanza tramite `matchMaker.createRoom('uno', { ..., matchmade: true, allowedPlayerIds })` e salva `roomId` + `allowedPlayerIds` nei ticket in Redis / cache.
   - `UnoRoom.onCreate` imposta `this.setPrivate(true)` e `UnoRoom.onAuth` verifica il JWT del client contro `this.allowedPlayerIds`: chiunque conosca un `roomId` altrui senza essere tra i giocatori abbinati riceve errore esplicito (`Accesso negato: non sei tra i giocatori abbinati a questa stanza`).

2. **Fallback Bot con Timer Lato Server, Recovery al Riavvio & Claim Atomico Lua su Redis (GET puro)**
   - Se `enqueue` non trova subito altri giocatori umani, il server arma un `setTimeout` (`MATCHMAKING_BOT_FALLBACK_MS`, default `3500 ms`) sul proprio processo (`runServerBotFallback`).
   - Allo scadere del timer, il server rivendica il ticket sia in memoria (`matchmakingQueue.claimForBotFallback`) sia su Redis tramite script Lua atomico `ZSCORE` + `ZREM` (`claimRedisQueueMember`), verifica `MAX_ACTIVE_MATCHMADE_ROOMS` e crea la `UnoRoom` privata (`fillWithBots: true, allowedPlayerIds: [playerId]`), aggiornando il ticket in cache senza attendere polling HTTP.
   - All'avvio del server (`recoverOrphanedMatchmakingTickets`), eventuali ticket `searching` rimasti orfani da un riavvio vengono scansionati su Redis/cache (`listSearchingMatchmakingTickets`): quelli ancora entro `fallbackAtMs` vengono riaccodati con timer residuo, quelli già scaduti vengono chiusi come `cancelled` (`server_restarted_expired`) rimuovendoli dallo ZSET Redis.
   - `GET /api/matchmaking/status/:ticketId` è **puramente di sola lettura** (privo di side-effect) e il client non decide mai autonomamente il passaggio ai bot in multiplayer.

3. **Fail-Closed in Produzione su Database e Migrazioni**
   - Con `NODE_ENV=production`, `canUseDevFallback()` restituisce sempre `false` (inclusi `42P01` e `ECONNREFUSED`), `runMigrations()` abortisce lo startup se fallisce e il gestore errori globale Express (`apiErrorHandler`) restituisce `503` per indisponibilità DB anziché mascherarla.

3. **Gestione No-Show in Stanza**
   - Le stanze matchmade in attesa di umani armano `noShowTimer` (`MATCHMAKING_NOSHOW_TIMEOUT_MS`, default `15000 ms`):
     - Con `0` ingressi allo scadere, la stanza esegue `disconnect()`.
     - Con almeno `1` giocatore in lobby, il server attiva `fillWithBots = true`, invia `no_show_fallback` e avvia la partita.

## Verifica di Produzione (PostgreSQL 16 + Redis 7)

- La pipeline CI (`.github/workflows/ci.yml`) avvia i service container `postgres:16-alpine` e `redis:7-alpine` ed esegue `npm run test:e2e` contro il server avviato con `NODE_ENV=production` (`E2E_USE_REAL_INFRA=true`), verificando `/api/health` (`postgres: up`, `redis: up`), migrazioni `0001`–`0010`, coda/presenza Redis e blocco reale WebSocket di un intruso da parte di `UnoRoom.onAuth`.
