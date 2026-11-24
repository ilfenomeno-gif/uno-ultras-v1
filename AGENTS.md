# AGENTS — Istruzioni Cross-Agente per UNO ULTRA

Questo file allinea qualsiasi agente AI alle regole di governance e qualità definite in [GEMINI.md](file:///C:/Users/PC/Pictures/uno%20ultras%20vscode/uno/uno%20ultra%20game/GEMINI.md).

## Regole Invarianti

- **Confine Workspace**: lavora esclusivamente dentro `c:\Users\PC\Pictures\uno ultras vscode\uno\uno ultra game`; non eseguire comandi Git nella directory superiore.
- **Integrità Specifica**: non modificare né sovrascrivere `docs/game-design/contenuto-game.md`.
- **Consenso Esplicito**: su richieste aperte analizza e proponi prima di modificare i file; procedi direttamente solo su istruzioni operative già autorizzate.
- **Profilo Utente Neutro**: leggi [user_preferences.md](file:///C:/Users/PC/Pictures/uno%20ultras%20vscode/uno/uno%20ultra%20game/docs/astralis/user_preferences.md) e non assumere preferenze o profili terzi non dichiarati dall'utente attuale.

## Standard di Implementazione e Accessibilità

- **TypeScript Rigoroso**: zero `any`, import relativi con estensione `.js`, rispetto di `exactOptionalPropertyTypes` e `noUncheckedIndexedAccess`.
- **Onestà Percettiva GUI**: ogni impostazione esposta in UI deve produrre un effetto runtime verificabile e persistente.
- **Tastiera, Focus e Audio**: usa `aria-disabled` invece di disabilitare i pulsanti interattivi di gioco (**Zero Focus Drop**), incapsula gli annunci in [aria-live.ts](file:///C:/Users/PC/Pictures/uno%20ultras%20vscode/uno/uno%20ultra%20game/client/src/core/aria-live.ts) (**Single-Voice-Authority** + **Purge-on-Close**), e usa [audio-earcons.ts](file:///C:/Users/PC/Pictures/uno%20ultras%20vscode/uno/uno%20ultra%20game/client/src/core/audio-earcons.ts) con tetto `0.75` e ducking.
- **Chiusura Verificata**: esegui `npm run ci` (`eslint .`, `typecheck`, `build`, `test`) e aggiorna [REPORT_SESSIONE.md](file:///C:/Users/PC/Pictures/uno%20ultras%20vscode/uno/uno%20ultra%20game/docs/astralis/REPORT_SESSIONE.md) prima del commit.
