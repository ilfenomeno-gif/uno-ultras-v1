# UNO ULTRA (`uno-ultras-v1`)

Monorepo TypeScript per **UNO ULTRA**, piattaforma card game competitiva con server autoritativo, sistema ranked a 22 tier con playlist indipendenti per `(modalità × giocatori)`, Top 100 viva con matchmaking rivali `±5`, economia virtuale atomica (`V-Card`, zero real-money) e 7 mini-game completi in schermata full-screen.

> **Nota Legale / Branding:** Prototipo tecnico personale e non commerciale a scopo educativo/ingegneristico. `UNO` e i marchi correlati appartengono ai rispettivi proprietari (Mattel); prima di qualsiasi pubblicazione pubblica o su store occorre definire un branding proprietario originale.

---

## Architettura di Rete (WebSocket Autoritativo vs Telemetria UDP / WebRTC)

Il browser **non** usa socket UDP grezzi per il gameplay:
- **Gameplay, Auth & Economia (HTTP REST + Colyseus WebSocket):** Tutte le azioni di partita (`play_card`, `draw_card`, `call_uno`, `challenge_wild4`), autenticazione JWT, coda matchmaking, economia Postgres ACID, social/presenza e tornei viaggiano su **Express (`/api/*`) + Colyseus WebSocket (`/ws`, `/matchmake/`)**. Le mani private non entrano mai nello stato pubblico Colyseus (`cardCount` pubblico, mani inviate via `client.send('hand', ...)`).
- **Telemetria UDP & WebRTC Opzionale:** La porta `:41234/udp` (`telemetry-udp`) è dedicata esclusivamente a probe/client nativi esterni opzionali, mentre `:3478` / `:5349` servono il relay CoTURN WebRTC (protetto in produzione da credenziali effimere HMAC e blocco SSRF verso reti private).

---

## Struttura Monorepo (`npm workspaces`)

| Workspace | Tecnologia | Contenuto principale |
|---|---|---|
| [`shared/`](./shared) | Pure TypeScript, Zod, `@colyseus/schema` | Motore UNO (`deck`, `rules`, `moves`, `reducer`, varianti `standard`/`blitz`/`chaos`/`team`/`custom`), 22 tier Ranked + sotto-divisioni `I–IV`, ELO adattivo, regole competitive (classificazione 10 match anti-smurfing, abilità ponderata di gruppo, limite 3 livelli, penalità abbandono), 7 mini-game, catalogo `364` targhette, schemi Colyseus, validatori Zod. |
| [`server/`](./server) | Node 24, Express 4, Colyseus 0.16, `pg`, Redis | API REST (`/api/auth`, `/api/friends`, `/api/notifications`, `/api/shop`, `/api/inventory`, `/api/battle-card`, `/api/challenges`, `/api/leaderboard`, `/api/tournaments`, `/api/matchmaking`, `/api/progression`, `/api/sync`, `/api/health`), migrazioni SQL idempotenti (`0001`–`0010`), fallback dev locale offline (`dev-store.ts`), ladder Top 100 viva a 220 bot persistenti (`±5` rivali), seed RNG crittografici (`crypto.randomInt`), `RoomActionThrottle`, `GeminiBotAdvisor` opzionale (`ENABLE_GEMINI_BOTS`, zero leak delle mani altrui). |
| [`client/`](./client) | Vanilla TypeScript, Vite 6, Three.js | SPA hash-routed senza framework (`0` file `.tsx`), tavolo UNO completo con cosmetici Armadietto (`avatar`, `frame`, `card_back`, `title`, `theme`) + bot con nome/rank/titolo, 7 Mini-Giochi a schermo intero, Launcher playlist `1v1`/`3G`/`4G`, Drawer Social, Battle Card *Neon Stadium*, Sfide, Tornei, Top 100, Carriera, Negozio V-Card e governance ASTRALIS v3. |

---

## Sicurezza & Hardening Produzione

- **RNG crittografico lato server**: i seed di partita UNO e mini-giochi usano `node:crypto` `randomInt(1, 0x7fffffff)`.
- **Segreti e rete in produzione**: [`docker-compose.prod.yml`](./docker-compose.prod.yml) rimuove le porte pubbliche host da PostgreSQL e Redis (`ports: !reset []`), impone password obbligatorie via environment e abilita su CoTURN `--use-auth-secret` con `TURN_AUTH_SECRET`, quote banda/sessione e blocco CIDR privati/loopback in [`docker/coturn/turnserver.conf`](./docker/coturn/turnserver.conf).

---

## Prerequisiti & Avvio Rapido

- **Node.js** `>= 24.0.0` (`.nvmrc`: `24.13.1`) e **npm** `>= 11.0.0`
- **Docker Desktop** opzionale (PostgreSQL 16, Redis 7, CoTURN, Nginx e container server/client; in sviluppo locale è disponibile anche il fallback persistente su disco).

### 1. Sviluppo locale & Verifica CI
```bash
npm install
npm run dev        # avvia shared/server watch + server HTTP/WS (:3000) + client Vite (:5173) via concurrently
npm run ci         # esegue ESLint 9 + typecheck + build (shared, server, client) + Vitest (175 test)
```

### 2. Avvio completo in Docker (sviluppo / produzione)
```bash
cp .env.example .env
docker compose up -d --build
# In produzione (porte DB/Redis chiuse e segreti obbligatori):
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
Apri **`http://localhost`** (Docker/Nginx) o **`http://localhost:5173`** (dev locale) nel browser.

---

## Documentazione Tecnica

- [`docs/astralis/REPORT_SESSIONE.md`](./docs/astralis/REPORT_SESSIONE.md) — Diario cronologico delle verifiche e modifiche eseguite.
- [`docs/audit/ANALISI-CRITICA-PROGETTO.md`](./docs/audit/ANALISI-CRITICA-PROGETTO.md) — Analisi architetturale iniziale.
