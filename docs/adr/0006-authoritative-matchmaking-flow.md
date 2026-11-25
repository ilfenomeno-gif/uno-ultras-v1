# ADR 0006 — Flusso Autoritativo Matchmaking Coda → Stanza

- **Stato:** Accettato
- **Data:** 2026-11-25
- **Contesto:** Collegamento del ciclo competitivo online dalla coda REST (`POST /api/matchmaking/enqueue`) all'ingresso reale nella stanza Colyseus (`UnoRoom`), chiudendo le superfici di abuso lato client, gli effetti collaterali su GET e le race condition tra fallback bot e giocatori umani.

## Decisione Architetturale

1. **Creazione Autoritativa della Stanza & Prenotazione Posti (`onAuth` + `setPrivate`)**
   - `POST /api/matchmaking/enqueue` (limitato da `mmLimiter` a `12 req/min` e dal tetto `MAX_ACTIVE_MATCHMADE_ROOMS`, `503` se saturo) inserisce il ticket in `MatchmakingQueue` / Redis ZSET e, non appena `popMatches()` forma un gruppo compatibile per modalità/ranked/MMR, crea la stanza tramite `matchMaker.createRoom('uno', { ..., matchmade: true, allowedPlayerIds })` e salva `roomId` + `allowedPlayerIds` nei ticket in Redis / cache.
   - `UnoRoom.onCreate` imposta `this.setPrivate(true)` e `UnoRoom.onAuth` verifica il JWT del client contro `this.allowedPlayerIds`: chiunque conosca un `roomId` altrui senza essere tra i giocatori abbinati riceve errore esplicito (`Accesso negato: non sei tra i giocatori abbinati a questa stanza`).

2. **Fallback Bot con Timer Lato Server & Claim Atomico Lua su Redis (GET puro)**
   - Se `enqueue` non trova subito altri giocatori umani, il server arma un `setTimeout` (`MATCHMAKING_BOT_FALLBACK_MS`, default `3500 ms`) sul proprio processo (`runServerBotFallback`).
   - Allo scadere del timer, il server rivendica il ticket sia in memoria (`matchmakingQueue.claimForBotFallback`) sia su Redis tramite script Lua atomico `ZSCORE` + `ZREM` (`claimRedisQueueMember`), verifica `MAX_ACTIVE_MATCHMADE_ROOMS` e crea la `UnoRoom` privata (`fillWithBots: true, allowedPlayerIds: [playerId]`), aggiornando il ticket in cache senza attendere polling HTTP.
   - `GET /api/matchmaking/status/:ticketId` è **puramente di sola lettura** (privo di side-effect) e il client non decide mai autonomamente il passaggio ai bot in multiplayer.

3. **Gestione No-Show in Stanza**
   - Le stanze matchmade in attesa di umani armano `noShowTimer` (`MATCHMAKING_NOSHOW_TIMEOUT_MS`, default `15000 ms`):
     - Con `0` ingressi allo scadere, la stanza esegue `disconnect()`.
     - Con almeno `1` giocatore in lobby, il server attiva `fillWithBots = true`, invia `no_show_fallback` e avvia la partita.

## Verifica di Produzione (PostgreSQL 16 + Redis 7)

- La pipeline CI (`.github/workflows/ci.yml`) avvia i service container `postgres:16-alpine` e `redis:7-alpine` ed esegue `npm run test:e2e` contro il server avviato con `NODE_ENV=production` (`E2E_USE_REAL_INFRA=true`), verificando `/api/health` (`postgres: up`, `redis: up`), migrazioni `0001`–`0010`, coda/presenza Redis e blocco reale WebSocket di un intruso da parte di `UnoRoom.onAuth`.
