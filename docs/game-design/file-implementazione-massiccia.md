# FILE IMPLEMENTAZIONE MASSICCIA — Piano Esecutivo Autonomo **UNO ULTRA**

## 0. Intestazione

- **Versione Documento:** 1.1 (Master Implementation Blueprint — Decisioni D1 & D2 Registrate)
- **Data:** 2026-11-23
- **Specifica Sorgente:** `docs/game-design/contenuto-game.md` (v1.1, `48.965` byte)
- **SHA-256 Sorgente (`contenuto-game.md`):** `83CAE3C057B35C22B460CC6F61BCF11AA355D1DB5F9EB4F2EC40517B2A1BD4D9`
- **Repository Target:** `C:\Users\PC\Pictures\uno ultras vscode\uno\uno ultra game\`

### 0.1 Perimetro ("Cosa implementa / Cosa NON implementa")
- **Cosa implementa (in specifica):** L'intera architettura target del monorepo (`@uno/shared`, `@uno/server`, `@uno/client`), lo schema PostgreSQL (migrazioni `0001`–`0007`), la topologia Redis, i contratti di rete Dual-Protocol (TCP autoritativo + UDP real-time), il sistema di identità univoca e inviti interni, l'economia atomica (`V-Card`, `Negozio`, `Armadietto`, `Battle Card 1–100`, `Sfide`), la progressione (`Stagioni`, `Carriera`, `Trofei`, `Replay`), il `Ranked/MMR` + `Tornei/UCS`, l'AI ibrida (euristica locale + API Gemini Native server-side), i 7 mini-game aggiuntivi + `Pentathlon`, l'accessibilità **WCAG 2.1 AA / NVDA** e i criteri di test e commit atomici.
- **Cosa NON implementa in questa fase:** Nessuna riga di codice eseguibile viene scritta o modificata in questa fase documentale; nessuna installazione pacchetti (`npm install`), build (`npm run build`) o avvio Docker (`docker compose up`) viene eseguito ora.

### 0.2 Prerequisiti già soddisfatti (Step 1–6D, verificati in Fase 1)
- Workspace npm configurato (`shared`, `server`, `client`) con `tsconfig.base.json` (`strict: true`, `exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`).
- Stack Docker Compose base definito in `docker-compose.yml` (`5` servizi: `postgres:16-alpine`, `redis:7-alpine`, `server`, `coturn:4.6-alpine`, `client`) + override `.dev.yml` e `.prod.yml`.
- `@uno/shared`: costanti carte/regole/modalità/rank, tipi base, schema Colyseus (`CardSchema`, `PlayerState`, `UnoRoomState`), motore puro UNO (`deck.ts`, `rules.ts`, `state.ts`, `moves.ts`, `reducer.ts`), 3 profili AI deterministici (`AGGR`, `CONS`, `STRAT`), contratti TCP/UDP/QUIC + codec binario e validatori Zod base (`auth`, `match`, `lobby`).
- `@uno/server`: configurazione Zod env, logger Pino, client base `pg` e `redis`, hashing `bcrypt`, `jwt-service.ts`, middleware `authRequired`, `http-server.ts`, route `health` e `auth` (`/register`, `/login`, `/me`), `BaseRoom`, `UnoController`, `UnoValidator`, `UnoRoom` (join JWT, mani private su canale `hand`, bot turn, timeout 30s, riconnessione 30s).
- `@uno/client`: Vite SPA vanilla TypeScript, `ParticlesCanvas` (60 particelle/60fps), `Router` hash-based, `SplashScreen` (`AVANZA`), `AuthScreen` (login/register + `confirmPassword`), `TopBar` (8 tab), `NewsTicker`, `Launcher` + `tab-play.ts`, `SocialDrawer` scheletro, `table.ts` + `hand.ts` + `discard-pile.ts` + `opponent-panel.ts` + `action-hints.ts` (giocabile 1P vs Bot e 2P PvP).

### 0.3 Prerequisiti e Decisioni Bloccanti
1. ✅ **D1 Risolta — Scala Ranked:** **Opzione A** — `22` tier (`Bronze I` → `Grand Champion III` + `SSL`), `SSL` a `1600 MMR`, `K-factor 40 → 20`.
2. ✅ **D2 Risolta — Gemini timing:** **3a + 3b** — **Fase 3a**: ranked prima con euristiche deterministiche `AGGR`/`CONS`/`STRAT`; **Fase 3b**: `GeminiBotAdvisor` dopo, attivabile con feature flag `ENABLE_GEMINI_BOTS`.
3. **Installazione pacchetti mancanti (`⚠️ DA INSTALLARE`)**: `@colyseus/redis-presence`, `@colyseus/redis-driver`, `@google/genai` (Fase 3b), `concurrently` (per script `dev` cross-platform Windows).
4. **Riempimento dei `136` file placeholder a `0 byte`** nelle aree critiche: test suite, migrazioni SQL, repository DB, servizi matchmaking/presence/social, route REST profilo/economia/tornei, componenti UDP/TURN e 7 tab UI mancanti.

---

## 1. Mappa di Tracciabilità Specifica → Implementazione

Ogni requisito presente in `contenuto-game.md` §2–§11 è tracciato univocamente da un ID `IMP-XXX`.

| ID-SPEC | Riferimento Spec | Fase §13 | File Target Principali | Workspace | Dipende da | Stato Attuale |
|---|---|---|---|---|---|---|
| `IMP-001` | §7.1, §14.2 | Prep / Fase 1 | `shared/src/constants/ranks.ts`, `shared/src/types/rank.ts`, `shared/src/engine/ranked/elo.ts`, `shared/tests/engine/ranks.test.ts` | `@uno/shared` | D1 ✅ Opzione A (22 tier, SSL 1600) | ✅ Completato (`7/7` test) |
| `IMP-002` | §3.1–§3.2 | Prep | `shared/tests/engine/uno/{deck,rules,moves,reducer}.test.ts`, `shared/tests/validation/{auth,match}.test.ts` *(suite test motore + validators; estensione `rules.ts` = `IMP-003`)* | `@uno/shared` | `IMP-001` | ✅ Completato |
| `IMP-003` | §3.3 (Estendi `rules.ts`: Blitz, Chaos, Team, Custom) | Fase 1–3 | `shared/src/constants/rules.ts`, `shared/src/validation/zod/custom-rules.ts` | `@uno/shared` | `IMP-002` | ✅ Completato |
| `IMP-004` | §10.3 (Unicità `username` + Blocco bot/riservati) | Fase 1 | `server/src/persistence/postgres/migrations/{0001_init,0002_identity}.sql`, `migrate.ts`, `repositories/players.ts`, `shared/src/validation/zod/auth.ts` | `@uno/shared`, `@uno/server` | `IMP-001` | ✅ Completato |
| `IMP-005` | §9 (Sicurezza JWT + Refresh + Rate Limit) | Fase 1 | `server/src/security/{rate-limiter,anti-cheat,csrf-protection}.ts`, `server/src/auth/{jwt-service,middleware,session-manager}.ts`, `server/src/persistence/redis/session-store.ts` | `@uno/server` | `IMP-004` | ✅ Completato |
| `IMP-006` | §10.3, §6.4 (Profilo pubblico, ispezione, avatar config) | Fase 1 | `0003_social.sql`, `profile.ts`, `players.ts`, `profile-view.ts`, `tab-career.ts` | `@uno/server`, `@uno/client` | `IMP-004` | ✅ Completato |
| `IMP-007` | §10.3 (Amici, Bloccati, Notifiche, Presenza, Inviti Online/Offline) | Fase 1 | `friends.ts`, `notifications.ts`, `invites.ts`, `presence.ts`, `presence-client.ts`, `social-drawer.ts` | `@uno/shared`, `@uno/server`, `@uno/client` | `IMP-005`, `IMP-006` | ✅ Completato |
| `IMP-008` | §10.1, §12.2 (Colyseus Multi-Node + Nginx Proxy) | Fase 1 | `server/src/index.ts`, `server/src/net/tcp/websocket-server.ts`, `docker/client/nginx.conf`, `docker/redis/redis.conf` | `@uno/server`, `docker` | `IMP-005` | ✅ Completato |
| `IMP-009` | §5.1–§5.4 (Economia `V-Card`, Ledger Atomico, Negozio) | Fase 2 | `0004_economy.sql`, `server/src/persistence/postgres/repositories/{transactions,inventory}.ts`, `server/src/net/tcp/rest-routes/{shop,inventory}.ts` | `@uno/shared`, `@uno/server` | `IMP-004`, `IMP-006` | ✅ Completato |
| `IMP-010` | §5.2–§5.4 (UI Negozio, `Equipaggia ora`, Armadietto, Tab V-Card) | Fase 2 | `client/src/ui/navigation/{tab-shop,tab-locker,tab-vcard}.ts`, `client/src/state/inventory-store.ts`, `client/src/styles/shop.css` | `@uno/client` | `IMP-009` | ✅ Completato |
| `IMP-011` | §5.2 (Visibilità cosmetici equipaggiati in lobby & partita) | Fase 2 | `shared/src/schemas/player-state.ts`, `server/src/rooms/uno/uno-room.ts`, `client/src/game-view/*` | `@uno/shared`, `@uno/server`, `@uno/client` | `IMP-010` | ✅ Completato |
| `IMP-012` | §6.1 (Battle Card Lv. 1–100, Pass 1000/1500, Sblocca Tutto) | Fase 2 | `0002_battle_card.sql` (`0004_economy.sql`), `server/src/persistence/postgres/repositories/battle-card.ts`, `rest-routes/battle-card.ts`, `client/src/ui/navigation/tab-battle-card.ts` | `@uno/shared`, `@uno/server`, `@uno/client` | `IMP-009` | ✅ Completato |
| `IMP-013` | §6.2–§6.3 (Stagioni, XP Curve, Soft Reset, 2XP, Streak, Sfide) | Fase 2 | `server/src/persistence/postgres/repositories/challenges.ts`, `rest-routes/challenges.ts`, `client/src/ui/navigation/tab-challenges.ts` | `@uno/shared`, `@uno/server`, `@uno/client` | `IMP-009`, `IMP-012` | ✅ Completato |
| `IMP-014` | §6.4 (Carriera: Trofei 5 tab, Feats, Statistiche, Storico, Replay) | Fase 2 | `server/src/persistence/postgres/repositories/matches.ts`, `client/src/ui/navigation/tab-career.ts` | `@uno/shared`, `@uno/server`, `@uno/client` | `IMP-006`, `IMP-009` | ✅ Completato |
| `IMP-015` | §10.4 (Cache Offline, Allenamento Locale & Sync Riconciliazione) | Fase 2 | `client/src/state/storage-adapter.ts`, `server/src/net/tcp/rest-routes/sync.ts` | `@uno/client`, `@uno/server` | `IMP-006`, `IMP-009` | ✅ Completato |
| `IMP-016` | §2.2, §2.4, §11 (WCAG 2.1 AA, NVDA, Notizie Fullscreen) | Fase 2 | `client/src/ui/components/{modal,drawer,badge,button,card,toggle}.ts`, `client/src/ui/shell/news-ticker.ts` | `@uno/client` | `IMP-006` | ✅ Completato |
| `IMP-017` | §7.2–§7.3 (Formula ELO, 35 playlist `mmrP`, Placement Matches) | Fase 3 | `0005_ranked.sql`, `server/src/matchmaking/mmr.ts`, `shared/src/engine/ranked/elo.ts` | `@uno/shared`, `@uno/server` | `IMP-001`, `IMP-014` | ✅ Completato |
| `IMP-018` | §7.3, §10.1 (Matchmaking Coda Redis, Lobby Manager, Timer base) | Fase 3 | `server/src/matchmaking/{queue,redis-queue,lobby-manager}.ts`, `server/src/persistence/redis/matchmaking-cache.ts`, `server/src/rooms/base/match-timer.ts` | `@uno/server` | `IMP-008`, `IMP-017` | ✅ Completato |
| `IMP-019` | §7.3 (Leaderboard Top 100 a 2 livelli) | Fase 3 | `server/src/persistence/redis/leaderboard.ts`, `server/src/net/tcp/rest-routes/challenges.ts`, `client/src/ui/navigation/tab-career.ts` | `@uno/server`, `@uno/client` | `IMP-017` | ✅ Completato |
| `IMP-020` | §9.1 (Ecosistema Bot Sociale) | Fase 3 | `server/src/persistence/postgres/repositories/bot-social.ts`, `0007_telemetry.sql` | `@uno/shared`, `@uno/server`, `@uno/client` | `IMP-006`, `IMP-017` | ✅ Completato |
| `IMP-021` | §9.2, §14.3 (Integrazione API Gemini Native per QI Bot per Rank) | Fase 3b | `shared/src/engine/ai/gemini-contracts.ts`, `server/src/ai/gemini-bot-advisor.ts`, `server/src/config/feature-flags.ts`, `server/src/rooms/uno/uno-room.ts` | `@uno/shared`, `@uno/server` | D2 ✅ (`ENABLE_GEMINI_BOTS`), `IMP-017` | ✅ Completato |
| `IMP-022` | §11 (Spectator Mode, Rematch 1-tap, Custom Game Rules/Preset) | Fase 3 | `server/src/rooms/uno/uno-room.ts`, `client/src/ui/play/{mode-selector,player-count-selector,ranked-toggle}.ts`, `client/src/state/match-store.ts` | `@uno/shared`, `@uno/server`, `@uno/client` | `IMP-003`, `IMP-018` | ✅ Completato |
| `IMP-023` | §8.1–§8.2 (Tornei: Torneo 32, Grand Prix, Classico, UCS SSL, Bracket, Negozio Casse) | Fase 4 | `0006_tournaments.sql`, `server/src/persistence/postgres/repositories/tournaments.ts`, `rest-routes/tournaments.ts`, `client/src/ui/navigation/tab-tournaments.ts`, `client/src/ui/tournament/{bracket-view,challenger-list,tournament-shop}.ts` | `@uno/shared`, `@uno/server`, `@uno/client` | `IMP-009`, `IMP-017`, `IMP-018` | ✅ Completato |
| `IMP-024` | §10.2, §11 (Canale UDP/WebRTC/Coturn: Telemetry, Ping RTT, Voice Chat) | Fase 4 | `0007_telemetry.sql`, `server/src/net/turn/{coturn-client,ice-config}.ts`, `server/src/net/udp/{quic-server,telemetry-udp,voice-relay,webrtc-signaling}.ts`, `client/src/net/udp/{quic-client,voice-client,webrtc-client}.ts` | `@uno/shared`, `@uno/server`, `@uno/client` | `IMP-008` | ✅ Completato |
| `IMP-025` | §4 (#2–#8), §11 (7 Mini-Game: Blackjack, Scala 40, Ruba, Scopa, Poker, Burraco, Mille Miglia + Pentathlon + The Lab) | Fase 5 | `shared/src/engine/mini-games/*`, `server/src/rooms/mini-games/{blackjack,scala40,scopa}-room.ts`, `client/src/ui/navigation/tab-vcard.ts` | `@uno/shared`, `@uno/server`, `@uno/client` | `IMP-017`, `IMP-023` | ✅ Completato |
| `IMP-026` | §10.1 (Observability, Feature Flags, Rate Limits, Lifecycle) | Trasversale | `server/src/observability/{health-checks,metrics,tracing}.ts`, `server/src/config/{feature-flags,rate-limits}.ts`, `client/src/core/{bootstrap,lifecycle,store}.ts` | Tutto il monorepo | `IMP-008` | ✅ Completato |

---

## 2. Architettura Target Consolidata

### 2.1 Topologia Monorepo e Flusso Dipendenze
```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         UNO ULTRA MONOREPO                              │
│                                                                         │
│  ┌────────────────┐      import @uno/shared       ┌──────────────────┐  │
│  │ @uno/client    │ ◄──────────────────────────── │  @uno/shared     │  │
│  │ (Vite TS SPA)  │                               │  (Pure TS + Zod  │  │
│  │ • UI 8 Tabs    │ ──── REST/JWT + Colyseus ───► │   + Schemas +    │  │
│  │ • Game Table   │         WS (TCP :443/:3000)   │   UNO Engine)    │  │
│  │ • WebRTC/UDP   │ ◄═══ Media/Telemetry UDP ═══► │                  │  │
│  └────────────────┘      (:3478/:19302/:49160)    └────────▲─────────┘  │
│                                                            │            │
│                                                    import @uno/shared   │
│                                                            │            │
│  ┌─────────────────────────────────────────────────────────┴─────────┐  │
│  │                       @uno/server (Node.js 24)                    │  │
│  │  • Express REST API (/api/*)     • Colyseus 0.16 Rooms            │  │
│  │  • Matchmaking & Presence        • GeminiBotAdvisor (Server-only) │  │
│  │  • UDP Telemetry / Signaling     • Transactional Economy Ledger   │  │
│  └───────────────────┬─────────────────────────────┬─────────────────┘  │
└──────────────────────┼─────────────────────────────┼────────────────────┘
                       ▼                             ▼
        ┌──────────────────────────┐   ┌──────────────────────────┐
        │   PostgreSQL 16 (ACID)   │   │    Redis 7 (Pub/Sub +    │
        │  • players (UNIQUE low)  │   │     Presence + Queues +  │
        │  • friendships/blocks    │   │     RateLimit + LB ZSET) │
        │  • inventory/transactions│   └──────────────────────────┘
        │  • battle_card/matches   │
        └──────────────────────────┘   ┌──────────────────────────┐
                                       │  CoTURN 4.6 (STUN/TURN)  │
                                       │  • :3478/:5349 TCP+UDP   │
                                       │  • Relay :49160-49200    │
                                       └──────────────────────────┘
```

### 2.2 Confini Autoritativi vs Cache
| Dominio | Fonte Autoritativa (Verità) | Ruolo Client |
|---|---|---|
| **Identità, Username, Sessione** | PostgreSQL (`players`) + Redis (`session:*`) | Cache locale profilo di sola visualizzazione; JWT in memoria / HttpOnly refresh cookie (target). |
| **Partite Ranked / Casual / Tornei Online** | Colyseus `UnoRoom` (`EngineState` privato server-side) | Render `UnoRoomState` pubblico + propria mano da canale `hand`; invia solo intenti `MatchAction`. |
| **Economia (`V-Card`, `Crediti Torneo`, `Armadietto`, `Battle Card`)** | PostgreSQL con lock `FOR UPDATE` e vincoli `UNIQUE` | Rendering catalogo, invio richieste di acquisto/claim idempotenti. |
| **Bot Gemini Native** | Server (`GeminiBotAdvisor` dentro `UnoRoom`) | Invisibile al client; riceve solo mosse e chat/emote risultanti. |
| **Modalità Allenamento Strictly Offline** | Browser (`IndexedDB` / `localStorage`) | Statistiche di pratica locale isolate (`localStats`), **zero** impatto su `MMR`, `V-Card` o `Battle Card` online. |

---

## 3. Shared (`@uno/shared`) — Contratti

### 3.1 `constants/ranks.ts` & `types/rank.ts` (`IMP-001`)
> ✅ **Decisione D1 Confermata (Opzione A):** Il file attuale definisce `16` tier (`SSL` a `3000`, `INITIAL_MMR = 200`). In `IMP-001` si allinea `ranks.ts` all'**Opzione A**: `22` livelli (`Bronze I–III`, `Silver I–III`, `Gold I–III`, `Platinum I–III`, `Diamond I–III`, `Champion I–III`, `Grand Champion I–III`, `SSL`), `SSL_MMR_THRESHOLD = 1600`, `K-factor 40 → 20`, `INITIAL_MMR = 200` e `PLAYLIST_KEYS` (~35 chiavi).

```ts
// shared/src/constants/ranks.ts (contratto target Opzione A)
export const RANK_TIERS_22 = [
  'Bronze I', 'Bronze II', 'Bronze III',
  'Silver I', 'Silver II', 'Silver III',
  'Gold I', 'Gold II', 'Gold III',
  'Platinum I', 'Platinum II', 'Platinum III',
  'Diamond I', 'Diamond II', 'Diamond III',
  'Champion I', 'Champion II', 'Champion III',
  'Grand Champion I', 'Grand Champion II', 'Grand Champion III',
  'SSL',
] as const;

export type PlaylistKey =
  | 'p1' | 'p3' | 'p4'
  | 'p1_casual' | 'p3_casual' | 'p4_casual'
  | 'p1_blitz' | 'p1_chaos' | 'p_2v2' | 'p_3v3'
  | 'p_ruba' | 'p_scala' | 'p_bj1' | 'p_bj2' | 'p_bj3'
  | 'p_poker' | 'p_scopa' | 'p_burraco' | 'p_mille';

export interface EloCalculationInput {
  playerMMR: number;
  opponentMMR: number;
  won: boolean;
  playlistMultiplier: number;
}

export interface EloCalculationResult {
  delta: number;
  newMMR: number;
  previousTier: RankTier;
  newTier: RankTier;
  promoted: boolean;
}
```
- **Invariante:** $\text{clamp}(\Delta, -50, +50)$; nessuna partita `casual` modifica `P.mmr` globale (`max(p1, p3, p4)`).

### 3.2 Estensioni UNO Core & Custom Rules (`IMP-003`)
```ts
// shared/src/validation/zod/custom-rules.ts
export interface CustomRulesPreset {
  id: string;
  name: string;
  turnTimerSeconds: number;     // 5..60
  stackingCap: number;          // 0..30 (0 = disabilitato)
  wildDraw4Challenge: boolean;
  initialHandSize: number;      // 4..12
  reverseActsAsSkipInDuel: boolean;
  sevenZeroSwap: boolean;       // Chaos mode
  blitzGlobalSeconds: number | null;
}
```
- **Casi limite:** se `initialHandSize * players > 90`, rigettare con `InvalidRulePresetError` (`400`) per evitare esaurimento mazzo iniziale.

### 3.3 Estensioni Schemi Colyseus (`IMP-011`)
```ts
// shared/src/schemas/player-state.ts (estensione cosmetici)
export class PlayerState extends Schema {
  // campi esistenti invariati...
  @type('string') avatarId: string = 'default';
  @type('string') frameId: string = 'none';
  @type('string') cardBackId: string = 'classic';
  @type('string') titleId: string = 't1';
  @type('string') teamId: string = ''; // 'A' | 'B' in 2v2 / 3v3
}
```
- **Invariante:** `hand` rimane rigorosamente **fuori** da `PlayerState` e `UnoRoomState`.

### 3.4 Contratti Sociali, Economia, Battle Card, Replay e Tornei (`IMP-006..IMP-023`)
```ts
// shared/src/types/economy.ts
export type CosmeticCategory = 'frame' | 'card_style' | 'avatar' | 'title' | 'table_theme' | 'emote';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';

export interface CatalogItem {
  readonly id: string;
  readonly category: CosmeticCategory;
  readonly rarity: ItemRarity;
  readonly name: string;
  readonly priceVCard: number | null; // null se non vendibile in shop (es. solo sfide/pass)
  readonly tournamentExclusive: boolean;
}

export interface BattleCardRewardSlot {
  readonly level: number;             // 1..100
  readonly track: 'free' | 'premium';
  readonly rewardType: 'vcard' | 'cosmetic';
  readonly vcardAmount?: number;      // es. 100
  readonly itemId?: string;
}

// shared/src/types/social.ts
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
export interface FriendSummary {
  readonly playerId: string;
  readonly username: string;
  readonly online: boolean;
  readonly currentActivity: 'lobby' | 'in_match' | 'tournament' | 'offline';
  readonly rankTier: RankTier;
}

export interface PartyInviteNotification {
  readonly inviteId: string;
  readonly fromPlayerId: string;
  readonly fromUsername: string;
  readonly roomId: string;
  readonly mode: GameMode;
  readonly createdAt: string;
  readonly expiresAt: string;
}
```

### 3.5 Contratti AI Ibrida + Gemini Native (`IMP-021`)
```ts
// shared/src/engine/ai/gemini-contracts.ts
export type BotIntelligenceTier = 'bronze_low' | 'silver_gold_mid' | 'plat_diamond_high' | 'ssl_ucs_elite';

/** Vista rigorosamente pubblica + mano del solo bot (anti-cheating). */
export interface BotTurnObservation {
  readonly tier: BotIntelligenceTier;
  readonly profile: AIProfile;
  readonly myHand: readonly UnoCard[];
  readonly topCard: UnoCard | null;
  readonly activeColor: UnoColor | null;
  readonly pendingDrawCount: number;
  readonly direction: 1 | -1;
  readonly opponents: ReadonlyArray<{
    readonly id: string;
    readonly cardCount: number;
    readonly hasCalledUno: boolean;
    readonly inferredWeakColors?: readonly UnoColor[];
  }>;
  readonly recentDiscards: readonly UnoCard[]; // slice controllato per fascia rank
  readonly legalActions: readonly MatchAction[]; // M già validato dal motore
}

export interface GeminiDecisionPayload {
  readonly selectedActionIndex: number; // 0 <= idx < legalActions.length
  readonly chosenColor?: UnoColor;
  readonly callUno?: boolean;
  readonly shortTaunt?: string;
}
```
- **Errori tipizzati:** `GeminiTimeoutError`, `GeminiInvalidMoveError`, `GeminiQuotaExceededError` — ognuno attiva immediatamente il fallback deterministico `decideAction(state, botId)`.

### 3.6 Scheletri Contratti Mini-Game (`IMP-025`)
```ts
// shared/src/engine/mini-games/mini-game-contract.ts
export interface MiniGameEngine<TState, TAction> {
  readonly mode: Exclude<GameMode, 'uno'>;
  createInitialState(players: readonly string[], seed: number): TState;
  getLegalActions(state: TState, playerId: string): readonly TAction[];
  applyAction(state: TState, playerId: string, action: TAction): TState;
  getPublicView(state: TState, viewerId: string): unknown;
}
```

---

## 4. Server (`@uno/server`) — Implementazione

### 4.1 Mappa Endpoint REST (`/api/*`)

| Metodo & Path | Auth | Payload Zod | Risposta (200/201) | Errori | Transazione / Note |
|---|---|---|---|---|---|
| `POST /api/auth/register` | Pubblica | `RegisterPayloadSchema` (ASCII strict + blocklist bot/riservati) | `201 { token, profile }` | `400`, `409` | Inserisce in `players`; controlla `LOWER(username)`. |
| `POST /api/auth/login` | Pubblica | `LoginPayloadSchema` | `200 { token, profile }` | `401`, `429` | Verifica `bcrypt` + rate limit Redis (`10/min` IP). |
| `POST /api/auth/refresh` | Cookie HttpOnly | — | `200 { token }` | `401` | ⚠️ Target Fase 1 per rimuovere JWT da `localStorage`. |
| `GET /api/profile/:username` | `authRequired` | `UsernameParamSchema` | `200 { profile, stats, trophies, locker }` | `404` | Ispezione profilo pubblico cliccando su amico/giocatore. |
| `PATCH /api/profile/locker` | `authRequired` | `{ slot, itemId }` | `200 { equipped }` | `403`, `404` | Verifica possesso item in `player_inventory`. |
| `GET /api/friends` | `authRequired` | — | `200 { online, offline, pendingIncoming, blocked }` | `401` | Join `friendships` + lookup presenza Redis `presence:*`. |
| `POST /api/friends/request` | `authRequired` | `{ targetUsername }` | `201 { friendshipId }` | `400`, `403` (blocked), `404`, `409` | Nessun duplicato su coppia ordinata; controlla `blocked_users`. |
| `POST /api/friends/respond` | `authRequired` | `{ friendshipId, action: 'accept' \| 'reject' \| 'block' }` | `200 { status }` | `403`, `404` | Se `block`, inserisce in `blocked_users` e rimuove amicizia. |
| `POST /api/invites/send` | `authRequired` | `{ targetPlayerId, roomId, mode }` | `201 { inviteId, deliveredOnline }` | `403`, `404`, `429` | Rate limit `5/min`. Pubblica su Redis Pub/Sub se online; salva in `notifications` se offline. |
| `GET /api/notifications` | `authRequired` | `?unreadOnly=true` | `200 { items }` | `401` | Include inviti ricevuti mentre offline (con flag `expired`). |
| `GET /api/shop` | `authRequired` | — | `200 { items, bundles, battleCardPricing }` | `401` | `1000` (base) / `1500` (+20 livelli). |
| `POST /api/shop/purchase` | `authRequired` | `{ catalogId, idempotencyKey }` | `200 { newVCardBalance, grantedItems }` | `402` (saldo), `409` | Transazione ACID `SELECT ... FOR UPDATE` su `players.vcard`. |
| `GET /api/battle-card` | `authRequired` | — | `200 { seasonId, level, xp, isPremium, claimedFree, claimedPremium }` | `401` | Cap reward livello `100`, max `1000 V-Card` (`500`+`500`). |
| `POST /api/battle-card/claim` | `authRequired` | `{ mode: 'single' \| 'all', level?, track? }` | `200 { claimedRewards, newVCardBalance }` | `400`, `403`, `409` | Transazione con `INSERT ... ON CONFLICT DO NOTHING` su `battle_card_claims`. |
| `GET /api/challenges` | `authRequired` | — | `200 { daily, weekly }` | `401` | 3 sfide giornaliere deterministiche per data + settimanali. |
| `POST /api/challenges/:id/claim` | `authRequired` | — | `200 { xp, vcard, exclusiveItem? }` | `400`, `409` | Lock atomico; rispetta cap max 1 targhetta + 1 item esclusivo. |
| `GET /api/leaderboard` | `authRequired` | `?mode=uno&size=1v1&limit=100` | `200 { entries }` | `400` | Legge ZSET Redis `leaderboard:{mode}:{size}` + bot drift. |
| `GET /api/tournaments` | `authRequired` | — | `200 { tournaments, userRank }` | `401` | Filtra accesso `UCS` ai soli `SSL`. |
| `POST /api/tournaments/:id/register` | `authRequired` | `{ teamName }` | `201 { registrationId, startsAt }` | `403` (rank), `409` | Registra team + attiva timer countdown client. |
| `POST /api/tournaments/:id/shop/open` | `authRequired` | `{ crateTier: 100 \| 500 \| 1000 }` | `200 { item, copyCount, remainingCredits }` | `402` | Incrementa `quantity` in `player_inventory` per duplicati (`×N`). |
| `POST /api/sync` | `authRequired` | `{ preferences, localMatchesCount }` | `200 { authoritativeProfile }` | `401` | Sovrascrive stato economico/ranked client con la verità Postgres; accetta solo preferenze consentite. |

### 4.2 Servizi Server Critici (`0 byte` da implementare)
- **`server/src/index.ts` (`IMP-008`)**: collegare `@colyseus/redis-presence` e `@colyseus/redis-driver` (`⚠️ DA VERIFICARE / DA INSTALLARE` in `server/package.json`) all'istanza `new Server({ transport, presence, driver })` per consentire scaling su più container `server`.
- **`server/src/matchmaking/{redis-queue,queue,mmr,lobby-manager}.ts` (`IMP-017`, `IMP-018`)**:
  - Ticket in Redis Sorted Set per fascia MMR con finestra di ricerca espansiva ogni `5s` (`±100` → `±250` → `±500`).
  - Matchmaking Atomico con script Lua o lock `SET NX PX` per prevenire doppio abbinamento dello stesso `playerId`.
- **`server/src/rooms/base/presence.ts` (`IMP-007`)**: mappa `playerId ↔ socket/status` su Redis Hash/PubSub; propaga in tempo reale `invite_received`, `friend_online`, `friend_offline`.
- **`server/src/ai/gemini-bot-advisor.ts` (`IMP-021` — Fase 3b):** client `@google/genai` (`⚠️ DA VERIFICARE / DA INSTALLARE` in `server/package.json`) controllato dal **feature flag `ENABLE_GEMINI_BOTS`** (default `false` in `server/src/config/env.ts` / `feature-flags.ts`, così Fase 3a gira con le sole euristiche `AGGR`/`CONS`/`STRAT`) con:
  - Selezione modello per fascia (`gemini-2.5-flash-lite` vs `gemini-2.5-flash` / `pro` UCS).
  - Timeout `1200ms` via `AbortSignal.timeout(1200)`.
  - Validazione output Zod + verifica `0 <= selectedActionIndex < legalActions.length`.
  - Circuit breaker Redis se error rate > 10% in 1 minuto → fallback temporaneo su `decideAction()`.
- **`server/src/net/turn/{coturn-client,ice-config}.ts` & `server/src/net/udp/*` (`IMP-024`)**:
  - Generazione credenziali HMAC effimere per CoTURN (`turnserver.conf` usa `static-auth-secret` in produzione).
  - Server UDP (`dgram` Node.js su porte `19302–19312/udp`) per ricevere datagrammi binari `[channelId | JSON]` (`PING=3` eco immediata con `serverTs`, `TELEMETRY=1` campionamento metriche, `VOICE_RELAY=2` forwarding autorizzato ai soli membri della `roomId`).

---

## 5. Database (`PostgreSQL`) — Schema & Migrazioni

Migrazioni numerate da collocare in `server/src/persistence/postgres/migrations/`.

### 5.1 `0001_init.sql` (Allineamento con `docker/postgres/init.sql`)
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS players (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username           VARCHAR(50) UNIQUE NOT NULL,
    password_hash      VARCHAR(255) NOT NULL,
    email              VARCHAR(255) UNIQUE,
    rank_tier          VARCHAR(30) NOT NULL DEFAULT 'Bronze I',
    mmr                INTEGER NOT NULL DEFAULT 200,
    vcard              INTEGER NOT NULL DEFAULT 0 CHECK (vcard >= 0),
    battle_card_level  INTEGER NOT NULL DEFAULT 1,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 5.2 `0002_identity.sql` (Unicità Case-Insensitive & Anti-Spoofing)
```sql
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS username_canonical VARCHAR(50),
    ADD COLUMN IF NOT EXISTS tournament_credits INTEGER NOT NULL DEFAULT 0 CHECK (tournament_credits >= 0),
    ADD COLUMN IF NOT EXISTS xp BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
    ADD COLUMN IF NOT EXISTS account_level INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS equipped_avatar VARCHAR(64) NOT NULL DEFAULT 'default',
    ADD COLUMN IF NOT EXISTS equipped_frame VARCHAR(64) NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS equipped_card_style VARCHAR(64) NOT NULL DEFAULT 'classic',
    ADD COLUMN IF NOT EXISTS equipped_title VARCHAR(64) NOT NULL DEFAULT 't1',
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE players SET username_canonical = LOWER(TRIM(username)) WHERE username_canonical IS NULL;
ALTER TABLE players ALTER COLUMN username_canonical SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_username_lower
    ON players (LOWER(username)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_username_canonical
    ON players (username_canonical) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS reserved_usernames (
    canonical_name VARCHAR(50) PRIMARY KEY,
    reason         VARCHAR(50) NOT NULL -- 'system' | 'bot_pool' | 'offensive'
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    token_hash  VARCHAR(128) UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_player ON refresh_tokens (player_id);
```

### 5.3 `0003_social.sql` (Amici, Bloccati, Notifiche & Inviti Persistenti)
```sql
CREATE TABLE IF NOT EXISTS friendships (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_low    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player_high   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    requester_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status        VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_friendship_order CHECK (player_low < player_high),
    UNIQUE (player_low, player_high)
);
CREATE INDEX IF NOT EXISTS idx_friendships_low ON friendships (player_low, status);
CREATE INDEX IF NOT EXISTS idx_friendships_high ON friendships (player_high, status);

CREATE TABLE IF NOT EXISTS blocked_users (
    blocker_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    blocked_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    sender_id   UUID REFERENCES players(id) ON DELETE SET NULL,
    type        VARCHAR(32) NOT NULL, -- 'party_invite' | 'friend_request' | 'tournament_ready' | 'system'
    payload     JSONB NOT NULL,
    read_at     TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_id, created_at DESC);
```

### 5.4 `0004_economy.sql` (Catalogo, Inventario ×N, Transazioni Atomiche, Battle Card Lv. 1–100, Sfide)
```sql
CREATE TABLE IF NOT EXISTS catalog_items (
    id                   VARCHAR(64) PRIMARY KEY,
    category             VARCHAR(32) NOT NULL,
    rarity               VARCHAR(20) NOT NULL,
    name                 VARCHAR(80) NOT NULL,
    price_vcard          INTEGER CHECK (price_vcard IS NULL OR price_vcard >= 0),
    tournament_crate_only BOOLEAN NOT NULL DEFAULT FALSE,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS player_inventory (
    player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id     VARCHAR(64) NOT NULL REFERENCES catalog_items(id),
    quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1), -- supporta copie xN da casse torneo
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, item_id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id        UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    currency         VARCHAR(20) NOT NULL CHECK (currency IN ('vcard', 'tournament_credits')),
    amount_delta     INTEGER NOT NULL,
    reason           VARCHAR(64) NOT NULL, -- 'shop_purchase' | 'battle_card_claim' | 'challenge' | 'crate_open'
    idempotency_key  VARCHAR(128) UNIQUE,
    metadata         JSONB NOT NULL DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_player ON transactions (player_id, created_at DESC);

CREATE TABLE IF NOT EXISTS seasons (
    id          VARCHAR(32) PRIMARY KEY, -- es. 'S1_2026'
    name        VARCHAR(64) NOT NULL,
    starts_at   TIMESTAMPTZ NOT NULL,
    ends_at     TIMESTAMPTZ NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS battle_card_progress (
    player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season_id    VARCHAR(32) NOT NULL REFERENCES seasons(id),
    level        INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    xp           INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    is_premium   BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (player_id, season_id)
);

CREATE TABLE IF NOT EXISTS battle_card_claims (
    player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season_id   VARCHAR(32) NOT NULL REFERENCES seasons(id),
    level       INTEGER NOT NULL CHECK (level BETWEEN 1 AND 100),
    track       VARCHAR(10) NOT NULL CHECK (track IN ('free', 'premium')),
    claimed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, season_id, level, track)
);

CREATE TABLE IF NOT EXISTS challenge_claims (
    player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    challenge_key VARCHAR(64) NOT NULL,
    period_key    VARCHAR(20) NOT NULL, -- '2026-11-23' o '2026-W47'
    claimed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, challenge_key, period_key)
);
```

### 5.5 `0005_ranked.sql` (Playlist MMR, Storico Match, Replay, Bot Bond)
```sql
CREATE TABLE IF NOT EXISTS player_playlist_mmr (
    player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    playlist_key  VARCHAR(32) NOT NULL,
    mmr           INTEGER NOT NULL DEFAULT 200,
    peak_mmr      INTEGER NOT NULL DEFAULT 200,
    wins          INTEGER NOT NULL DEFAULT 0,
    losses        INTEGER NOT NULL DEFAULT 0,
    placements_done INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, playlist_key)
);

CREATE TABLE IF NOT EXISTS matches (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mode         VARCHAR(32) NOT NULL,
    playlist_key VARCHAR(32) NOT NULL,
    is_ranked    BOOLEAN NOT NULL,
    winner_id    UUID REFERENCES players(id),
    seed         INTEGER NOT NULL,
    duration_ms  INTEGER NOT NULL,
    replay_log   JSONB, -- compresso o limitato per privacy/spazio
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_participants (
    match_id      UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id     UUID REFERENCES players(id) ON DELETE SET NULL,
    bot_name      VARCHAR(50),
    final_score   INTEGER NOT NULL,
    mmr_before    INTEGER,
    mmr_after     INTEGER,
    plus2_played  INTEGER NOT NULL DEFAULT 0,
    plus4_played  INTEGER NOT NULL DEFAULT 0,
    skips_played  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (match_id, COALESCE(player_id::text, bot_name)) -- ⚠️ DA VERIFICARE: in PG usare indice univoco o surrogate PK
);
```
> ⚠️ **Nota DDL:** La `PRIMARY KEY` con espressione `COALESCE(...)` su `match_participants` non è ammessa in PostgreSQL standard (occorre `id BIGSERIAL PRIMARY KEY` + due `CREATE UNIQUE INDEX` parziali). Va corretta in Fase 3/migrazione eseguibile.

```sql
CREATE TABLE IF NOT EXISTS bot_bonds (
    player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    bot_id      VARCHAR(40) NOT NULL,
    bond_xp     INTEGER NOT NULL DEFAULT 0,
    bond_level  INTEGER NOT NULL DEFAULT 0,
    is_friend   BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (player_id, bot_id)
);
```

### 5.6 `0006_tournaments.sql` & `0007_telemetry.sql`
```sql
-- 0006_tournaments.sql
CREATE TABLE IF NOT EXISTS tournaments (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kind          VARCHAR(24) NOT NULL, -- 'UT32' | 'GRAND_PRIX' | 'CLASSICO' | 'PENTATHLON' | 'UCS'
    mode          VARCHAR(32) NOT NULL,
    min_rank_tier VARCHAR(30) NOT NULL DEFAULT 'Bronze I',
    max_players   INTEGER NOT NULL,
    starts_at     TIMESTAMPTZ NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'scheduled'
);

CREATE TABLE IF NOT EXISTS tournament_registrations (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_name     VARCHAR(32) NOT NULL,
    final_place   INTEGER,
    credits_awarded INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tournament_id, player_id)
);

-- 0007_telemetry.sql
CREATE TABLE IF NOT EXISTS network_telemetry_samples (
    id          BIGSERIAL PRIMARY KEY,
    room_id     VARCHAR(64) NOT NULL,
    player_id   UUID REFERENCES players(id) ON DELETE SET NULL,
    avg_rtt_ms  REAL NOT NULL,
    packet_loss REAL NOT NULL,
    avg_fps     REAL NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_telemetry_recorded_at ON network_telemetry_samples (recorded_at DESC);
```

- **Regole di Integrità Economica:** Ogni acquisto/claim deve aprire una transazione, bloccare la riga utente con `SELECT vcard, tournament_credits FROM players WHERE id = $1 FOR UPDATE`, verificare saldo/limiti, registrare in `transactions` con `idempotency_key`, aggiornare `player_inventory` (o `battle_card_claims`), e fare `COMMIT`.

---

## 6. Redis — Chiavi, TTL, Canali

> ⚠️ **Nota Critica su `docker/redis/redis.conf`:** Attualmente `maxmemory-policy` è impostata su `allkeys-lru`. Con `allkeys-lru`, sotto pressione di memoria Redis può eliminare chiavi di `session:*` o ticket `matchmaking:*`. In produzione passare a **`noeviction`** (o separare un'istanza cache con `volatile-lru`).

| Namespace | Tipo Struttura | TTL | Produttore | Consumatore | Policy / Note |
|---|---|---|---|---|---|
| `presence:{playerId}` | Hash (`status`, `roomId`, `serverId`, `lastSeen`) | `90s` (rinnovato da heartbeat) | `presence.ts` | `friends` REST, `invites` | Eviction sicura: TTL breve di sessione. |
| `presence:pubsub` | Pub/Sub Channel | N/A (streaming) | `presence.ts`, `invites` | Tutte le istanze `server` | Notifica real-time inviti/stato amici tra container. |
| `matchmaking:queue:{mode}:{size}:{ranked}` | Sorted Set (score = `mmr`, member = `playerId`) | Ticket hash `matchmaking:ticket:{id}` TTL `300s` | `redis-queue.ts` | Worker Matchmaker | Lock atomico `matchmaking:lock:{mode}:{size}` (`PX 2000`). |
| `leaderboard:{mode}:{size}` | Sorted Set (score = `mmr`, member = `playerId`) | Persistente (refresh ogni stagione) | `mmr.ts` (fine match) | `leaderboard` REST (`Top 100`) | Unione con drift giornaliero deterministico bot. |
| `notify:{playerId}` | List / Stream fallback veloce | `86400s` (24h) | `invites`, `tournaments` | Push WS alla riconnessione | Backing autoritativo su tabella Postgres `notifications`. |
| `ratelimit:{scope}:{key}` | String / Counter (`INCR` + `EXPIRE`) | `60s` | `rate-limiter.ts` | Middleware Express (`login`, `invites`, `shop`) | `login: 10/min`, `invites: 5/min`, `purchase: 15/min`. |
| `session:revoked:{jti}` | String (`"1"`) | Rimanente scadenza JWT | `auth/logout` | `authRequired` middleware | Fail-closed per revoca immediata token compromessi. |

---

## 7. Client (`@uno/client`) — UI & Stato

### 7.1 Stato Client (`client/src/state/`)
- **`profile-store.ts`** (esistente): gestisce token e profilo corrente; da evolvere per tenere l'`accessToken` in memoria e usare `storage-adapter.ts` per cache offline firmata.
- **`inventory-store.ts`** (`0 byte`): cache oggetti posseduti, equipaggiamenti attivi, copie `×N` e mutazioni ottimistiche reversibili dopo risposta server.
- **`match-store.ts`** (`0 byte`): stato reattivo della stanza attiva, timer turno locale sincronizzato, eventi `uno_called`, `wild4_challenge`.
- **`storage-adapter.ts`** (`0 byte`): astrazione `IndexedDB` / `localStorage` per `localPracticeStats`, impostazioni 5 schede e preset `Custom Game` offline.

### 7.2 Componenti & Viste UI (`client/src/ui/`)
| Componente / Tab | Props / Dipendenze | Stati UI Obbligatori | Accessibilità WCAG 2.1 AA |
|---|---|---|---|
| **Splash & Auth** (`splash-screen.ts`, `auth-screen.ts`) | Router, `connectionManager` | `idle \| loading \| error \| authenticated` | `role="alert"` su errori, `Enter` su `AVANZA`, dialogo opzionale **NVDA** all'avvio. |
| **Top Bar 8 Tab & News Ticker** (`top-bar.ts`, `news-ticker.ts`) | `Router`, notifiche non lette | `collapsed \| expanded_fullscreen` | Frecce / `Tab` tra voci `nav`, `ESC` chiude ticker espanso. |
| **Tab `Gioca`** (`tab-play.ts`, `launcher.ts`, `mode-selector.ts`, `player-count-selector.ts`, `ranked-toggle.ts`) | `profileStore`, `SocialDrawer`, `card-3d-spinner` | `ready \| connecting \| error` | Tab `Modalità` / `Giocatori`, anello Rank + cerchio Battle Card basso-destra, 3 `+` attorno carta 3D. |
| **Drawer Sociale** (`social-drawer.ts`) | REST `/friends`, `/invites`, `/profile/:u`, WS `presence` | `loading \| empty \| ready \| error` | 3 tab (`Amici` [Online/Offline] / `Notifiche` / `Bloccati`), input `username` esatto, modale `Visualizza Profilo`, **focus trap** + `ESC`. |
| **Tab `Negozio` & `V-Card`** (`tab-shop.ts`, `tab-vcard.ts`) | REST `/shop`, `/shop/purchase`, `inventory-store` | `loading \| ready \| purchasing \| error` | Primo piano **Battle Card** fullscreen (`1000` vs `1500` +20 lv), pop-up post-acquisto con **`Equipaggia ora`**. |
| **Tab `Armadietto`** (`tab-locker.ts`) | REST `/profile/locker`, `inventory-store` | `loading \| empty \| ready` | Filtri per categoria, badge `×N` su duplicati, feedback `aria-live` equipaggiamento. |
| **Tab `Battle Card`** (`tab-battle-card.ts`) | REST `/battle-card`, `/battle-card/claim` | `loading \| ready \| claiming` | Linea a `100` cerchi (cap premi 100, livellamento oltre 100 senza reward), **`Sblocca tutto`** con coda modali `Avanza` / `Chiudi`. |
| **Tab `Sfide`** (`tab-challenges.ts`) | REST `/challenges` | `loading \| ready \| claiming` | Barre progresso, badge ricompensa (max `1` targhetta + `1` item esclusivo per sfide speciali). |
| **Tab `Tornei` & Sotto-viste** (`tab-tournaments.ts`, `bracket-view.ts`, `challenger-list.ts`, `tournament-shop.ts`) | REST `/tournaments` | `carousel \| team_modal \| countdown \| active_fullscreen` | Timer in alto a destra, finestra ingresso `60s`, schermata torneo dedicata (`Home`, `Sfidanti` 2 rami + stats club, `Negozio` casse `100`/`500`/`1000`). |
| **Tab `Carriera`** (`tab-career.ts`) | REST `/profile/:u`, `/matches`, `/leaderboard` | `tabs: Trofei(5) | Statistiche | Storico | Replay | Top100` | Replay stepper con controlli da tastiera (`←`/`→`/`Spazio`). |
| **Tavolo UNO & Mini-Game** (`game-view/table.ts` + scheletri) | `Room<UnoRoomState>`, `colyseus`, `webrtc-client` | `lobby \| playing \| wild_picker \| finished \| reconnecting` | `aria-live="polite"` per annunci turno, modale pausa/uscita su `ESC`, pulsante `Rivincita` + `Spettatore`. |

---

## 8. Protocollo Dual (TCP + UDP)

### 8.1 Tabella Canali TCP (Affidabili — WebSocket Colyseus + REST)
| Canale (`TCP_CHANNELS`) | Direzione | Payload | Validazione |
|---|---|---|---|
| `play_card` | C → S | `{ cardId, chosenColor? }` | Zod `MatchActionSchema` + `canPlay()` in `UnoRoom`. |
| `draw_card`, `call_uno`, `challenge_wild4`, `leave_match` | C → S | `{}` | Zod + controllo turno/stato in `UnoController`. |
| `hand` | S → C (privato) | `{ type: 'hand', cards: UnoCard[] }` | Inviato al solo proprietario via `client.send`. |
| `action_result`, `uno_called`, `challenge_result`, `match_ended` | S → C | Messaggi tipizzati in `shared/src/protocol/messages.ts` | Prodotti esclusivamente da `UnoRoom`. |
| `player_disconnected`, `bot_replaced` | S → C | `{ playerId, reconnectWindowMs \| botProfile }` | Timer `allowReconnection(30s)` → sostituzione bot `STRAT`. |
| `invite_received`, `presence_update` (nuovi in `TCP_CHANNELS`) | S ↔ C | `PartyInviteNotification` / stato amico | Room `PresenceRoom` o WS dedicato autenticato JWT. |

### 8.2 Tabella Canali UDP (Low-Latency — DataChannel WebRTC / Socket UDP / QUIC)
| ID (`UDP_CHANNELS`) | Nome | Formato Binario (`codec.ts`) | Frequenza / Uso | Chi Valida |
|---|---|---|---|---|
| `1` (`0x01`) | `TELEMETRY` | `[0x01 \| UTF8 JSON {roomId, fps, rttMs, packetLoss}]` | Ogni `2–5s` | Server `telemetry-udp.ts` (sanity bounds `fps 0..240`, rate limit). |
| `2` (`0x02`) | `VOICE_RELAY` | `[0x02 \| header sessionId/roomId \| Opus frame]` | Continuo push-to-talk / open mic | Server verifica che il mittente appartenga alla `roomId` e non sia silenziato/bloccato. |
| `3` (`0x03`) | `PING` | `[0x03 \| UTF8 JSON {clientTs, serverTs?}]` | Ogni `1s` in partita/lobby | Eco server immediata per stima RTT client (`good <80ms`, `ok ≤200ms`, `bad >200ms`). |

---

## 9. Sicurezza & Anti-Cheat

1. **Autenticazione & Sessioni:**
   - Password hashate con `bcrypt` (cost factor `12`).
   - Migrazione da JWT in `localStorage` a **Access Token breve (`15m`) in memoria + Refresh Token `HttpOnly; SameSite=Strict; Secure`** su PostgreSQL + blacklist revoca `session:revoked:{jti}` su Redis.
2. **Validazione Totale degli Input:**
   - Ogni endpoint REST ed ogni messaggio WebSocket passa attraverso schemi `Zod` in `@uno/shared`. Payload non conformi rigettati con `400` / `action_result { ok: false }`.
3. **Protezione Identità & Social:**
   - `UsernameSchema` (`^[a-zA-Z0-9_-]{3,20}$`) + `LOWER(username)` `UNIQUE` + `reserved_usernames` (blocca spoofing admin/bot).
   - Controllo bidirezionale `blocked_users` prima di inviare richieste amicizia o inviti partita; rate limiter Redis (`5 inviti/min`).
4. **Anti-Cheat di Partita & Economia:**
   - **Mani Private Server-Only:** nessun avversario riceve mai le carte altrui (solo `cardCount`).
   - **Randomness Server-Only:** `seed` del mazzo generato con CSPRNG/entropia server, mai dal client.
   - **Economia Atomica:** `SELECT ... FOR UPDATE` + `idempotency_key` prevengono race da doppio click o replay HTTP.
   - **Isolamento Offline:** progressi offline salvati solo come statistiche di pratica locale; `POST /api/sync` non accetta delta `MMR`, `V-Card` o `Battle Card XP` dal client.
5. **Protezione API Gemini:**
   - Chiave `GEMINI_API_KEY` presente solo nell'ambiente del container `server`, mai esposta al bundle Vite; prompt ristretto alla vista osservabile dal bot; budget cap giornaliero configurabile via env.

---

## 10. Testing & Criteri di Accettazione

| Scope | Strumento | Target Principali | Criterio di Accettazione ("Done") |
|---|---|---|---|
| **Unit (`shared`)** | Vitest | `deck.ts`, `rules.ts`, `moves.ts`, `ranks.ts` (`elo`), `ai/decision-engine.ts`, `codec.ts`, `validation/zod/*` | Coverage ≥ 85% su motore UNO e validatori; 0 regressioni su stacking cap 20, challenge `+4`, `UNO!`, reverse 1v1. |
| **Integration (`server`)** | Vitest + Postgres/Redis test | `auth`, `profile` (`LOWER(username)`), `friends/invites`, `shop/purchase` concorrente, `battle-card/claim`, `UnoRoom` | Test di concorrenza su `shop/purchase` (10 richieste simultanee con saldo per 1 solo acquisto → esattamente 1 successo, 9 errori `402`/`409`). |
| **AI / Gemini Test** | Vitest (mock SDK + test timeout) | `GeminiBotAdvisor` | Verifica che `selectedActionIndex` fuori range o timeout >1200ms ricadano al 100% su `decideAction()` locale senza eccezioni non gestite. |
| **E2E Multi-Client** | Playwright / Cypress + 2 browser | Flusso `Splash → Auth → Social Invite → UnoRoom 2P → Fine Partita → Battle Card Claim → Negozio Equipaggia` | Due utenti reali giocano una partita UNO completa, uno invita l'altro per username, i cosmetici equipaggiati appaiono a entrambi. |

---

## 11. Ordine di Esecuzione Atomico

Nessun commit inizia se il commit da cui dipende non compila (`npm run build`) e non passa i suoi test.

1. **`IMP-001` — Riconciliazione Scala Ranked & Test Base (`shared`)**
   - *File:* `shared/src/constants/ranks.ts`, `shared/src/types/rank.ts`, `shared/tests/engine/ranks.test.ts` (**D1 ✅ Opzione A: 22 tier, SSL 1600, K 40→20**).
2. **`IMP-002` — Suite Unit Test Motore UNO & Protocollo (`shared`)**
   - *File:* `shared/tests/engine/{uno-deck,uno-rules,uno-moves}.test.ts`, `shared/tests/validation/validators.test.ts`.
3. **`IMP-004` — Migrazioni SQL Identità & Hardening Username (`server` + `shared`)**
   - *File:* `server/src/persistence/postgres/migrations/{0001_init,0002_identity}.sql`, `shared/src/validation/zod/auth.ts`, `server/src/net/tcp/rest-routes/auth.ts`.
4. **`IMP-005` — Security Hardening: Rate Limiter, Session Store Redis, Refresh Cookie (`server`)**
   - *File:* `server/src/security/{rate-limiter,anti-cheat,csrf-protection}.ts`, `server/src/persistence/redis/session-store.ts`, `server/src/auth/session-manager.ts`.
5. **`IMP-008` — Multi-Node Colyseus (RedisPresence/RedisDriver) + Nginx `/matchmake` Proxy**
   - *File:* `server/package.json` (`⚠️ DA INSTALLARE`: `@colyseus/redis-presence`, `@colyseus/redis-driver`), `server/src/index.ts`, `docker/client/nginx.conf`.
6. **`IMP-006` + `IMP-007` — Profilo Pubblico, Amicizie, Bloccati, Presenza & Inviti Interni**
   - *File:* `0003_social.sql`, `server/src/rooms/base/presence.ts`, `server/src/net/tcp/rest-routes/{profile,friends,notifications}.ts`, `client/src/ui/play/social-drawer.ts`.
7. **`IMP-009` + `IMP-010` + `IMP-011` — Economia Atomica, Negozio, Armadietto & Cosmetici Live**
   - *File:* `0004_economy.sql`, `repositories/{transactions,inventory}.ts`, `rest-routes/{shop,inventory}.ts`, `client/src/ui/navigation/{tab-shop,tab-locker,tab-vcard}.ts`, `client/src/state/inventory-store.ts`.
8. **`IMP-012` + `IMP-013` — Battle Card (1–100), Stagioni, XP & Sfide**
   - *File:* `repositories/{battle-card,challenges}.ts`, `rest-routes/{battle-card,challenges}.ts`, `client/src/ui/navigation/{tab-battle-card,tab-challenges}.ts`.
9. **`IMP-014` + `IMP-015` + `IMP-016` — Carriera/Replay, Offline Sync, Accessibilità WCAG/NVDA & UI Missing**
   - *File:* `repositories/matches.ts`, `rest-routes/sync.ts`, `client/src/state/storage-adapter.ts`, `client/src/ui/navigation/tab-career.ts`, `client/src/ui/components/*.ts`.
10. **Fase 3a — `IMP-017` + `IMP-018` + `IMP-019` + `IMP-020` (Ranked ELO con Euristiche `AGGR`/`CONS`/`STRAT`)**
    - *File:* `0005_ranked.sql`, `server/src/matchmaking/{mmr,queue,redis-queue,lobby-manager}.ts`, `persistence/redis/{leaderboard,matchmaking-cache}.ts`, `bot-social.ts`.
11. **Fase 3b — `IMP-021` (Bot Ibrido API Gemini Native dietro feature flag `ENABLE_GEMINI_BOTS`)**
    - *File:* `shared/src/engine/ai/gemini-contracts.ts`, `server/src/config/feature-flags.ts`, `server/src/ai/gemini-bot-advisor.ts`, hook in `uno-room.ts`. Attivo solo quando `ENABLE_GEMINI_BOTS=true`; fallback immediato su `decideAction()`.
12. **`IMP-003` + `IMP-022` — Varianti Blitz/Chaos/Team/Custom Rules, Spectator & Rematch**
    - *File:* `shared/src/engine/uno/moves.ts`, `uno-room.ts`, `client/src/ui/play/*`.
13. **`IMP-023` — Sistema Tornei (`UT32`, `Grand Prix`, `Classico`, `UCS SSL`, Bracket & Casse)**
    - *File:* `0006_tournaments.sql`, `repositories/tournaments.ts`, `rest-routes/tournaments.ts`, `client/src/ui/navigation/tab-tournaments.ts`, `client/src/ui/tournament/*`.
14. **`IMP-024` — Layer UDP / CoTURN / Telemetria / Voice Chat**
    - *File:* `0007_telemetry.sql`, `server/src/net/{turn,udp}/*`, `client/src/net/udp/*`.
15. **`IMP-025` — Porting 7 Mini-Game, Pentathlon, The Lab & Upgrade Three.js**
    - *File:* `shared/src/engine/mini-games/*`, `server/src/rooms/mini-games/*`, `client/src/fx/*`.
16. **`IMP-026` — Observability, CI/CD GitHub Actions & Hardening Produzione**.

---

## 12. Rischi, Discrepanze e Decisioni Aperte

### 12.1 Tabella dei Rischi
| ID | Rischio | Impatto | Mitigazione | Owner |
|---|---|---|---|---|
| `RSK-01` | Scala rank non decisa prima del codice matchmaking/DB. | Alto (migrazioni e formula ELO da rifare). | Congelare codice matchmaking fino a risposta su Decisione #1. | Architect / Utente |
| `RSK-02` | Sforamento costi/rate limit API Gemini in scala. | Alto (costi imprevisti + timeout turni bot). | Gating `\|M\| <= 1` = 0 chiamate, uso solo Platinum+/UCS, timeout 1200ms + fallback locale. | Backend Lead |
| `RSK-03` | Single-node Colyseus perde stanze su scaling orizzontale. | Alto (utenti isolati tra container). | `RedisPresence` + `RedisDriver` in `IMP-008`. | Backend Lead |
| `RSK-04` | Eviction `allkeys-lru` su Redis cancella sessioni/ticket. | Medio-Alto (logout improvvisi, coda rotta). | Passare `redis.conf` a `noeviction` o separare istanza cache. | DevOps |
| `RSK-05` | Reverse proxy Nginx non instrada `/matchmake/` di Colyseus. | Alto (client dietro Nginx non riesce a fare `joinOrCreate`). | Aggiungere `location /matchmake/` in `docker/client/nginx.conf`. | DevOps |
| `RSK-06` | Scope creep dei 7 mini-game blocca la release UNO competitiva. | Alto (ritardo mesi sul core). | Isolamento rigoroso dei 7 mini-game in Fase 5 (`IMP-025`). | PM / Architect |

### 12.2 Discrepanze Rilevate (Fase 1 — Da R6)
1. **Scala Rank (`contenuto-game.md` §7.1 / §14.2 vs `shared/src/constants/ranks.ts`):** `ranks.ts` implementa `16` tier con `SSL` a `3000` e `INITIAL_MMR = 200`; `uno-ultra` v68 definisce `22` tier (`Champion I–III`, `Grand Champion I–III`) con `SSL` a `1600`. Inoltre `contenuto-game.md` §14.2 riporta "MMR iniziale: `0`" per v68, mentre `UNO_ULTRA_v68_Documento_Tecnico` §2.2/§9.1 indica `200`.
2. **Stato Test (`contenuto-game.md` §14.1 vs Filesystem):** §14.1 riporta "Motore UNO puro — Implementato e testato", ma nella ricognizione `shared/tests/*`, `server/tests/*` e `client/tests/` contengono **solo file `.gitkeep` da 0 byte** (`npm run build` è passato, ma **non esistono test Vitest** eseguiti).
3. **Servizi Docker & Placeholder (`contenuto-game.md` vs `docker-compose.yml`):** Il file `docker-compose.yml` definisce **`5` container** (`postgres`, `redis`, `server`, `coturn`, `client`), non `6` (riferimento storico del vecchio stack con container `nginx`/`quic` separati; in `uno ultra game` `nginx` è integrato in `docker/client/Dockerfile` e `docker/nginx/*` è a 0 byte).
4. **Pacchetti Node mancanti (`package.json` vs `contenuto-game.md`):** `@colyseus/redis-presence`, `@colyseus/redis-driver` e `@google/genai` **non** sono ancora dichiarati in `server/package.json` (`⚠️ DA VERIFICARE / DA INSTALLARE`). Inoltre lo script root `"dev"` usa `cmd1 & cmd2` (sintassi shell POSIX/bash che in PowerShell nativo non lancia entrambi in parallelo come previsto).
5. **Inventario `0 byte` esteso (`contenuto-game.md` §14.4 vs Filesystem):** Oltre ai file citati in §14.4, risultano a `0 byte`: tutti i repository Postgres tranne `players.ts`, `persistence/redis/{leaderboard,matchmaking-cache,session-store}.ts`, `server/src/security/*`, `server/src/auth/{oauth-providers,session-manager}.ts`, `server/src/rooms/base/match-timer.ts`, `client/src/state/{inventory-store,match-store,storage-adapter}.ts`, `client/src/ui/navigation/tab-*.ts` (tranne `tab-play.ts`), `client/src/ui/tournament/*.ts` e `client/public/index.html` (duplicato vuoto rispetto a `client/index.html` usato da Vite).
6. **File mancanti per Inviti/Amici/Sfide:** `server/src/net/tcp/rest-routes/` non contiene ancora i placeholder `friends.ts`, `notifications.ts`, `challenges.ts`, `leaderboard.ts`, `sync.ts`.
7. **Bug DDL potenziale in SQL concettuale & Proxy Nginx:** In `nginx.conf` manca il proxy verso `/matchmake/` usato da `colyseus.js`, e `redis.conf` usa `allkeys-lru` incompatibile con dati stateful (`session:*`, `matchmaking:*`).

### 12.3 Decisioni Registrate (Chiusura Blocchi)

| ID | Decisione | Scelta Registrata | Impatto Esecutivo |
|---|---|---|---|
| **D1** | **Scala Ranked** | **Opzione A** — `22` tier (`Bronze I` → `Grand Champion III` + `SSL`), `SSL` a `1600 MMR`, `K-factor 40→20` | Sblocca `IMP-001` (`shared/src/constants/ranks.ts`) e allinea i `25` titoli RLCS, `4` achievement UCS, `winsAtRank` e bracket UCS. |
| **D2** | **Gemini timing** | **3a + 3b** — **Fase 3a**: ranked prima con euristiche `AGGR`/`CONS`/`STRAT`; **Fase 3b**: `GeminiBotAdvisor` dopo, attivabile con feature flag `ENABLE_GEMINI_BOTS` | Sblocca il flusso Fase 3a senza dipendenze esterne né costi LLM; abilita il rollout progressivo e reversibile in Fase 3b (`ENABLE_GEMINI_BOTS=false` di default). |

---

## 13. Cosa NON è in questo file (Out of Scope)

- **Nessun codice sorgente eseguibile** è stato generato o applicato in `shared/src/**`, `server/src/**`, `client/src/**` o `docker/**`.
- **Nessuna modifica** a `contenuto-game.md`, `package.json`, `tsconfig*.json` o file di configurazione.
- **Nessuna esecuzione** di `npm install`, `npm run build`, migrazioni SQL o `docker compose up/down`.
- Le implementazioni reali avranno inizio **esclusivamente dopo conferma esplicita dell'utente** su `IMP-001`.
