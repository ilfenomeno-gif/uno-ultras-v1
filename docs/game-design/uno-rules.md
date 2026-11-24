# Regole UNO & Varianti Ultra (`@uno/shared` + `UnoRoom`)

## 1. Regole Ufficiali UNO Classic
- **Mazzo:** `108` carte standard (`0–9` su 4 colori `red`, `yellow`, `green`, `blue`, `Skip`, `Reverse`, `+2`, `Wild`, `Wild +4`).
- **Stacking (`+2` / `+4`):** configurabile fino a `stackingCap` (default `20`), con soglia overload (`stackingOverload`, default `30`).
- **Wild +4 Strict & Challenge:** se `wildDraw4Strict` è attivo, `+4` è legale solo se il giocatore non possiede carte del colore attivo; l'avversario successivo può contestare con `challenge_wild4`.
- **Dichiarazione `UNO!`:** obbligatoria quando il giocatore scende a `1` carta (`call_uno`).
- **Timeout & Disconnessione:** turno umano con pescata automatica a scadenza `turnTimeoutSeconds`; finestra riconnessione `30s`, poi sostituzione con bot `STRAT`.

## 2. Varianti Competitive & Social
| Variante | Chiave | Parametri Principali |
|---|---|---|
| **Standard** | `standard` | Regole classiche (`7` carte iniziali, turno `30s`, `stackingCap: 20`). |
| **Blitz** | `blitz` | Ritmo veloce (`5` carte iniziali, turno `<= 10s`, `stackingCap: 16`). |
| **Chaos** | `chaos` | `9` carte iniziali, `stackingCap: 40`, `wildDraw4Strict: false` e **Chaos Flip** automatico della direzione ogni `4` turni. |
| **Team 2v2** | `team` | Richiede esattamente `4` giocatori (`teamId` alternati `A` / `B` in `PlayerState`). |
| **Custom** | `custom` | Preset personalizzato validato via Zod con `validatePresetForPlayers()`. |
