# Diario di Sessione — UNO ULTRA (Cronologia Inversa)

Registro operativo con gating a tre stati: `[ ]` aperto, `[/]` in corso, `[x]` verificato e chiuso.

---

## Sessione 2026-11-24 (Parte 3) — Armadietto Olografico a 3 Colonne & Riscatto Casse

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
