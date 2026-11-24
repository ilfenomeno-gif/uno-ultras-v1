# uno-ultras-v1
# UNO ULTRA (`uno-ultras-v1`)

Monorepo TypeScript per **UNO ULTRA**, piattaforma card game competitiva con server autoritativo, sistema ranked 22-tier, economia virtuale atomica (`V-Card`, zero real-money) e 7 mini-game deterministici aggiuntivi.

> **Nota Legale / Branding:** Prototipo tecnico personale e non commerciale a scopo educativo/ingegneristico. `UNO` e i marchi correlati appartengono ai rispettivi proprietari (Mattel); prima di qualsiasi pubblicazione pubblica o su store occorre definire un branding proprietario originale.

---

## Architettura di Rete (WebSocket autoritativo vs UDP/WebRTC)

Il browser **non** usa socket TCP/UDP grezzi per giocare a carte:
- **Gameplay & Stato Autoritativo (TCP / HTTP / WebSocket):** Tutte le azioni di partita (`play_card`, `draw_card`, `call_uno`, `challenge_wild4`), auth JWT, economia Postgres ACID e social/presence Redis viaggiano su **Express REST (`/api/*`) + Colyseus WebSocket (`/ws`, `/matchmake/`)**. Le mani private non entrano mai nello state pubblico sincronizzato.
- **Canale Real-Time Opzionale (WebRTC / CoTURN / UDP):** Riservato esclusivamente a telemetria RTT (`telemetry-udp` `:41234/udp`), signaling ICE (`webrtc-signaling`) e relay voice futuro via `coturn` (`:3478`, `:5349`).

---

## Struttura Monorepo (`npm workspaces`)

| Workspace | Tecnologia | Contenuto principale |
|---|---|---|
| [`shared/`](./shared) | Pure TypeScript, Zod, `@colyseus/schema` | Motore puro UNO (`deck`, `rules`, `moves`, `reducer`), 22 tier Ranked + ELO adattivo, 7 mini-game (`blackjack`, `scala40`, `ruba-mazzetto`, `scopa`, `poker-texas`, `burraco`, `mille-miglia`) + `Pentathlon`, schemi Colyseus, validatori Zod. |
| [`server/`](./server) | Node 24, Express 4, Colyseus 0.16, `pg`, Redis | API REST (`/api/auth`, `/api/friends`, `/api/shop`, `/api/inventory`, `/api/battle-card`, `/api/challenges`, `/api/leaderboard`, `/api/tournaments`, `/api/sync`, `/api/health`), migrazioni SQL idempotenti (`0001`–`0008`), `MatchSettlementService`, `RoomActionThrottle`, `GeminiBotAdvisor` opzionale (`ENABLE_GEMINI_BOTS`). |
| [`client/`](./client) | Vanilla TypeScript, Vite 6, Three.js | SPA hash-routed senza framework JSX (`0` file `.tsx`), tavolo UNO giocabile, Drawer Social/Presence, Negozio/Armadietto/Battle Card/Sfide/Tornei/Carriera/V-Card (The Lab + sandbox mini-game). |

---

## Prerequisiti & Avvio Rapido

- **Node.js** `>= 24.0.0` (`.nvmrc`: `24.13.1`) e **npm** `>= 11.0.0`
- **Docker Desktop** (per PostgreSQL 16, Redis 7, CoTURN, Nginx e container server/client)

### 1. Avvio completo in Docker (raccomandato)
```bash
cp .env.example .env
docker compose up -d --build
```
Apri **`http://localhost`** nel browser (Nginx serve il client e fa proxy di `/api/`, `/matchmake/` e `/ws` verso `server:3000`).

### 2. Sviluppo locale & Verifica CI
```bash
npm install
npm run dev        # avvia server + client in parallelo (cross-platform via concurrently)
npm run ci         # esegue lint (ESLint 9) + typecheck + build + test (shared, server, client)
```

---

## Stato Attuale e Roadmap

Il progetto compila interamente, supera i check `lint`, `typecheck`, `build`, `test` e gira su Docker Compose a 5 container. Per l'inventario trasparente di cosa è operativo end-to-end vs moduli ancora da collegare in UI/matchmaking (coda matchmaking online, varianti Chaos/Team nel motore, orchestratore automatico tornei, UI visuale dedicata ai mini-game), consulta:
- [`docs/audit/ANALISI-CRITICA-PROGETTO.md`](./docs/audit/ANALISI-CRITICA-PROGETTO.md)
- [`docs/game-design/file-implementazione-massiccia.md`](./docs/game-design/file-implementazione-massiccia.md)
