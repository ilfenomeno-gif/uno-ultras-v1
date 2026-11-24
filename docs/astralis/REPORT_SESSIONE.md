# Diario di Sessione — UNO ULTRA (Cronologia Inversa)

Registro operativo con gating a tre stati: `[ ]` aperto, `[/]` in corso, `[x]` verificato e chiuso.

---

## Sessione 2026-11-24 (Parte 10) — Fix Loop Uscita, Schermate Vittoria & Sistema Progressione MCP Unificato

- **Obiettivo**: risolvere il loop infinito `"Connessione alla partita…"` all'uscita dalla partita, aggiungere una vera schermata Vittoria/Sconfitta con accredito punti sia su UNO che sui 7 mini-giochi, e collegare un sistema MCP centrale tra **Rank**, **Match**, **MMR (Matchmaking)**, **Modalità**, **Sfide**, **Battle Card** e **Valute**.
- **Stato Lavori**:
  - `[x]` Contratto `MatchRewardReceipt` in `shared/src/protocol/messages.ts` incluso in `MatchEndedMessage`.
  - `[x]` Hub MCP autoritativo in `server/src/services/match-settlement.ts` (`MODE_REWARD_MULTIPLIERS`, `resolveModeMultiplier`, `settleFinishedMatchWithReceipts`) collegato a `UnoRoom` (`server/src/rooms/uno/uno-room.ts`) ed esposto anche via REST in `server/src/net/tcp/rest-routes/progression.ts` (`POST /api/progression/settle-match`, `GET /api/progression/snapshot`).
  - `[x]` Risoluzione loop uscita: sblocco garantito in `finally` in `client/src/ui/play/launcher.ts`, timeout + azzeramento stanza in `client/src/net/tcp/colyseus-client.ts` e guardia `exiting` in `client/src/game-view/table.ts`.
  - `[x]` Schermate Vittoria & sincronizzazione profilo (`patchProfile` con MMR, Grado, V-Card e livello Battle Card) su UNO (`client/src/game-view/table.ts`) e sui 7 mini-giochi (`client/src/ui/minigames/sandbox-modal.ts` + `client/src/styles/minigames.css` + `client/src/net/tcp/rest-client.ts`).
  - `[x]` Test dedicati in `server/tests/integration/progression-mcp.test.ts` (`4` test) e `npm run ci` verde (`23` suite Vitest / `155` test passati: shared `74`, server `37`, client `44`; `0` errori ESLint/TS; Vite `174` moduli `index-DDGIFS4c.js` / `index-Nx8hFItU.css`) + SHA-256 `contenuto-game.md` intatto (`83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`).
  - `[x]` Rebuild offline e riavvio completo su Docker di entrambi i container `uno-server` (`shared/dist` + `server/dist`) e `uno-client` (`client/dist`).

---

## Sessione 2026-11-24 (Parte 9) — 7 Mini-Giochi a Schermo Intero Cyber-Arcade (`100vw × 100vh`) (`32c3ba5`)

- **Obiettivo**: convertire tutti e 7 i tavoli dei mini-giochi (`Blackjack 21`, `Scala 40`, `Scopa Classica`, `Ruba Mazzetto`, `Poker Texas Hold'em`, `Burraco Online`, `Mille Miglia 1000`) da piccoli popup modali centrati a vere schermate a schermo intero (`100vw × 100vh`) con HUD superiore minimale (`requestFullscreen()`, `Esci`, punteggi live), interazione diretta sulle carte ed etichette naturali in italiano.
- **Stato Lavori**:
  - `[x]` Helper puri in `client/src/ui/minigames/minigame-helpers.ts` (`formatMiniGameActionLabel`, `findCardActions`, `formatStandardCardLabel`, `formatMilleCardMeta`, `formatMilleHazardLabel`, `computeBlackjackTotal`, `formatScoreSummary`) con zero stringhe interne `draw_stock` / `play_safety(...)` esposte.
  - `[x]` Foglio di stile dedicato `client/src/styles/minigames.css` importato in `client/src/main.ts`: overlay `.mg-fs-stage` a `100vw × 100vh` (`position: fixed; inset: 0; z-index: 9999;`) con plance dedicate (tavolo semicircolare Blackjack, feltro Scala 40, tavolo neon Scopa/Ruba Mazzetto, ovale VIP Poker, plancia Burraco con Pozzetti, doppia pista Mille Miglia `0/1000 km`) e rimozione delle vecchie regole `.mg-*` modali da `client/src/styles/shop.css`.
  - `[x]` Refactoring completo di `client/src/ui/minigames/sandbox-modal.ts` in overlay full-screen `.mg-fs-stage` (`100vw × 100vh`), supporto Browser Fullscreen API, click diretto sulle carte in mano/mazzo/scarti, Zero Focus Drop (`aria-disabled`), `AriaLiveOrchestrator`, earcons ed uscita pulita con `ESC`.
  - `[x]` Test dedicati in `client/tests/minigames-ui.test.ts` (`5` test) e `npm run ci` verde (`22` suite Vitest / `151` test passati: shared `74`, server `33`, client `44`; `0` errori ESLint/TS; Vite `174` moduli) + SHA-256 `contenuto-game.md` intatto (`83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`).
  - `[x]` Aggiornamento live container Docker `uno-client` con bundle `index-D5wtu8-n.js` / `index-Be5vOo2F.css` servito su `http://localhost/`.

---

## Sessione 2026-11-24 (Parte 8) — Store Valuta V-Card, Estrazione Mini-Giochi & Dev Grants Sicuri (`1e0b35a`)

- **Obiettivo**: riconvertire la scheda `V-Card` nello Store Valuta dedicato ai 4 pacchetti scalari (`500`, `1.000 + 100`, `2.800 + 400`, `6.500 + 1.500`) con artwork SVG e rarità (`rare`, `epic`, `legendary`, `mythic`), spostare i 7 Mini-Giochi in un modulo dedicato lanciabile da `Gioca` e predisporre il servizio di accredito sicuro protetto da `ENABLE_DEV_CURRENCY_GRANTS` (spento di default, bloccato in produzione).
- **Stato Lavori**:
  - `[x]` Catalogo `VCARD_PACKS` in `shared/src/types/economy.ts`, gate `ENABLE_DEV_CURRENCY_GRANTS` in `server/src/config/env.ts`, servizio riutilizzabile `fulfillVCardPackGrant` (`admin_grant` + metadata idempotenti) in `server/src/services/currency-grant.ts` ed endpoint `/api/shop/vcard-packs` + `/api/shop/vcard-packs/grant` in `server/src/net/tcp/rest-routes/shop.ts`.
  - `[x]` Estrazione 7 tavoli visuali Mini-Giochi in `client/src/ui/minigames/sandbox-modal.ts` collegato a `client/src/main.ts` (zero warning Vite).
  - `[x]` Artwork crescenti in `client/src/ui/navigation/vcard-artworks.ts`, Store `V-Card` in `client/src/ui/navigation/tab-vcard.ts` (saldo live, stato pagamenti onesto `Pagamenti non ancora attivi`, Zero Focus Drop) e stili 4 colonne in `client/src/styles/shop.css`.
  - `[x]` Test in `client/tests/vcard-store.test.ts` (`3` test) e `npm run ci` verde (`21` suite Vitest / `146` test passati: shared `74`, server `33`, client `39`; `0` errori ESLint/TS) + SHA-256 `contenuto-game.md` intatto (`83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`).
  - `[x]` Aggiornamento live Docker `uno-server` e `uno-client` con i 5 container operativi.

---

## Sessione 2026-11-24 (Parte 7) — Schermata Carriera a 3 Colonne (Cosmetici, KPI & Cronologia) (`f3369da`)

- **Obiettivo**: progettare la schermata `Carriera` a tre colonne allineata ai cosmetici equipaggiati in Armadietto (`avatar`, `frame`, `title`), progressione verso Supersonic Legend (`1600+ MMR`), griglia statistiche 2×2 ad alta leggibilità e cronologia partite con esito, delta MMR e Replay.
- **Stato Lavori**:
  - `[x]` Helper puri in `client/src/ui/navigation/career-helpers.ts` (`aggregateCareerStats`, `computeSslProgressPercent`, `resolveCareerFrameClass`, `formatMatchOutcome`, `formatMmrDelta`).
  - `[x]` Nuova vista `Carriera` a 3 colonne in `client/src/ui/navigation/tab-career.ts` (identità estetica live da `inventory-store` / `fetchInventory`, cornice oro pulsante/prisma, barra MMR tier + SSL, griglia KPI 2×2 + rendimento per modalità, cronologia partite con `Replay` e Classifica Top 100) e stili in `client/src/styles/tournaments.css`.
  - `[x]` Test in `client/tests/career-state.test.ts` (`4` test) e `npm run ci` verde (`20` suite Vitest / `143` test passati: shared `74`, server `33`, client `36`; `0` errori ESLint/TS) + SHA-256 `contenuto-game.md` intatto (`83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`).
  - `[x]` Aggiornamento live di `uno-ultra-client` e riavvio container `uno-client` su Docker con tutti i 5 servizi attivi.

---

## Sessione 2026-11-24 (Parte 6) — Schermata Tornei, Banner UCS Weekend & Casse Crediti Torneo (`b25bd50`)

- **Obiettivo**: implementare la schermata `Tornei` con banner evento principale (`TORNEO UCS WEEKEND` e conto alla rovescia), griglia tornei programmati per fascia (`Bronzo`, `Arena`, `SSL`), cassa adattiva al grado attuale e riscatto delle Casse Torneo con `Crediti Torneo` anche lato server.
- **Stato Lavori**:
  - `[x]` Supporto `tournament_credits` (oltre a copia posseduta a costo `0` o `vcard`) in `openCatalogCrate` su `server/src/persistence/postgres/repositories/inventory.ts`, `server/src/net/tcp/rest-routes/shop.ts` e `client/src/net/tcp/rest-client.ts`.
  - `[x]` Helper puri in `client/src/ui/tournament/tournament-helpers.ts`, pannello casse con artwork SVG e Crediti Torneo in `client/src/ui/tournament/tournament-shop.ts`, nuova vista in `client/src/ui/navigation/tab-tournaments.ts` e stili in `client/src/styles/tournaments.css`.
  - `[x]` Test in `client/tests/tournaments-state.test.ts` (`4` test) e `npm run ci` verde (`19` suite Vitest / `139` test passati: shared `74`, server `33`, client `32`; `0` errori ESLint/TS) + SHA-256 `contenuto-game.md` intatto (`83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`).
  - `[x]` Aggiornamento live immagini e container Docker (`uno-server` con `shared/dist`, `server/dist`, `0009_seasonal_challenges.sql`, e `uno-client` con bundle unificato `index-BOFfUj4P.js`); tutti i 5 container operativi.

---

## Sessione 2026-11-24 (Parte 5) — Schermata Sfide Stagionale, Filtri Temporali & Ricompense (`ccd9136`)

- **Obiettivo**: progettare la schermata `Sfide` coerente con lo sfondo stellato di UNO ULTRA, dotata di banner stagionale (`STAGIONE 1 ATTIVA — Scala la classifica fino a Supersonic Legend (1600+ MMR)!`), filtri temporali `Giornalieri` / `Settimanali` / `Stagionali` e card con progresso, chip XP / V-Card e pulsante `Riscatta`.
- **Stato Lavori**:
  - `[x]` Contratto `SEASONAL_CHALLENGES_POOL` (`seasonal`) in `shared/src/types/economy.ts`, migrazione SQL idempotente `server/src/persistence/postgres/migrations/0009_seasonal_challenges.sql`, repository `server/src/persistence/postgres/repositories/challenges.ts` e tipo in `client/src/net/tcp/rest-client.ts`.
  - `[x]` Helper puri in `client/src/ui/navigation/challenges-helpers.ts`, nuova vista in `client/src/ui/navigation/tab-challenges.ts` (banner stagionale, tab Safe Loop, Zero Focus Drop, aggiornamento saldo V-Card, `AriaLiveOrchestrator`, earcons) e tema stellato in `client/src/styles/shop.css`.
  - `[x]` Test in `client/tests/challenges-state.test.ts` (`5` test) e `npm run ci` verde (`18` suite Vitest / `135` test passati: shared `74`, server `33`, client `28`; `0` errori ESLint/TS) + SHA-256 `contenuto-game.md` invariato (`83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`).
  - `[ ]` Aggiornamento container Docker (`uno-server`, `uno-client`) da eseguire con Docker Desktop avviato dall'utente.

---

## Sessione 2026-11-24 (Parte 4) — Caricamento Sincrono Schede & Error Boundary (`1d24ae3`)

- **Obiettivo**: eliminare il rischio di schermate bianche su `Negozio`, `Armadietto`, `Battle Card`, `Sfide`, `Tornei`, `Carriera` e `V-Card` dovute a import dinamici non gestiti o chunk scaduti dopo rebuild/arresto container.
- **Stato Lavori**:
  - `[x]` Rimozione dei chunk dinamici senza `.catch()` in `client/src/ui/navigation/tab-controller.ts`: tutte le 8 schede vengono ora importate in modo sincrono con error boundary visivo di fallback.
  - `[x]` Verifica `npm run ci` verde (`17` suite Vitest / `130` test passati; bundle unificato client `341.81 kB` / `97.60 kB` gzip; `0` errori ESLint/TS) e SHA-256 `contenuto-game.md` intatto (`83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`).
  - `[x]` Aggiornamento immagine Docker locale `uno-ultra-client:latest` su disco con il bundle unificato.

---

## Sessione 2026-11-24 (Parte 3) — Armadietto Olografico a 3 Colonne & Riscatto Casse (`a7b81d0`)

- **Obiettivo**: progettare la schermata `Armadietto` a tre colonne (menu categorie a sinistra con `Avatar`, `Dorsi Carte`, `Cornici`, `Tavoli`, `Titoli`, `Casse`; vetrina centrale su piedistallo olografico con pulsante dinamico `EQUIPAGGIATO` / `EQUIPAGGIA` / `APRI CASSA`; griglia inventario a destra con cornici e targhette rarità), aggiungere il riscatto a costo `0` delle casse possedute lato server e lo slot `theme` nello store client.
- **Stato Lavori**:
  - `[x]` Riscatto atomico casse già possedute (`crateCost = 0`) e filtro `quantity > 0` in `server/src/persistence/postgres/repositories/inventory.ts`, più slot `theme` in `client/src/state/inventory-store.ts`.
  - `[x]` Logica pura e testabile in `client/src/ui/navigation/locker-helpers.ts` e vista 3 colonne completa in `client/src/ui/navigation/tab-locker.ts` (Safe Loop verticale, Zero Focus Drop, `AriaLiveOrchestrator`, earcons, unboxing casse live).
  - `[x]` Layout 3 colonne e stile piedistallo olografico + griglia rarità in `client/src/styles/shop.css`, più rimozione direttiva esterna non usata `# syntax=docker/dockerfile:1.7` dai Dockerfile di `server` e `client`.
  - `[x]` Test in `client/tests/locker-state.test.ts` (`4` test) e `npm run ci` verde (`17` suite Vitest / `130` test passati: shared `74`, server `33`, client `23`; Vite `168` moduli; `0` errori ESLint/TS) + integrità `contenuto-game.md` (`83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`).
  - `[x]` Aggiornamento offline immagini Docker `uno-ultra-server` / `uno-ultra-client` dai build verificati e riavvio completo dei 5 container (`uno-client`, `uno-server`, `uno-postgres`, `uno-redis`, `uno-coturn`).

---

## Sessione 2026-11-24 (Parte 2) — Redesign Negozio Cosmetico Arcade Neon (`1d36046`, `87805a3`)

- **Obiettivo**: applicare il concept arcade/cyberpunk a schermo pieno nel tab Negozio con illustrazioni dedicate per ciascuno dei 13 oggetti, bordi e bagliori legati alla rarità (`common`, `rare`, `epic`, `legendary`, `mythic` prismatico), top-bar angolata competitiva e badge luminosi per valute e casse.
- **Stato Lavori**:
  - `[x]` Registro SVG vettoriale dedicato per tutti i 13 `CATALOG_ITEMS` con `<defs>` univoci in `client/src/ui/navigation/shop-artworks.ts`.
  - `[x]` Nuova vista `Negozio` arcade in `client/src/ui/navigation/tab-shop.ts` (header luminoso V-Card / Crediti Torneo / Casse Speciali, filtri Safe Loop tastiera, card collezionabili per rarità, Zero Focus Drop, `AriaLiveOrchestrator` ed earcons).
  - `[x]` Stile arcade/neon a schermo pieno in `client/src/styles/lobby.css` e `client/src/styles/shop.css` (tab angolati competitivi, pavimento synthwave, card `mythic` iridescente/olografica).
  - `[x]` Test dedicati in `client/tests/shop-artworks.test.ts` (`3` test) e `npm run ci` verde (`16` suite Vitest / `126` test passati: shared `74`, server `33`, client `19`; Vite `167` moduli; `0` errori/warning ESLint e TS).
  - `[x]` Integrità `contenuto-game.md` invariata (`83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`) e rebuild live del container Docker `uno-client` verificato attivo con tutti i 5 container online.

---

## Sessione 2026-11-24 — Adozione Completa ASTRALIS v3 (`8f7eac8`)

- **Obiettivo**: integrare governance ASTRALIS v3 (Hub and Spoke), sonificazione Web Audio procedurale sicura (`0.75` max + ducking), Single-Voice-Authority (`AriaLiveOrchestrator`) con Purge-on-Close, Zero Focus Drop, Safe Loop tastiera/Numpad + `1..9/0/-/=`, ordinamento reale mano e UI onesta nelle impostazioni.
- **Stato Lavori**:
  - `[x]` Creazione router e documenti ASTRALIS (`GEMINI.md`, `AGENTS.md`, `docs/astralis/user_preferences.md`, `docs/astralis/REPORT_SESSIONE.md`).
  - `[x]` Implementazione moduli client (`audio-earcons.ts`, `aria-live.ts`, `keyboard-nav.ts`).
  - `[x]` Collegamento UI/Gioco (`settings-modal.ts`, `modal.ts`, `hand.ts`, `action-hints.ts`, `table.ts`, `top-bar.ts`, `main.ts`, `card-format.ts`, CSS).
  - `[x]` Test unitari (`client/tests/astralis-a11y.test.ts` — `9` test), verifica `npm run ci` verde (`15` suite Vitest / `123` test totali: shared `74`, server `33`, client `16`; Vite `166` moduli; `0` errori/warning ESLint e TS) e integrità `contenuto-game.md` (`83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`).
  - `[x]` Avvio Docker Desktop persistente e rebuild completo dei container `server` e `client` con tutti i 5 servizi attivi (`uno-postgres`, `uno-redis`, `uno-coturn`, `uno-server`, `uno-client`).

---

## Sessione Precedente — Fase P2 (`bbc88ae`)

- `[x]` API Matchmaking e modali varianti UNO (`standard`, `blitz`, `chaos`, `team`, `custom`).
- `[x]` Rivincita 1-tap, modalità spettatore e banner Chaos Flip in `table.ts`.
- `[x]` Tavoli visivi per 7 mini-giochi in `tab-vcard.ts` e Replay Viewer in `tab-career.ts`.
- `[x]` Modale Impostazioni a 5 schede e suite `npm run ci` verde (`14` suite Vitest / `114` test).

---

## Sessioni Iniziali — Tooling, CI e Monorepo P0+P1 (`c4e8946`, `a09e532`, `6b5981e`)

- `[x]` Implementazione completa `@uno/shared`, `@uno/server` e `@uno/client`.
- `[x]` Hardening P0+P1, migrazioni PostgreSQL `0001`..`0008`, Redis e CoTURN su Docker.
- `[x]` Configurazione ESLint 9 flat config, Prettier, script cross-platform `concurrently`, `README.md`, `CHANGELOG.md` e `.github/workflows/ci.yml`.
