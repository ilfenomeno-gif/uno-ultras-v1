# ADR 0006 — Flusso Autoritativo Matchmaking Coda → Stanza

- **Stato:** Accettato
- **Data:** 2026-11-25
- **Contesto:** Collegamento del ciclo competitivo online dalla coda REST (`POST /api/matchmaking/enqueue`) all'ingresso reale nella stanza Colyseus (`UnoRoom`), chiudendo le superfici di abuso lato client e le race condition tra fallback bot e giocatori umani.

## Decisione Architetturale

1. **Creazione Autoritativa della Stanza & Prenotazione Posti (`onAuth` + `setPrivate`)**
   - `POST /api/matchmaking/enqueue` inserisce il ticket in `MatchmakingQueue` e, non appena `popMatches()` forma un gruppo compatibile per modalità/ranked/MMR, crea la stanza tramite `matchMaker.createRoom('uno', { ..., matchmade: true, allowedPlayerIds })` e salva `roomId` + `allowedPlayerIds` nei ticket in Redis / cache.
   - `UnoRoom.onCreate` imposta `this.setPrivate(true)` (nascondendo la stanza dal listing pubblico) e `UnoRoom.onAuth` verifica il JWT del client contro `this.allowedPlayerIds`: chiunque conosca un `roomId` altrui senza essere tra i giocatori abbinati riceve errore di accesso negato (`Accesso negato: non sei tra i giocatori abbinati a questa stanza`).

2. **Fallback Bot Deciso dal Server (Zero Phantom Rooms)**
   - Il server assegna al ticket un `fallbackAtMs = now + MATCHMAKING_BOT_FALLBACK_MS` (default `3500 ms`).
   - Quando il client effettua polling su `GET /api/matchmaking/status/:ticketId` dopo `fallbackAtMs` e il ticket è ancora in stato `searching`, il server chiama atomicamente `matchmakingQueue.claimForBotFallback(playerId, ticketId)`: rimuove il giocatore dalla coda **prima** di creare la `UnoRoom` (`fillWithBots: true, allowedPlayerIds: [playerId]`), impedendo la creazione di stanze fantasma con altri avversari in ingresso.
   - Il client non sceglie mai autonomamente il fallback bot in modalità multiplayer: esegue il polling del ticket ed entra nel `roomId` assegnato dal server (o fallisce esplicitamente su annullamento/timeout).

3. **Gestione No-Show in Stanza**
   - Le stanze matchmade in attesa di umani armano `noShowTimer` (`MATCHMAKING_NOSHOW_TIMEOUT_MS`, default `15000 ms`):
     - Se allo scadere nessuno è entrato (`0` partecipanti), la stanza esegue `disconnect()`.
     - Se almeno `1` giocatore è presente in lobby, il server attiva `fillWithBots = true`, notifica `no_show_fallback` e avvia la partita senza lasciare il giocatore bloccato.

## Nota sul Test E2E e Persistenza di Produzione

- Il test Playwright E2E (`e2e/matchmaking-e2e.spec.ts`) esegue un server Node isolato (`:3001`) senza PostgreSQL/Redis esterni (`dev-store.ts` + presenza locale Colyseus) per essere deterministico anche in ambienti CI privi di container DB.
- La persistenza reale PostgreSQL (`0001`–`0010`) e Redis (`RedisPresence`, `RedisDriver`, `leaderboard.ts`) è coperta dalle relative migrazioni, repository e test dedicati del workspace `@uno/server`.
