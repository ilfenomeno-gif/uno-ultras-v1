// ============================================================
// UNO ULTRA Server — Generic MiniGame Base Room + Blackjack Room
// ============================================================

import type { Client } from 'colyseus';
import {
  blackjackEngine,
  MINI_GAME_ENGINES,
  REALISTIC_BOT_PROFILES,
  type AnyMiniGameMode,
  type MiniGameStateBase,
} from '@uno/shared';
import { verifyAccessToken } from '../../auth/jwt-service.js';
import { RoomActionThrottle } from '../../security/anti-cheat.js';
import { settleFinishedMatch } from '../../services/match-settlement.js';
import { BaseRoom } from '../base/base-room.js';

export interface MiniGameRoomOptions {
  mode?: AnyMiniGameMode;
  maxPlayers?: number;
  fillWithBots?: boolean;
  username?: string;
  token?: string;
  playerId?: string;
}

export abstract class AbstractMiniGameRoom<
  TState extends MiniGameStateBase,
  TAction extends { readonly type: string },
> extends BaseRoom<Record<string, unknown>> {
  protected abstract readonly mode: AnyMiniGameMode;
  protected engineState: TState | null = null;
  protected readonly clientToPlayer = new Map<string, string>();
  protected readonly playerToClient = new Map<string, Client>();
  protected readonly lobbyPlayers: string[] = [];
  protected targetPlayers = 2;
  protected fillWithBots = true;
  private readonly actionThrottle = new RoomActionThrottle(15, 2000);
  private startedAtMs = 0;
  private turnCount = 0;
  private readonly botUsernames = new Map<string, string>();

  override onCreate(options: MiniGameRoomOptions): void {
    this.targetPlayers = Math.max(1, Math.min(4, options.maxPlayers ?? 2));
    this.fillWithBots = options.fillWithBots ?? true;
    this.maxClients = this.targetPlayers;

    this.onMessage('action', (client, payload: TAction) => {
      const playerId = this.clientToPlayer.get(client.sessionId);
      if (!playerId || !this.engineState) return;
      if (!this.actionThrottle.allow(playerId)) {
        this.sendSafe(client, 'action_error', { reason: 'Troppe azioni troppo velocemente' });
        return;
      }
      try {
         
        const engine = MINI_GAME_ENGINES[this.mode] as any;
        this.engineState = engine.applyAction(this.engineState, playerId, payload) as TState;
        this.turnCount += 1;
        this.pushViews();
        if (this.engineState.phase === 'finished' && this.engineState.winnerId) {
          this.finalizeMiniGame();
          return;
        }
        this.maybeRunBotTurn();
      } catch (err) {
        this.sendSafe(client, 'action_error', {
          reason: err instanceof Error ? err.message : 'Azione non valida',
        });
      }
    });
  }

  override onJoin(client: Client, options: MiniGameRoomOptions): void {
    let playerId = options.playerId ?? client.sessionId;
    if (options.token) {
      try {
        playerId = verifyAccessToken(options.token).sub;
      } catch {
        throw new Error('Token non valido');
      }
    }
    this.clientToPlayer.set(client.sessionId, playerId);
    this.playerToClient.set(playerId, client);
    if (!this.lobbyPlayers.includes(playerId)) {
      this.lobbyPlayers.push(playerId);
    }

    if (!this.engineState && (this.lobbyPlayers.length >= this.targetPlayers || this.fillWithBots)) {
      this.startMiniGame();
    } else if (this.engineState) {
      this.pushViewToPlayer(playerId);
    }
  }

  override onLeave(client: Client): void {
    const pid = this.clientToPlayer.get(client.sessionId);
    if (pid) {
      this.playerToClient.delete(pid);
      this.clientToPlayer.delete(client.sessionId);
    }
  }

  protected startMiniGame(): void {
     
    const engine = MINI_GAME_ENGINES[this.mode] as any;
    const participants = [...this.lobbyPlayers];
    this.botUsernames.clear();
    const botSeed = Date.now() % REALISTIC_BOT_PROFILES.length;
    while (participants.length < Math.max(engine.minPlayers, this.targetPlayers)) {
      const botId = `bot_${participants.length + 1}`;
      const botProfile =
        REALISTIC_BOT_PROFILES[(botSeed + participants.length * 7) % REALISTIC_BOT_PROFILES.length];
      this.botUsernames.set(botId, botProfile?.name ?? botId);
      participants.push(botId);
    }
    this.startedAtMs = Date.now();
    this.turnCount = 0;
    this.engineState = engine.createInitialState(this.roomId, participants) as TState;
    this.pushViews();
    this.maybeRunBotTurn();
  }

  private finalizeMiniGame(): void {
    if (!this.engineState || !this.engineState.winnerId) return;
    const state = this.engineState;
    void settleFinishedMatch({
      matchId: this.roomId,
      mode: this.mode,
      isRanked: false,
      winnerId: state.winnerId!,
      turnCount: this.turnCount,
      durationSec: Math.max(1, Math.round((Date.now() - this.startedAtMs) / 1000)),
      participants: state.playerOrder.map((pid) => ({
        id: pid,
        username: this.botUsernames.get(pid) ?? pid,
        isBot: pid.startsWith('bot_'),
        score: state.scores[pid] ?? 0,
      })),
    });
  }

  protected maybeRunBotTurn(): void {
    if (!this.engineState || this.engineState.phase !== 'playing') return;
    const currentId = this.engineState.playerOrder[this.engineState.currentTurnIndex];
    if (!currentId || !currentId.startsWith('bot_')) return;

    this.clock.setTimeout(() => {
      if (!this.engineState || this.engineState.phase !== 'playing') return;
       
      const engine = MINI_GAME_ENGINES[this.mode] as any;
      const legal = engine.getLegalActions(this.engineState, currentId) as TAction[];
      if (legal.length === 0) return;
      const picked = legal[0]!;
      this.engineState = engine.applyAction(this.engineState, currentId, picked) as TState;
      this.pushViews();
      this.maybeRunBotTurn();
    }, 550);
  }

  protected pushViewToPlayer(playerId: string): void {
    const client = this.playerToClient.get(playerId);
    if (!client || !this.engineState) return;
     
    const engine = MINI_GAME_ENGINES[this.mode] as any;
    this.sendSafe(client, 'minigame_state', engine.getPublicView(this.engineState, playerId));
  }

  protected pushViews(): void {
    for (const pid of this.playerToClient.keys()) {
      this.pushViewToPlayer(pid);
    }
  }
}

export class BlackjackRoom extends AbstractMiniGameRoom<
  ReturnType<typeof blackjackEngine.createInitialState>,
  { type: 'hit' | 'stand' | 'double' }
> {
  protected readonly mode = 'blackjack' as const;
}

export class GenericMiniGameRoom extends AbstractMiniGameRoom<
  MiniGameStateBase,
  { readonly type: string }
> {
  protected mode: AnyMiniGameMode = 'poker-texas';

  override onCreate(options: MiniGameRoomOptions): void {
    if (options.mode && options.mode in MINI_GAME_ENGINES) {
      this.mode = options.mode;
    }
    super.onCreate(options);
  }
}
