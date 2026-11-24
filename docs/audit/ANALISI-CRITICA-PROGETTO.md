# AUDIT COMPLETO — **UNO ULTRA** (`uno ultra game`)
**Analisi Critica Avversativa · Analisi Progetto · Diagnosi · Ottimizzazione · Architettura · Analisi di Contenuto**

- **Data Audit:** 2026-11-23
- **Perimetro Analizzato:** `c:\Users\PC\Pictures\uno ultras vscode\uno\uno ultra game` (`@uno/shared`, `@uno/server`, `@uno/client`, `docker/`, `docs/`, `infra/`, `.github/`, `scripts/`)
- **Specifica di Riferimento:** `docs/game-design/contenuto-game.md` (v1.1, SHA-256 `83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`, intatta)
- **Regola di Verità:** Ogni anomalia, metrica e percorso file riportato in questo documento è stato verificato direttamente su sorgenti, configurazioni, container Docker live (`uno-client`, `uno-server`, `uno-coturn`, `uno-postgres`, `uno-redis`) e output di compilazione/test. Nessun codice applicativo è stato modificato durante questo audit.

---

## 0. Sintesi Esecutiva (TL;DR)

Il repository è **compilabile, testato a livello di unità (`105` test Vitest verdi tra `@uno/shared` e `@uno/server`) e in esecuzione come stack Docker a 5 container** (`http://localhost`). Tuttavia, un'analisi ingegneristica e avversativa rigorosa rivela che il sistema oggi soffre di una **frattura netta tra "moduli scritti" e "sistema integrato end-to-end"**:

1. **Exploit economico critico (P0):** `POST /api/sync/offline-batch` (`server/src/net/tcp/rest-routes/sync.ts:17-73`) accetta `vcardDelta` e `xpDelta` **auto-dichiarati dal client** fino a `5.000 V-Card` e `50.000 XP` per singola chiamata HTTP, senza firma crittografica né validazione autoritativa lato server.
2. **Loop di gioco sconnesso dalla progressione (P0):** `UnoRoom` (`server/src/rooms/uno/uno-room.ts:340-349`) trasmette `MATCH_ENDED`, ma **non chiama mai** né `settleRankedMatchForPlayers`, né `recordFinishedMatch`, né `addBattleCardXp`, né `incrementChallengeMetric`. Giocare partite online reali non aggiorna MMR, leaderboard, storico, replay, sfide o Battle Card.
3. **Sistemi "Orfani" (Dead Wiring):** Oltre una dozzina di moduli server e client compilano senza errori, ma hanno **zero chiamanti a runtime** (`RoomActionThrottle`, `matchmakingQueue`, `pushRedisQueueMember`, `MatchTimer`, `webrtcSignaling`, `voiceRelay`, `startSpan`, `WebRtcUdpClient`, `VoiceClient`, `QuicClient`, `enqueueOfflineEvent`, componenti UI e `three`).
4. **Copertura test asimmetrica:** `@uno/shared` (`74` test) e `@uno/server` (`31` test) testano bene i blocchi isolati (prevalentemente su mock), ma `@uno/client` ha **`0` test** e non esiste alcun test Playwright / WebSocket reale di partita multi-giocatore.
5. **Audit documentale sfalsato:** `docs/game-design/file-implementazione-massiccia.md` marca `✅ Completato` voci (`IMP-006..IMP-026`) che esistono come singoli file isolati ma non come flussi collegati end-to-end.

---

## 1. Analisi Critica Avversativa (Red Team)

### 1.1 [P0 — CRITICAL] Exploit di Minting V-Card & XP su `/api/sync/offline-batch`
- **File:** `server/src/net/tcp/rest-routes/sync.ts:17-73`
- **Evidenza:**
  ```ts
  const OfflineEventSchema = z.object({
    id: z.string().min(1).max(80),
    kind: z.enum(['match_completed', 'challenge_progress', 'bot_xp']),
    mode: z.enum(GAME_MODES),
    won: z.boolean(),
    cardsPlayed: z.number().int().min(0).max(500),
    xpDelta: z.number().int().min(0).max(2000),
    vcardDelta: z.number().int().min(0).max(200),
    playedAt: z.string(),
  });
  // BatchSyncSchema: max 25 eventi per POST
  ```
- **Vettore d'attacco:** Qualsiasi utente registrato può inviare un loop di richieste autenticate con ID incrementali (`ev-1`, `ev-2`, ...) e `vcardDelta: 200`, `xpDelta: 2000` × `25` eventi = **`+5.000 V-Card` e `+50.000 XP` (`50` livelli Battle Card) per singola chiamata HTTP**, senza rate limiter sulla rotta.
- **Impatto:** Distruzione totale dell'economia virtuale, sblocco istantaneo di Battle Card Lv.100 e di tutto il catalogo Shop.
- **Rimedio richiesto:** Eliminare i delta numerici fidati dal client; il server deve ricalcolare i premi secondo tabellari server-side (con cap giornaliero offline anti-farming, validazione temporale/seed di sessione offline o HMAC di sessione, e rate limiter dedicato).

### 1.2 [P0 — CRITICAL] Disconnessione Totale tra `UnoRoom` e Progressione/Economia/Anti-Cheat
- **File:** `server/src/rooms/uno/uno-room.ts:340-349`, `server/src/security/anti-cheat.ts:10-34`
- **Evidenza:**
  1. Quando una partita UNO termina (`nextState.phase === 'finished'`), `UnoRoom` emette `TCP_CHANNELS.MATCH_ENDED` e fa `return`. **Non vengono mai invocati:** `settleRankedMatchForPlayers()`, `recordFinishedMatch()`, `addBattleCardXp()`, `incrementChallengeMetric()`.
  2. `RoomActionThrottle` (`server/src/security/anti-cheat.ts`) non ha **nessun chiamante** in `server/src/` (solo se stesso). Un client malevolo può inondare la stanza WebSocket di messaggi `play_card` / `draw_card` / `call_uno` senza throttling di stanza.
  3. Le 7 stanze mini-game (`blackjack`, `scala40`, `scopa`, `minigame`) definite in `server/src/index.ts` non usano neppure `lobbyManager`, né `MatchTimer` per turn timeout umani, né persistono risultati su Postgres.

### 1.3 [P1 — HIGH] Rate Limiting Incompleto sulle Rotte Economiche & `RATE_LIMIT_POLICIES` Orfano
- **File:** `server/src/config/rate-limits.ts:1-20`, `server/src/net/tcp/rest-routes/{shop,battle-card,tournaments,sync,inventory}.ts`
- **Evidenza:** `RATE_LIMIT_POLICIES` definisce politiche per `shop_purchase`, `match_action`, `telemetry_udp`, ecc., ma non è importato da nessun file. Le rotte `/api/shop/*`, `/api/battle-card/*`, `/api/challenges/*`, `/api/tournaments/*` e `/api/sync/*` non applicano alcun middleware `createRateLimiter()`.
- **Impatto:** Brute-force/spam transazionale su `POST /api/shop/crates/open`, creazione massiva di tornei (`POST /api/tournaments` non ha neanche un controllo ruolo admin/quota!), e abuse di `POST /api/sync/offline-batch`.

### 1.4 [P1 — HIGH] Vettori XSS su `innerHTML` Non Sanitizzato nel Client
- **File:**
  - `client/src/ui/tournament/challenger-list.ts:32-37` (`${e.username}`, `${e.rankTier}`)
  - `client/src/ui/tournament/bracket-view.ts:29-31` (`${s.playerA}`, `${s.playerB}`)
  - `client/src/ui/navigation/tab-locker.ts:24-27` (`${snap.loadout.avatar}`, `${meta?.name}`)
  - `client/src/ui/navigation/tab-career.ts:30-35` (`${rankInfo.tier}`)
  - `client/src/game-view/table.ts:197-240` (stato giocatori/punteggi)
- **Nota:** La registrazione attuale applica una regex su `username` (`^[a-zA-Z0-9_-]+$`), mitigando l'input utente diretto, ma ogni dato proveniente da DB modificato, webhook futuri, OAuth provider display name (`oauth-providers.ts`) o errori renderizzati con `innerHTML` è vulnerabile a Stored/DOM XSS. Occorre usare `textContent` / `document.createElement` (come già fatto correttamente in `tab-play.ts` e `modal.ts`).

### 1.5 [P1 — HIGH] Mismatch Schema DB Bootstrap (`init.sql` vs `0001_init.sql`) e Race di Migrazione Multi-Nodo
- **File:** `docker/postgres/init.sql:9-10` vs `server/src/persistence/postgres/migrations/0001_init.sql:12-13`, `server/src/persistence/postgres/migrate.ts:25-60`
- **Evidenza reale verificata durante il test live:**
  - `docker/postgres/init.sql` (eseguito al primo avvio del volume Postgres Docker) crea `players` con `mmr INTEGER NOT NULL DEFAULT 200` e `rank_tier VARCHAR(20)` (mentre `Grand Champion III` = `18` char, molto vicino al limite).
  - `0001_init.sql` usa `CREATE TABLE IF NOT EXISTS players` con `mmr DEFAULT 0` e `rank_tier VARCHAR(30)`: quindi sul container Postgres appena creato da zero, `IF NOT EXISTS` **viene saltato silenziosamente** e tutti i nuovi utenti registrati partono con **`mmr = 200`** invece di **`INITIAL_MMR = 0`**! (Verificato live: `REGISTER: 201 SmokeE2E_User mmr= 200`).
  - Inoltre `migrate.ts` apre una connessione singola senza `SELECT pg_advisory_lock(...)`: in avvio simultaneo multi-replica (`Colyseus Multi-Node` di `IMP-008`), due container `uno-server` eseguirebbero contemporaneamente la stessa migrazione.

### 1.6 [P1 — HIGH] Errori & Gap Infrastrutturali Docker/Rete
1. **Errore runtime `ioredis` in `uno-server`:** I log live di `uno-server` mostrano:
   `[ioredis] Unhandled error event: Error: Connection in subscriber mode, only subscriber commands may be used` generato da `RedisPresence` (`server/src/net/tcp/websocket-server.ts:36`) durante `_readyCheck`. Il server continua ad avviarsi, ma indica incompatibilità/configurazione mancante di listener `error` o opzioni `enableReadyCheck: false` su `RedisPresence`/`RedisDriver`.
2. **Nginx espone la porta `443` senza TLS:** `docker-compose.yml:106` mappa `443:443`, ma `docker/client/nginx.conf:25` ascolta solo `listen 80;`. Connessioni `https://` falliscono.
3. **UDP Telemetry non autenticato (`server/src/net/udp/telemetry-udp.ts:24-40`):** Accetta qualsiasi pacchetto UDP contenente un `playerId` arbitrario nella mappa in-memory `latestStats` senza token di sessione o HMAC, permettendo spoofing di telemetria o flood verso `telemetryUdpServer`.
4. **Sorgenti Client esposte in produzione (`client/vite.config.ts:17`):** `sourcemap: true` genera `dist/assets/index-*.js.map` da **`1,150.12 kB`** pubblicamente scaricabile da Nginx su `http://localhost/assets/*.map`.
5. **Permessi creazione tornei:** `POST /api/tournaments` (`server/src/net/tcp/rest-routes/tournaments.ts:33`) consente a qualsiasi giocatore autenticato di creare tornei illimitati nel DB (anche UCS SSL da `10.000` crediti).

### 1.7 [P2 — MEDIUM] Divergenza Stato Client Fittizio in `inventory-store.ts`
- **File:** `client/src/state/inventory-store.ts:28-44`
- **Evidenza:** `DEFAULT_SNAPSHOT` pre-inizializza il portafoglio client offline a `vcard: 1200`, `tournamentCredits: 250` e 3 cosmetici (`CATALOG_ITEMS.slice(0, 3)`), che appaiono reali all'utente quando offline o al primo render finché non arriva la risposta server. Inoltre, in `tab-shop.ts:74-89`, se la `POST /api/shop/purchase` fallisce (per **qualsiasi** errore, incluso `402 Fondi Insufficienti` o `401`), il blocco `catch` scala V-Card in cache locale facendo credere al giocatore di aver acquistato l'oggetto!

---

## 2. Analisi Progetto (Inventario Tecnico Reale)

### 2.1 Volumetria Reale del Codice
| Area | File Contati | Righe Totali | Note |
|---|---|---|---|
| `shared/src` | `47` | `3.886` | Motore UNO, 22 tier + ELO, 7 mini-game, Pentathlon, Zod, Schema Colyseus |
| `server/src` | `76` | `5.876` | Express REST, Colyseus, Postgres repos, Redis, UDP/TURN, Gemini advisor |
| `client/src` | `63` | `5.300` | SPA Vanilla TS, 8 tab, Table UNO DOM, particles canvas, CSS |
| `shared/tests` | `8` | `929` | `74` test Vitest passati |
| `server/tests` | `5` | `945` | `31` test Vitest passati (prevalentemente con mock pg/fetch) |
| `client/tests` | `0` | `0` | **Nessun test unitario o E2E browser** |

### 2.2 File Ancora a `0 byte` nel Repository (`44` file non-`.gitkeep`)
Tutti i file applicativi `.ts`/`.sql`/`.css` sono stati popolati, ma restano ancora **44 file vuoti a `0 byte`** nelle aree operative, DevOps e documentali:
- **Root:** `README.md`, `CHANGELOG.md`
- **CI/CD (`.github/workflows/`):** `ci.yml`, `cd-production.yml`, `cd-staging.yml`
- **Configurazione & Script:** `config/{default,development,staging,production}.env`, `scripts/{build-all,clean,db-migrate,db-seed,generate-certificates,test-all}.sh`
- **Docker & Observability:** `docker/server/entrypoint.sh`, `docker/nginx/{Dockerfile,nginx.conf,conf.d/*.conf}`, `docker/postgres/Dockerfile`, `docker/coturn/Dockerfile`, `docker/quic/Dockerfile`, `infra/logging/loki.yml`, `infra/monitoring/prometheus.yml`
- **Client public:** `client/public/index.html`
- **Documentazione tecnica:** `docs/adr/0001..0005.md`, `docs/api/{rest,udp-protocol,websocket}.md`, `docs/architecture/{game-loop,networking,overview,security}.md`, `docs/game-design/{battle-card,tournaments,ui-spec,uno-rules}.md`

### 2.3 Dipendenze & Sicurezza Pacchetti
- **`three@^0.170.0` + `@types/three` (client):** Presenti in `client/package.json` (`~600 KB+` di libreria installata in `node_modules`), ma hanno **`0` import in tutto `client/src/`**. La carta 3D in lobby usa CSS `rotateY` (`card-3d-spinner.ts`).
- **Audit npm (rilevato in build Docker `#33` e `#35`):** `26` vulnerabilità note nell'albero dev (`2 low, 16 moderate, 4 high, 4 critical`) e `16` nell'albero runtime produzione (`2 low, 10 moderate, 3 high, 1 critical`).

---

## 3. Diagnosi Progetto (Matrice Salute & Moduli Sconnessi)

### 3.1 Mappa di Integrazione dei Sottosistemi
| Sottosistema | Stato Reale | Dettaglio Diagnostico |
|---|---|---|
| **Auth JWT / Register / Login / Refresh** | **Operativo E2E** | Validato su Postgres + Redis live; `bcrypt`, cookie `HttpOnly`, revoca JTI e blacklist username funzionano. |
| **Motore UNO Core + AI Euristica** | **Operativo E2E** | `deck`, `rules`, `moves`, `reducer`, `decision-engine` coperti da 46 test dedicati; `UnoRoom` gioca turni completi 1P/2P. |
| **Social / Amici / Presence / Notifiche** | **Operativo E2E** | Repository + indici `LEAST/GREATEST` + Redis presence + `SocialDrawer` funzionanti e verificati su Postgres live. |
| **Shop / Inventory / Battle Card / Sfide / Tornei (REST+DB)** | **Operativo E2E (via API)** | Transazioni atomiche `FOR UPDATE`, rimborso doppioni e bracket UT32 funzionano via REST, **ma non ricevono mai progressione dalle partite**. |
| **Matchmaking Queue & MMR Settlement** | **Scritto ma Scollegato** | `matchmakingQueue`, `pushRedisQueueMember`, `cacheMatchmakingTicket` e `settleRankedMatchForPlayers` non sono collegati a nessuna rotta HTTP né a `UnoRoom`. |
| **Storico Partite / Replay / Mode Stats** | **Scritto ma Scollegato** | `recordFinishedMatch` esiste in `matches.ts`, ma nessuna room lo chiama a fine partita → `Carriera` resta sempre vuota. |
| **Anti-Cheat di Stanza (`RoomActionThrottle`)** | **Scritto ma Scollegato** | Classe esistente ma mai istanziata in `UnoRoom` o `AbstractMiniGameRoom`. |
| **WebRTC Voice / QUIC / UDP Telemetry** | **Scritto ma Scollegato** | Server UDP ascolta su `41234` (senza mapping UDP in `docker-compose.yml`!), mentre `webrtcSignaling`, `voiceRelay`, `WebRtcUdpClient`, `VoiceClient`, `QuicClient` e `/api/sync/ice-servers` non sono collegati a nessun componente di gioco/UI. |
| **7 Mini-Game Online (Colyseus)** | **Parziale** | Motori puri in `@uno/shared` validati; stanze `blackjack`/`scala40`/`scopa`/`minigame` definite su `server/src/index.ts`, ma `client/src/main.ts` per modalità `!== 'uno'` apre solo `openMiniGameSandboxModal()` locale (usando `V-Card` tab modal), senza connettersi a Colyseus. |
| **Tracing / Observability / CI-CD** | **Parziale / Vuoto** | `/api/health/detailed` e `/api/health/metrics` attivi; `startSpan` mai chiamato; pipeline `.github/workflows/*.yml` a `0 byte`. |

### 3.2 Elenco Completo dei Moduli con Zero Chiamanti Runtime
- **Server (`server/src`):** `settleRankedMatchForPlayers`, `recordFinishedMatch`, `matchmakingQueue`, `pushRedisQueueMember`, `findRedisQueueCandidates`, `removeRedisQueueMembers`, `cacheMatchmakingTicket`, `getMatchmakingTicket`, `MatchTimer`, `webrtcSignaling`, `voiceRelay`, `RoomActionThrottle`, `RATE_LIMIT_POLICIES`, `startSpan`, `getQuicEndpointStatus`, `getConfiguredOAuthProviders`.
- **Client (`client/src`):** `WebRtcUdpClient`, `VoiceClient`, `QuicClient`, `enqueueOfflineEvent`, `setActiveMatchMeta`, `getActiveMatchMeta`, `createDrawer`, `createToggle`, `createCardPanel`, `createButton`, `createBadge`, `applyNeonPulse`, `clearNeonPulse`, `fadeInElement`, `createModeSelector`, `createPlayerCountSelector`, `createRankedToggle`, `ReactiveStore`, `three`.

---

## 4. Analisi di Ottimizzazione (Performance, Memoria, Bundle & DB)

### 4.1 Database PostgreSQL — Query N+1 e Indici Mancanti
1. **N+1 ad ogni apertura/aggiornamento Sfide (`server/src/persistence/postgres/repositories/challenges.ts:39-53`):**
   `getOrInitPlayerChallenges()` esegue **6 `INSERT ... ON CONFLICT DO UPDATE` sequenziali in loop** (`await query(...)`) prima di una `SELECT`. Inoltre `incrementChallengeMetric()` chiama `getOrInitPlayerChallenges()` all'inizio, generando `6 + N` roundtrip SQL per ogni evento partita!
   - **Ottimizzazione:** Sostituire il loop con un'unica `INSERT ... SELECT * FROM UNNEST($1::varchar[], ...)` (1 solo roundtrip) oppure inizializzare una volta alla registrazione con cache per `playerId` in Redis fino al reset UTC successivo.
2. **Check ridondante e query non in transazione in `addBattleCardXp` (`battle-card.ts:66-85`):** Esegue `SELECT`, poi `UPDATE player_battle_cards`, poi `UPDATE players` fuori da una transazione atomica (`BEGIN/COMMIT`). In caso di completamento simultaneo di 2 sfide, c'è rischio di lost update su `xp`/`level`.
3. **Indice mancante su `economy_transactions (reference_id)` e `notifications (expires_at)`** per cleanup/audit periodico.

### 4.2 Server Memory Leaks (Mappe In-Memory Senza TTL / Cap)
Le seguenti strutture crescono indefinitamente in RAM al crescere di utenti e partite:
- `telemetryUdpServer.latestStats` (`telemetry-udp.ts:20`): nessuna scadenza; chiunque invii pacchetti UDP con ID diversi riempie la heap.
- `lobbyManager.lobbies` (`lobby-manager.ts:20`): le lobby private non vengono quasi mai rimosse (`deleteLobby` ha 0 chiamanti) e non hanno TTL di scadenza.
- `webrtcSignaling.queues` (`webrtc-signaling.ts:14`): accumula code per `${roomId}:${playerId}` se un peer si disconnette senza chiamare `drainSignals`.
- `memoryScores` (`leaderboard.ts:19`) & `ticketMemory` (`matchmaking-cache.ts:6`): nessuna politica LRU/max-size.

### 4.3 Client Bundle, Asset & Nginx HTTP Tuning
1. **Sourcemap pubblica da `1.15 MB` (`client/vite.config.ts:17`):** Disabilitare `sourcemap: true` in build produzione (o usare `sourcemap: 'hidden'`) taglia immediatamente l'esposizione di codice sorgente e traffico inutile.
2. **Assenza Code-Splitting:** Tutto il client (`283.70 kB`, gzip `82.25 kB`) è caricato al primo hit sulla Splash Screen (`TabShop`, `TabTournaments`, i 7 motori mini-game `@uno/shared`, ecc.). Usando `import()` dinamico per le 7 tab secondarie e i mini-game in `tab-controller.ts`, l'initial load della Splash/Auth può scendere sotto `~45 kB` gzip.
3. **Nginx Caching & Security Headers (`docker/client/nginx.conf`):**
   - Mancano `Cache-Control: public, max-age=31536000, immutable` su `/assets/*` (file con hash Vite) e `no-store` su `index.html`.
   - Mancano security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Content-Security-Policy`.
   - Manca mapping porta UDP `41234:41234/udp` in `docker-compose.yml` per `telemetryUdpServer` (attualmente aperto solo `19302-19312/udp`).

### 4.4 Warning Operativo Redis/Colyseus
- In `server/src/net/tcp/websocket-server.ts`, passare `{ host, port, password, enableReadyCheck: false }` o gestire i due client pub/sub separatamente elimina l'eccezione `Connection in subscriber mode, only subscriber commands may be used` visibile allo startup di `uno-server`.

---

## 5. Analisi Progettuale (Architettura & Manutenibilità)

1. **Mancanza dello strato `Services` (`server/src/services/`):**
   Oggi i repository (`repositories/*.ts`) contengono regole di business (es. estrazione drop delle casse in `inventory.ts`, calcolo livelli Battle Card in `battle-card.ts`, costruzione bracket in `tournaments.ts`), mentre `UnoRoom` e `rest-routes/*.ts` parlano direttamente coi repository o non si parlano affatto. Introdurre servizi di dominio dedicati (`MatchSettlementService`, `MatchmakingService`, `TournamentOrchestratorService`) eliminerebbe l'accoppiamento e risolverebbe la frattura con `UnoRoom`.
2. **Duplicazione Componenti UI nel Client:**
   Esistono **due implementazioni parallele** per gli stessi controlli: `launcher.ts` implementa inline select modalità, pill giocatori e toggle ranked, mentre `mode-selector.ts`, `player-count-selector.ts`, `ranked-toggle.ts` esistono come moduli separati non usati da `launcher.ts`. Analogamente, `modal.ts`/`drawer.ts`/`button.ts`/`card.ts` non sono usati in modo uniforme da `auth-screen.ts`, `social-drawer.ts` o `table.ts`.
3. **Frammentazione Stato Client:**
   `profile-store.ts` mantiene un `PlayerProfile` statico dal login (`mmr`, `vcard`, `battleCardLevel`) che **non si aggiorna** quando `inventory-store.ts` spende o guadagna V-Card (o viceversa, nella Home `tab-play.ts` legge `profile.battleCardLevel` e `profile.mmr` che restano congelati fino a ri-login!). Serve un unico stato sincronizzato o un'azione `refreshProfileFromServer()`.
4. **Trasparenza Stato Specifica (`file-implementazione-massiccia.md`):**
   La tabella §1 del blueprint segna `✅ Completato` su `IMP-011`, `IMP-014`, `IMP-015`, `IMP-018`, `IMP-022`, `IMP-024`, `IMP-025`, `IMP-026`, pur trattandosi in molti casi di moduli creati ma privi di integrazione E2E nel flusso di gioco reale.

---

## 6. Analisi di Contenuto (Copertura Reale vs `contenuto-game.md`)

| Sezione Spec (`contenuto-game.md`) | Copertura E2E Reale | Cosa Funziona Oggi | Cosa Manca Davvero Rispetto alla Specifica |
|---|---|---|---|
| **§2 UX, Flussi & Accessibilità WCAG** | **~65%** | Splash (`AVANZA`/`INVIO`), Auth, 8 tab navigabili, NewsTicker modale, `ESC` globale, `role="dialog"`. | Modale Impostazioni a **5 tab** (Audio, Video, Gameplay, Controlli, Accessibilità); gestione focus-trap completa nelle modali, alto contrasto/screen-reader live region su tavolo di gioco, 3D real-time Three.js reale. |
| **§3 Meccaniche UNO & Varianti** | **~75%** | Mazzo 108 carte, `stackingCap`, `Wild +4` challenge, `callUno`, AI 3 profili, Zod `CustomMatchConfigSchema` + preset `blitz`/`chaos`/`team`/`custom`. | Le regole **`Chaos` (cambio regola/flip ogni N turni)** e **`Team 2v2` (vittoria condivisa di squadra + vista mano alleato)** esistono solo nello schema Zod, **non nel motore `moves.ts`/`UnoRoom`**. |
| **§4 Catalogo 8 Giochi + Pentathlon** | **~50%** | Tutti i 7 motori puri (`blackjack`, `scala40`, `ruba-mazzetto`, `scopa`, `poker-texas`, `burraco`, `mille-miglia`) + `Pentathlon` in `@uno/shared` con test unitari; stanze base server; sandbox JSON in tab V-Card. | **Interfaccia grafica giocabile (carte visive) per i 7 mini-game** (oggi `openMiniGameSandboxModal` stampa JSON grezzo!), matchmaking/lancio online reale verso le room Colyseus dei mini-game e orchestratore live `Pentathlon` a 5 round. |
| **§5 Economia, Negozio, Armadietto, V-Card** | **~75%** | Ledger Postgres atomico `FOR UPDATE`, acquisto cosmetici, doppioni `×N` con rimborso, rotazione giornaliera, equipaggiamento DB, UI Shop/Armadietto/V-Card. | Sincronizzazione visiva dei cosmetici equipaggiati su **`table.ts` (dorsi/cornici/avatar reali durante la partita)**; rimozione del fallback fake V-Card offline su errore API in `tab-shop.ts`. |
| **§6 Battle Card, Stagioni, Sfide, Carriera** | **~55%** | Schema & API Battle Card 1–100 (1000/1500/Sblocca tutto), 500+500 V-Card payout, Sfide Daily/Weekly, UI tabs. | **Zero progressione reale dalle partite UNO**; mancano i **5 tab Trofei & Feats** in Carriera, curva XP multilivello account, eventi `2XP` weekend, soft-reset stagionale e **Replay Player** interattivo sui match salvati. |
| **§7 Ranked, ELO, MMR, Leaderboard** | **~45%** | 22 tier (`Bronze I`..`SSL` 1600), `calculateEloDelta`, `getTopLeaderboard` Redis ZSET + DB. | Settling automatico a fine partita (`settleRankedMatchForPlayers` orfano), **35 playlist `mmrP` separate**, **Placement Matches**, Bot boost/drift `±20` in leaderboard, mismatch `init.sql` (`DEFAULT 200` vs `0`). |
| **§8 Tornei & UCS** | **~50%** | 5 preset (`UT32`, `Grand Prix`, `Classico`, `Pentathlon`, `UCS SSL`), iscrizione DB con fee, bracket 2 ali, Shop casse 100/500/1000. | **Motore di avanzamento automatico dei round del torneo**, spawn automatico delle stanze match per ogni coppia del bracket, assegnazione premi finale e restrizione admin sulla creazione tornei. |
| **§9 Bot AI + Gemini Native** | **~70%** | 3 profili deterministici + `GeminiBotAdvisor` server-side dietro `ENABLE_GEMINI_BOTS`, privacy prompt (solo mano bot), guardrail indice legale, `bot_social_profiles`. | **Ecosistema sociale bot completo** (Bond `0–10` per giocatore, Reputazione a 4 pilastri, Club dei bot) e configurazione di `botMMR` reale per partita invece della mappa statica da `botDifficulty`. |
| **§10–11 Multiplayer, Docker, UDP, Spectator, Rematch** | **~55%** | Stack Docker 5 container live (`http://localhost`), auth JWT+Refresh, RedisPresence, `UnoRoom` reconnect 30s, `telemetry-udp`, CoTURN HMAC. | Cablaggio effettivo di **Matchmaking queue**, **Spectator Mode** in `UnoRoom`/`table.ts`, **Rematch 1-tap** post-partita, **WebRTC/Voice in-game**, port mapping UDP `41234` in Docker, sicurezza `/api/sync/offline-batch` e rimozione `44` file operativi/CI vuoti. |

---

## 7. Piano di Bonifica & Azione Consigliata (Prima di Scrivere Codice)

Se approvi l'intervento di bonifica, l'ordine di esecuzione più sicuro e ad alto impatto è il seguente:

1. **Fase P0 — Sicurezza & Loop Vitale (Priorità Assoluta):**
   - Chiudere l'exploit `/api/sync/offline-batch` (validazione firma/limiti rigorosi + rate limiting su tutte le route economiche/tornei + admin guard su `POST /api/tournaments`).
   - Creare `MatchSettlementService` e collegarlo a `UnoRoom` (`MATCH_ENDED`) e alle mini-game room per aggiornare **MMR + Storico/Replay + Battle Card XP + Sfide**.
   - Istanziare `RoomActionThrottle` in `UnoRoom.registerMessageHandlers()` e `AbstractMiniGameRoom`.
   - Allineare `docker/postgres/init.sql` (`mmr DEFAULT 0`, `rank_tier VARCHAR(30)`) + aggiungere `pg_advisory_lock` in `migrate.ts`.
2. **Fase P1 — Infra, Performance & Cleanup Client:**
   - Risolvere il warning subscriber `ioredis` in `websocket-server.ts`, disabilitare sourcemap pubblica (`sourcemap: false` o `hidden`), aggiungere security/cache headers in `nginx.conf`, esporre porta UDP `41234` o rimuovere servizi morti, e sostituire i `6` query loop in `challenges.ts` con un batch upsert.
   - Sanitizzare ogni `innerHTML` nel client sostituendolo con DOM API sicure (`textContent`), rimuovere il finto saldo offline in `tab-shop.ts`, sincronizzare `profile-store` ↔ `inventory-store` e rimuovere `three` finché non usato (o montarlo davvero in `card-3d-spinner.ts`).
3. **Fase P2 — Feature & Contenuto Mancanti:**
   - Cablare Matchmaking reale (`/api/matchmaking/*`), `Chaos`/`Team 2v2` nel motore UNO, Spectator & Rematch 1-tap in `UnoRoom`/`table.ts`, UI carte visuale per i 7 mini-game connessi alle room Colyseus, Modale Impostazioni 5 tab, Trofei & Replay Viewer, Orchestratore Tornei automatico e WebRTC Voice UI in partita.
4. **Fase P3 — DevOps & Test:**
   - Popolare `.github/workflows/ci.yml`, `README.md`, `docker/server/entrypoint.sh` e aggiungere test unitari/E2E browser (`@uno/client` + flusso completo UNO/Economia).

---

## 8. Aggiornamento Post-Bonifica P0 + P1 (Verificato Live)

Tutte le vulnerabilità **P0** e le ottimizzazioni **P1** elencate nelle Sezioni 1–5 sono state applicate e verificate sia via test automatizzati che sullo stack Docker live (`uno-postgres`, `uno-redis`, `uno-coturn`, `uno-server`, `uno-client`):

- **Chiuso exploit `/api/sync/offline-batch`:** `sync.ts` ignora i delta client e assegna ricompense autoritative server-side (`15`/`5` V-Card, `120`/`60` XP), limite giornaliero `10` eventi/UTC e rate limit (`5/min`). Verificato live su Docker (`Sync Result: {"applied":1,"totalXp":120,"totalVCard":15,"remainingDailyQuota":9}`).
- **Rate limit & Guardie REST:** Applicato `createRateLimiter` su `/api/shop/*`, `/api/battle-card/*`, `/api/challenges/claim`, `/api/tournaments/*` e blocco `403` sui tornei `ucs-ssl` per utenti non admin (`ADMIN_PLAYER_IDS`).
- **Match Settlement & Anti-Cheat in Room:** Creato `server/src/services/match-settlement.ts` (`settleFinishedMatch`) e collegato a `UnoRoom` (`MATCH_ENDED`) e `AbstractMiniGameRoom`; attivati `RoomActionThrottle` e sync cosmetici loadout in `PlayerState`.
- **DB Defaults & Multi-Node Lock:** Allineato `docker/postgres/init.sql`, aggiunta migrazione `0008_defaults_and_indexes.sql` (`mmr DEFAULT 0`, `rank_tier VARCHAR(30)`, indici di audit) e `pg_advisory_lock(78234109)` in `migrate.ts`. Verificato live: nuovi utenti registrati con `mmr = 0`.
- **SQL & Memory Leaks:** Batch `UNNEST` in `challenges.ts`, transazione `FOR UPDATE` in `addBattleCardXp`, TTL + cap in-memory su `telemetry-udp.ts`, `lobby-manager.ts`, `webrtc-signaling.ts`, `leaderboard.ts`, `matchmaking-cache.ts`, porta UDP `41234` esposta in `docker-compose.yml` e fix `enableReadyCheck: false` in `websocket-server.ts` (zero errori `ioredis` nei log live di `uno-server`).
- **Hardening & Bundle Client:** `sourcemap: false` in `vite.config.ts` (`0` file `.map` esposti), security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`) e cache immutabile `/assets/` in `nginx.conf`, rimozione finto saldo offline in `inventory-store.ts`/`tab-shop.ts`, sanitizzazione DOM (`textContent`) su leaderboard/bracket/armadietto/carriera/tavolo e code-splitting delle tab in `tab-controller.ts` + `main.ts`.
- **Build & Test Post-Bonifica:** `npm run build && npm run test` -> **exit `0`** (`@uno/shared` `8` file / `74` passati; `@uno/server` `5` file / `33` passati).
