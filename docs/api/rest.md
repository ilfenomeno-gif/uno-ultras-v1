# UNO ULTRA — Specifiche API REST (`/api/*`)

Tutte le rotte protette richiedono header `Authorization: Bearer <JWT>` ottenuto da `/api/auth/login` o `/api/auth/register`.

---

## Health & Diagnostica (`/api/health`)

| Metodo | Endpoint | Auth | Descrizione |
|---|---|---|---|
| `GET` | `/api/health` | No | Stato server e dipendenze (`postgres`, `redis`: `up`/`down`). |
| `GET` | `/api/health/metrics` | No | Metriche runtime in memoria (inclusi contatori room/HTTP). |

## Autenticazione (`/api/auth`)

| Metodo | Endpoint | Auth | Descrizione |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Registra un nuovo profilo (Zod + bcrypt + JWT + refresh cookie `HttpOnly`). |
| `POST` | `/api/auth/login` | No | Autenticazione credenziali, restituisce JWT e `profile` (incluse playlist rank). |
| `POST` | `/api/auth/refresh` | Cookie | Rotazione refresh token con revoca JTI. |
| `POST` | `/api/auth/logout` | Cookie / Bearer | Revoca token JTI e cancella refresh cookie. |
| `GET` | `/api/auth/me` | Bearer | Profilo autenticato aggiornato. |

## Matchmaking Autoritativo (`/api/matchmaking`)

| Metodo | Endpoint | Auth | Descrizione |
|---|---|---|---|
| `POST` | `/api/matchmaking/enqueue` | Bearer | Inserisce il giocatore (o gruppo) nella coda `(mode, ranked, targetPlayers, variant)`. Controlla ban attivi (`403`) e dislivello max 3 gradi (`403`). Se forma un match (`popMatches`), crea la `UnoRoom` privata su Colyseus con `allowedPlayerIds` e restituisce `matched.roomId`. |
| `GET` | `/api/matchmaking/status/:ticketId` | Bearer | Polling stato ticket (`searching`, `matched`, `cancelled`). Restituisce `403` su ticket altrui e `404` se scaduto/assente. Se `searching` supera `fallbackAtMs`, il server esegue atomicamente `claimForBotFallback`, rimuove dalla coda e crea una `UnoRoom` privata (`matchType: 'bot_fallback'`). |
| `DELETE` | `/api/matchmaking/cancel` | Bearer | Rimuove il giocatore dalla coda e marca il ticket in cache come `cancelled`. |

## Progressione, Classifiche & Economia

| Area | Endpoint Principali |
|---|---|
| **Progression** | `GET /api/progression/snapshot`, `POST /api/progression/settle-match` (liquidazione mini-game autoritativa). |
| **Leaderboard** | `GET /api/leaderboard/top?mode=...&players=...`, `GET /api/leaderboard/rivals?mode=...&players=...&count=...` (`±5` in Top 100), `GET /api/leaderboard/career`, `GET /api/leaderboard/replays/:matchId`. |
| **Battle Card & Sfide** | `GET /api/battle-card`, `POST /api/battle-card/claim`, `GET /api/challenges`, `POST /api/challenges/:id/claim`. |
| **Shop & Armadietto** | `GET /api/shop/catalog`, `POST /api/shop/purchase`, `POST /api/shop/crates/open`, `GET /api/inventory`, `POST /api/inventory/equip`. |
| **Social & Inviti** | `/api/friends/*`, `/api/notifications/*`, `/api/invites/*`. |
| **Tornei & Sync** | `GET /api/tournaments`, `POST /api/tournaments/enroll`, `POST /api/sync/offline-batch` (ricalcolo premi lato server). |
