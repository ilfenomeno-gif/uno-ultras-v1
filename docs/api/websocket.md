# UNO ULTRA — Protocollo WebSocket Colyseus (`/ws`, `/matchmake/`)

Le stanze autoritative sono definite in `server/src/index.ts`: `uno`, `blackjack`, `scala40`, `scopa`, `minigame`.

---

## Ciclo Vita Stanza `UnoRoom`

1. **Creazione (`onCreate`)**
   - Opzioni supportate: `maxPlayers` (`2..4`), `fillWithBots`, `botDifficulty`, `ranked`, `variant` (`standard`, `blitz`, `chaos`, `team`, `custom`), `matchmade`, `allowedPlayerIds`, `noShowTimeoutMs`.
   - Se `matchmade: true`, la stanza imposta `this.setPrivate(true)`. Se `fillWithBots === false`, avvia `noShowTimer` (`MATCHMAKING_NOSHOW_TIMEOUT_MS`, default `15000 ms`).

2. **Autorizzazione Ingresso (`onAuth`)**
   - Se `allowedPlayerIds` è valorizzato (stanze create dal matchmaking), verifica il JWT (`token`) o `playerId` (esclusi spettatori autorizzati) e rigetta ingressi non autorizzati con errore esplicito prima ancora di allocare slot di gioco.

3. **Ingresso & Avvio (`onJoin`)**
   - Verifica eventuale ban matchmaking attivo su partite `ranked` (`getActiveMatchmakingBan`).
   - Applica loadout cosmetico (`avatarId`, `frameId`, `cardBackId`, `titleId`) e `rankTier`/`mmr` per playlist.
   - Avvia automaticamente la partita quando `lobbyParticipants.size >= targetPlayers` (o appena il giocatore entra in una stanza `bot_fallback`).
   - Allo scadere di `noShowTimer`: con `0` giocatori la stanza si disconnette; con `>=1` giocatori in lobby attiva `fillWithBots = true`, invia `no_show_fallback` e avvia il match.

---

## Messaggi & Canali (`@uno/shared` → `TCP_CHANNELS`)

### Client → Server
| Canale | Payload | Note |
|---|---|---|
| `start_match` | — | Solo host in fase `lobby`. |
| `play_card` | `{ cardId, chosenColor? }` | Validato con Zod e `RoomActionThrottle(12, 2000)`. |
| `draw_card` | — | Pesca carta dal mazzo o riscatta accumulo `+2`/`+4`. |
| `call_uno` | — | Dichiarazione `UNO!` con `1` carta rimasta. |
| `challenge_wild4` | — | Sfida l'ultimo `wild_draw4` giocato. |
| `rematch_vote` | — | Voto `Forma Gruppo / Gioca di Nuovo` a fine partita. |
| `chat` / `ping` / `leave_match` | testo / `ts` | Chat stanza, heartbeat e uscita esplicita. |

### Server → Client
| Canale | Payload | Note |
|---|---|---|
| `hand` | `{ type: 'hand', cards }` | Inviato **privatamente** via `client.send` al solo proprietario; le mani non entrano mai nello stato sincronizzato `UnoRoomState`. |
| `action_result` | `{ type: 'action_result', ok, reason? }` | Conferma o errore mossa / throttle. |
| `uno_called` | `{ type: 'uno_called', playerId }` | Broadcast dichiarazione `UNO!`. |
| `no_show_fallback` | `{ joined, target }` | Notifica completamento bot dopo scadenza finestra no-show. |
| `chaos_flip` | `{ direction, turnCount }` | Inversione direzione in modalità `chaos`. |
| `match_ended` | `{ type: 'match_ended', winnerId, scores, receipts? }` | Liquidazione completa (MMR, divisione, classificazione, XP Battle Card, V-Card, sfide). |
