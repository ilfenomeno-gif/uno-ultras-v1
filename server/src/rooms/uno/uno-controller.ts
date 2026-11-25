// ============================================================
// UNO ULTRA Server — UnoController (bridge Engine ↔ RoomState)
// ============================================================
// Mantiene EngineState privato sul server e proietta solo i
// dati PUBBLICI nello schema Colyseus UnoRoomState.
// Le mani private non entrano mai nello state sincronizzato.
// ============================================================

import {
  applyAction,
  CardSchema,
  createInitialState,
  PlayerState,
  startMatch,
  type AIProfile,
  type EngineState,
  type MatchAction,
  type UnoCard,
  type UnoRoomState,
  type UnoRules,
} from '@uno/shared';

export interface UnoParticipant {
  id: string;
  username: string;
  isBot: boolean;
  aiProfile?: AIProfile;
  avatarId?: string;
  frameId?: string;
  cardBackId?: string;
  titleId?: string;
  rankTier?: string;
  mmr?: number;
  titleText?: string;
  titleColor?: string;
}

export class UnoController {
  private engine: EngineState | null = null;

  get state(): EngineState | null {
    return this.engine;
  }

  initMatch(
    matchId: string,
    participants: readonly UnoParticipant[],
    seed: number,
    rules?: Partial<UnoRules>
  ): EngineState {
    const opts = {
      matchId,
      players: participants.map((p) =>
        p.aiProfile !== undefined
          ? { id: p.id, username: p.username, isBot: p.isBot, aiProfile: p.aiProfile }
          : { id: p.id, username: p.username, isBot: p.isBot }
      ),
      seed,
      ...(rules !== undefined ? { rules } : {}),
    };

    const initial = createInitialState(opts);
    this.engine = startMatch(initial);
    return this.engine;
  }

  dispatch(playerId: string, action: MatchAction): EngineState {
    if (!this.engine) {
      throw new Error('Partita non ancora avviata');
    }
    this.engine = applyAction(this.engine, playerId, action);
    return this.engine;
  }

  getPlayerHand(playerId: string): UnoCard[] {
    if (!this.engine) return [];
    const p = this.engine.players.get(playerId);
    return p ? [...p.hand] : [];
  }

  getCurrentPlayerId(): string | null {
    if (!this.engine || this.engine.phase !== 'playing') return null;
    return this.engine.turnOrder[this.engine.currentTurnIndex] ?? null;
  }

  /** Proietta i soli dati pubblici da EngineState → UnoRoomState. */
  syncToRoomState(roomState: UnoRoomState): void {
    if (!this.engine) return;
    const e = this.engine;

    roomState.matchId = e.matchId;
    roomState.phase = e.phase;
    roomState.currentTurnIndex = e.currentTurnIndex;
    roomState.direction = e.direction;
    roomState.pendingDrawCount = e.pendingDrawCount;
    roomState.activeColor = e.activeColor ?? '';
    roomState.winnerId = e.winnerId ?? '';

    const top = e.discardPile[0];
    if (top) {
      roomState.topCard = CardSchema.fromCard(top);
      roomState.hasTopCard = true;
    } else {
      roomState.hasTopCard = false;
    }

    // Aggiorna ordine dei turni solo se cambiato
    const needsTurnSync =
      roomState.turnOrder.length !== e.turnOrder.length ||
      e.turnOrder.some((id, idx) => roomState.turnOrder[idx] !== id);
    if (needsTurnSync) {
      roomState.turnOrder.clear();
      for (const id of e.turnOrder) {
        roomState.turnOrder.push(id);
      }
    }

    // Aggiorna i giocatori (solo cardCount pubblico, MAI la mano)
    for (const [id, p] of e.players) {
      let ps = roomState.players.get(id);
      if (!ps) {
        ps = new PlayerState();
        ps.id = p.id;
        roomState.players.set(id, ps);
      }
      ps.username = p.username;
      ps.cardCount = p.hand.length;
      ps.isBot = p.isBot;
      ps.isConnected = p.isConnected;
      ps.aiProfile = p.aiProfile;
      ps.hasCalledUno = p.hasCalledUno;
    }
  }

  /** Sostituisce un giocatore disconnesso con un bot sullo stesso slot. */
  replaceWithBot(playerId: string, profile: AIProfile): void {
    if (!this.engine) return;
    const p = this.engine.players.get(playerId);
    if (!p) return;
    p.isBot = true;
    p.isConnected = false;
    p.aiProfile = profile;
  }

  /** Calcola i punteggi finali (somma valori carte residue avversarie). */
  computeScores(): Record<string, number> {
    if (!this.engine) return {};
    const scores: Record<string, number> = {};
    let winnerPoints = 0;

    for (const [id, p] of this.engine.players) {
      if (id === this.engine.winnerId) {
        scores[id] = 0;
        continue;
      }
      let handPoints = 0;
      for (const card of p.hand) {
        if (card.kind === 'number') {
          handPoints += card.value ?? 0;
        } else if (card.kind === 'wild' || card.kind === 'wild_draw4') {
          handPoints += 50;
        } else {
          handPoints += 20;
        }
      }
      scores[id] = -handPoints;
      winnerPoints += handPoints;
    }

    if (this.engine.winnerId) {
      scores[this.engine.winnerId] = winnerPoints;
    }
    return scores;
  }
}
