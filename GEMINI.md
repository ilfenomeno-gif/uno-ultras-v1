# GEMINI — Router Operativo UNO ULTRA (ASTRALIS v3)

Questo file è il punto di ingresso snello (**Hub and Spoke**) per l'assistenza ingegneristica su `UNO ULTRA`.

## Identità del Progetto

- **Monorepo**: `uno-ultra-game` con workspace `@uno/shared`, `@uno/server`, `@uno/client`.
- **Runtime**: Node `>=24`, npm `>=11`, TypeScript strict (`exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`), import relativi ESM con estensione `.js`.
- **Stack Client**: Vanilla TypeScript (`0` file `.tsx`), Vite 6, Web Audio API procedurale senza asset binari, Colyseus 0.16.
- **Stack Server e Dati**: Express REST, Colyseus 0.16 (`UnoRoom` autoritativa), PostgreSQL, Redis, CoTURN, telemetria UDP `:41234`.
- **Documento Intoccabile**: `docs/game-design/contenuto-game.md` è la specifica di game design in sola lettura; non modificarlo mai.

## Mappa dei Collegamenti (Spoke)

- **Preferenze Utente**: [user_preferences.md](file:///C:/Users/PC/Pictures/uno%20ultras%20vscode/uno/uno%20ultra%20game/docs/astralis/user_preferences.md) (profilo neutro personalizzabile).
- **Diario Sessioni e Avanzamento**: [REPORT_SESSIONE.md](file:///C:/Users/PC/Pictures/uno%20ultras%20vscode/uno/uno%20ultra%20game/docs/astralis/REPORT_SESSIONE.md) (cronologia inversa con gating `[ ]`, `[/]`, `[x]`).
- **Analisi Critica del Progetto**: [ANALISI-CRITICA-PROGETTO.md](file:///C:/Users/PC/Pictures/uno%20ultras%20vscode/uno/uno%20ultra%20game/docs/audit/ANALISI-CRITICA-PROGETTO.md).
- **Regole di Gioco UNO ULTRA**: [uno-rules.md](file:///C:/Users/PC/Pictures/uno%20ultras%20vscode/uno/uno%20ultra%20game/docs/game-design/uno-rules.md).
- **Specifica Game Design (Solo Lettura)**: [contenuto-game.md](file:///C:/Users/PC/Pictures/uno%20ultras%20vscode/uno/uno%20ultra%20game/docs/game-design/contenuto-game.md).

## I 6 Canoni ASTRALIS Applicati al Progetto

- **Canone 1 — Analizza e Proponi Prima di Modificare**: per richieste aperte o architetturali, analizza prima lo stato reale e proponi opzioni chiare; modifica i file soltanto con il consenso dell'utente.
- **Canone 2 — Gating a Tre Stati**: usa `[ ]` (aperto), `[/]` (in corso), `[x]` (verificato e chiuso) nel registro attività; non chiudere un'attività prima della verifica reale.
- **Canone 3 — Contesto Snello**: mantieni questo router sotto le 120 righe e sposta i dettagli operativi nei documenti di approfondimento.
- **Canone 4 — Cronologia Inversa**: registra ogni nuova sessione in cima a `REPORT_SESSIONE.md` senza riscrivere lo storico precedente.
- **Canone 5 — Comunicazione Lineare**: risposte e documenti dall'alto verso il basso, zero diagrammi 2D ASCII, zero tabelle complesse, liste puntate con etichetta in grassetto e logica `Se... Allora`.
- **Canone 6 — Onestà Tecnica e Accessibilità Videogioco**: zero controlli UI decorativi o orfani, `aria-disabled` al posto della rimozione dal focus (**Zero Focus Drop**), **Single-Voice-Authority** con **Purge-on-Close**, **Safe Loop** con frecce/Numpad e tasti `1..9/0/-/=`, e earcons procedurali in memoria con tetto di sicurezza `0.75` (`-2.5 dB`) e audio ducking dinamico.

## Regole di Verifica Obbligatorie

- **Se modifichi codice o configurazioni**: allora esegui `npm run ci` (`eslint .` + `typecheck` + `build` + `test`) e verifica uscita `0` con `0` errori e `0` warning prima di dichiarare completato il lavoro.
- **Se modifichi lo stack di produzione**: allora verifica anche la build Docker (`server`, `client`) e i controlli di salute HTTP live.
