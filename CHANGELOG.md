# Changelog

Tutte le modifiche rilevanti a **UNO ULTRA** vengono tracciate in questo file.

## [0.1.0] — 2026-11-24

### Added
- **@uno/shared:** Motore deterministico UNO (`deck`, `rules`, `state`, `moves`, `reducer`), 22 tier Ranked (`Bronze I` → `SSL` a `1600 MMR`) + formula ELO adattiva, AI deterministica (`AGGR`, `CONS`, `STRAT`), 7 motori mini-game + `Pentathlon`, schemi Colyseus e validatori Zod (`auth`, `match`, `lobby`, `custom-rules`).
- **@uno/server:** API Express + Colyseus `0.16` multi-nodo (`RedisPresence`, `RedisDriver`), migrazioni SQL idempotenti `0001`–`0008` con advisory lock, ledger economico atomico (`FOR UPDATE`), sistema Social/Friends/Blocks/Notifications/Presence, Battle Card Lv. 1–100, Tornei `UT32` 2 ali, `GeminiBotAdvisor` opzionale dietro `ENABLE_GEMINI_BOTS`, `MatchSettlementService`, `RoomActionThrottle` e moduli UDP/CoTURN.
- **@uno/client:** SPA Vanilla TypeScript + Vite 6 con Splash/Auth/TopBar/NewsTicker, tavolo UNO giocabile e tutte le 8 tab con lazy code-splitting e zero sourcemap pubbliche in produzione.
- **Docker & CI/Tooling:** Stack Compose a 5 container (`postgres`, `redis`, `coturn`, `server`, `client` Nginx con security headers), ESLint 9 flat config (`eslint.config.mjs`), script cross-platform (`concurrently`, `typecheck`, `ci`), workflow GitHub Actions (`ci.yml`) e suite Vitest per `shared`, `server` e `client`.

### Security
- Rimozione ricompense client-forged su `POST /api/sync/offline-batch` con calcolo autoritativo server-side e cap giornaliero.
- Rate limiting sulle rotte economiche/tornei e guardia admin per `ucs-ssl`.
- Sanitizzazione DOM (`textContent`) sui componenti client dinamici.
