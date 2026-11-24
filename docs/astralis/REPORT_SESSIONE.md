# Diario di Sessione — UNO ULTRA (Cronologia Inversa)

Registro operativo con gating a tre stati: `[ ]` aperto, `[/]` in corso, `[x]` verificato e chiuso.

---

## Sessione 2026-11-24 — Adozione Completa ASTRALIS v3 (Opzione C)

- **Obiettivo**: integrare governance ASTRALIS v3 (Hub and Spoke), sonificazione Web Audio procedurale sicura (`0.75` max + ducking), Single-Voice-Authority (`AriaLiveOrchestrator`) con Purge-on-Close, Zero Focus Drop, Safe Loop tastiera/Numpad + `1..9/0/-/=`, ordinamento reale mano e UI onesta nelle impostazioni.
- **Stato Lavori**:
  - `[x]` Creazione router e documenti ASTRALIS (`GEMINI.md`, `AGENTS.md`, `docs/astralis/user_preferences.md`, `docs/astralis/REPORT_SESSIONE.md`).
  - `[x]` Implementazione moduli client (`audio-earcons.ts`, `aria-live.ts`, `keyboard-nav.ts`).
  - `[x]` Collegamento UI/Gioco (`settings-modal.ts`, `modal.ts`, `hand.ts`, `action-hints.ts`, `table.ts`, `top-bar.ts`, `main.ts`, `card-format.ts`, CSS).
  - `[x]` Test unitari (`client/tests/astralis-a11y.test.ts` — `9` test), verifica `npm run ci` verde (`15` suite Vitest / `123` test totali: shared `74`, server `33`, client `16`; Vite `166` moduli; `0` errori/warning ESLint e TS) e integrità `contenuto-game.md` (`83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`).
  - `[ ]` Rebuild Docker (`server`, `client`) e verifica health HTTP (in attesa di avvio Docker Desktop sul host; daemon non connesso su `//./pipe/dockerDesktopLinuxEngine`).

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
