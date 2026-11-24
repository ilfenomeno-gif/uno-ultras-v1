// ============================================================
// UNO ULTRA Server — Authoritative Colyseus UnoRoom
// ============================================================
// Gestisce il ciclo di vita della stanza UNO:
//  • Lobby → riempimento bot opzionale → startMatch
//  • Azioni validate via Zod + applicate al motore puro
//  • Mani private inviate via client.send('hand', ...)
//  • Turni bot con think-delay realistico
//  • Timeout turno umano (30s) e riconnessione DC (30s)
// ============================================================

import type { Client, Delayed } from 'colyseus';
import {
  decideAction,
  getThinkDelayMs,
  PlayerState,
  TCP_CHANNELS,
  UnoRoomState,
  validatePresetForPlayers,
  VARIANT_PRESETS,
  type AIDifficulty,
  type AIProfile,
  type CustomMatchConfig,
  type MatchAction,
  type MatchVariant,
} from '@uno/shared';
import { verifyAccessToken } from '../../auth/jwt-service.js';
import { adviseBotMove } from '../../ai/gemini-bot-advisor.js';
import { featureFlags } from '../../config/feature-flags.js';
import { getEquippedLoadout } from '../../persistence/postgres/repositories/inventory.js';
import { RoomActionThrottle } from '../../security/anti-cheat.js';
import { settleFinishedMatchWithReceipts } from '../../services/match-settlement.js';
import { BaseRoom } from '../base/base-room.js';
import { presenceService } from '../base/presence.js';
import { UnoController, type UnoParticipant } from './uno-controller.js';
import { validateMatchAction } from './uno-validator.js';

export interface UnoRoomCreateOptions {
  maxPlayers?: number;
  fillWithBots?: boolean;
  botDifficulty?: AIDifficulty;
  ranked?: boolean;
  variant?: MatchVariant;
  customConfig?: CustomMatchConfig;
}

export interface UnoRoomJoinOptions {
  token?: string;
  username?: string;
  playerId?: string;
  spectator?: boolean;
}

const BOT_PROFILES_ROTATION: readonly AIProfile[] = ['AGGR', 'CONS', 'STRAT'];
const RECONNECT_WINDOW_SECONDS = 30;

export class UnoRoom extends BaseRoom<UnoRoomState> {
  private readonly controller = new UnoController();
  private readonly clientToPlayerId = new Map<string, string>();
  private readonly playerIdToClient = new Map<string, Client>();
  private readonly lobbyParticipants = new Map<string, UnoParticipant>();
  private readonly spectators = new Set<string>();
  private readonly rematchVotes = new Set<string>();

  private targetPlayers = 4;
  private fillWithBots = true;
  private botDifficulty: AIDifficulty = 'normal';
  private isRanked = false;
  private matchConfig: CustomMatchConfig = VARIANT_PRESETS.standard;
  private startedAtMs = 0;
  private initialSeed = 0;
  private turnCount = 0;
  private readonly actionThrottle = new RoomActionThrottle(12, 2000);
  private readonly playerCounters = new Map<
    string,
    { cardsPlayed: number; unoCalls: number; drawStacks: number }
  >();
  private readonly replayEvents: Record<string, unknown>[] = [];

  private botTimer: Delayed | null = null;
  private turnTimer: Delayed | null = null;

  override onCreate(options: UnoRoomCreateOptions): void {
    this.setState(new UnoRoomState());
    this.state.matchId = this.roomId;
    this.state.phase = 'lobby';

    const requested = options.maxPlayers ?? 4;
    this.targetPlayers = Math.max(2, Math.min(4, requested));
    this.maxClients = this.targetPlayers + 4; // room extra slots per spettatori
    this.fillWithBots = options.fillWithBots ?? true;
    this.botDifficulty = options.botDifficulty ?? 'normal';
    this.isRanked = options.ranked ?? false;

    const basePreset = VARIANT_PRESETS[options.variant ?? 'standard'] ?? VARIANT_PRESETS.standard;
    const candidate = options.customConfig ?? basePreset;
    const validated = validatePresetForPlayers(candidate, this.targetPlayers);
    this.matchConfig = validated.ok && validated.config ? validated.config : basePreset;

    this.registerMessageHandlers();
    this.logInfo('UnoRoom created', {
      targetPlayers: this.targetPlayers,
      fillWithBots: this.fillWithBots,
      botDifficulty: this.botDifficulty,
      variant: this.matchConfig.variant,
    });
  }

  override onJoin(client: Client, options: UnoRoomJoinOptions): void {
    let playerId = options.playerId ?? client.sessionId;
    let username =
      options.username?.trim().slice(0, 20) || `Player_${client.sessionId.slice(0, 5)}`;

    if (options.token) {
      try {
        const payload = verifyAccessToken(options.token);
        playerId = payload.sub;
        username = payload.username;
      } catch {
        throw new Error('Token di autenticazione non valido');
      }
    }

    this.clientToPlayerId.set(client.sessionId, playerId);
    this.playerIdToClient.set(playerId, client);

    if (options.spectator && this.matchConfig.allowSpectators) {
      this.spectators.add(playerId);
      this.logInfo('Spectator joined UnoRoom', { playerId, username });
      return;
    }

    void presenceService.setInGame(playerId, this.roomId);

    // Se la partita è già in corso (riconnessione), reinvia solo la mano
    if (this.state.phase === 'playing') {
      const existing = this.controller.state?.players.get(playerId);
      if (existing) {
        existing.isConnected = true;
        this.controller.syncToRoomState(this.state);
        this.sendPrivateHand(playerId);
      }
      return;
    }

    if (!this.state.hostId) {
      this.state.hostId = playerId;
    }

    const participant: UnoParticipant = {
      id: playerId,
      username,
      isBot: false,
    };
    this.lobbyParticipants.set(playerId, participant);

    const ps = new PlayerState();
    ps.id = playerId;
    ps.username = username;
    ps.isBot = false;
    ps.isConnected = true;
    this.state.players.set(playerId, ps);

    void getEquippedLoadout(playerId)
      .then((loadout) => {
        const livePs = this.state.players.get(playerId);
        if (!livePs) return;
        livePs.avatarId = loadout.avatar;
        livePs.frameId = loadout.frame;
        livePs.cardBackId = loadout.cardStyle;
        livePs.titleId = loadout.title;
      })
      .catch(() => {
        // Fallback default cosmetics for guest / DB-offline tests
      });

    this.logInfo('Player joined UnoRoom', { playerId, username });

    // Avvio automatico quando la stanza raggiunge il numero target di umani
    if (this.lobbyParticipants.size >= this.targetPlayers) {
      this.startUnoMatch();
    }
  }

  override async onLeave(client: Client, consented: boolean): Promise<void> {
    const playerId = this.clientToPlayerId.get(client.sessionId);
    if (!playerId) return;

    this.playerIdToClient.delete(playerId);
    this.clientToPlayerId.delete(client.sessionId);
    this.actionThrottle.reset(playerId);
    this.rematchVotes.delete(playerId);

    if (this.spectators.delete(playerId)) {
      return;
    }

    if (this.state.phase === 'lobby') {
      this.lobbyParticipants.delete(playerId);
      this.state.players.delete(playerId);
      if (this.state.hostId === playerId) {
        const nextHost = this.lobbyParticipants.keys().next().value;
        this.state.hostId = nextHost ?? '';
      }
      void presenceService.setOffline(playerId);
      return;
    }

    if (this.state.phase !== 'playing') {
      void presenceService.setOffline(playerId);
      return;
    }

    const ps = this.state.players.get(playerId);
    if (ps) ps.isConnected = false;

    if (!consented) {
      this.broadcast(TCP_CHANNELS.PLAYER_DISCONNECTED, {
        type: 'player_disconnected',
        playerId,
        reconnectWindowMs: RECONNECT_WINDOW_SECONDS * 1000,
      });

      try {
        const reconnected = await this.allowReconnection(client, RECONNECT_WINDOW_SECONDS);
        this.clientToPlayerId.set(reconnected.sessionId, playerId);
        this.playerIdToClient.set(playerId, reconnected);
        const enginePlayer = this.controller.state?.players.get(playerId);
        if (enginePlayer) enginePlayer.isConnected = true;
        this.controller.syncToRoomState(this.state);
        this.sendPrivateHand(playerId);
        this.logInfo('Player reconnected', { playerId });
        return;
      } catch {
        this.logWarn('Reconnection window expired; replacing with bot', { playerId });
      }
    }

    void presenceService.setOffline(playerId);

    // Sostituisce il giocatore disconnesso con un bot strategico
    const fallbackProfile: AIProfile = 'STRAT';
    this.controller.replaceWithBot(playerId, fallbackProfile);
    this.controller.syncToRoomState(this.state);
    this.broadcast(TCP_CHANNELS.BOT_REPLACED, {
      type: 'bot_replaced',
      playerId,
      botProfile: fallbackProfile,
    });
    this.scheduleNextTurn();
  }

  override onDispose(): void {
    for (const playerId of this.playerIdToClient.keys()) {
      void presenceService.setOffline(playerId);
    }
    this.clearTimers();
    this.logInfo('UnoRoom disposed');
  }

  // ── Message handlers ──────────────────────────────────────

  private registerMessageHandlers(): void {
    this.onMessage('start_match', (client) => {
      const playerId = this.clientToPlayerId.get(client.sessionId);
      if (!playerId || playerId !== this.state.hostId || this.state.phase !== 'lobby') {
        this.sendSafe(client, TCP_CHANNELS.ACTION_RESULT, {
          type: 'action_result',
          ok: false,
          reason: 'Solo l\'host può avviare la partita in lobby',
        });
        return;
      }
      this.startUnoMatch();
    });

    const handleAction = (client: Client, raw: unknown) => {
      const playerId = this.clientToPlayerId.get(client.sessionId);
      if (!playerId || this.spectators.has(playerId)) return;

      if (!this.actionThrottle.allow(playerId)) {
        this.sendSafe(client, TCP_CHANNELS.ACTION_RESULT, {
          type: 'action_result',
          ok: false,
          reason: 'Troppe azioni troppo velocemente',
        });
        return;
      }

      const validated = validateMatchAction(raw);
      if (!validated.ok) {
        this.sendSafe(client, TCP_CHANNELS.ACTION_RESULT, {
          type: 'action_result',
          ok: false,
          reason: validated.error,
        });
        return;
      }

      this.executeAction(playerId, validated.value, client);
    };

    this.onMessage(TCP_CHANNELS.PLAY_CARD, (client, payload: Record<string, unknown>) =>
      handleAction(client, { type: 'play_card', ...payload })
    );
    this.onMessage(TCP_CHANNELS.DRAW_CARD, (client) =>
      handleAction(client, { type: 'draw_card' })
    );
    this.onMessage(TCP_CHANNELS.CALL_UNO, (client) =>
      handleAction(client, { type: 'call_uno' })
    );
    this.onMessage(TCP_CHANNELS.CHALLENGE_WILD4, (client) =>
      handleAction(client, { type: 'challenge_wild4' })
    );

    this.onMessage(TCP_CHANNELS.CHAT, (client, payload: { text?: unknown }) => {
      const playerId = this.clientToPlayerId.get(client.sessionId);
      if (!playerId || typeof payload?.text !== 'string') return;
      const text = payload.text.trim().slice(0, 200);
      if (!text) return;
      this.broadcast(TCP_CHANNELS.CHAT, {
        type: 'chat',
        senderId: playerId,
        text,
        ts: Date.now(),
      });
    });

    this.onMessage(TCP_CHANNELS.PING, (client, payload: { ts?: unknown }) => {
      const ts = typeof payload?.ts === 'number' ? payload.ts : Date.now();
      this.sendSafe(client, TCP_CHANNELS.PONG, { type: 'pong', ts });
    });

    this.onMessage(TCP_CHANNELS.LEAVE_MATCH, (client) => {
      client.leave();
    });

    this.onMessage('rematch_vote', (client) => {
      const playerId = this.clientToPlayerId.get(client.sessionId);
      if (
        !playerId ||
        this.spectators.has(playerId) ||
        this.state.phase !== 'finished' ||
        !this.matchConfig.allowRematch
      ) {
        return;
      }
      this.rematchVotes.add(playerId);
      const connectedHumans = [...this.lobbyParticipants.values()].filter(
        (p) => !p.isBot && this.playerIdToClient.has(p.id),
      ).length;
      const required = Math.max(1, connectedHumans);
      const votes = this.rematchVotes.size;
      this.broadcast('rematch_status', { votes, required });
      if (votes >= required) {
        this.rematchVotes.clear();
        this.state.phase = 'lobby';
        this.startUnoMatch();
      }
    });
  }

  // ── Match flow ────────────────────────────────────────────

  private startUnoMatch(): void {
    const participants: UnoParticipant[] = [...this.lobbyParticipants.values()];

    if (this.fillWithBots) {
      let botIdx = 1;
      while (participants.length < this.targetPlayers) {
        const profile = BOT_PROFILES_ROTATION[(botIdx - 1) % BOT_PROFILES_ROTATION.length] ?? 'STRAT';
        participants.push({
          id: `bot_${botIdx}`,
          username: `UNO_BOT_${botIdx}`,
          isBot: true,
          aiProfile: profile,
        });
        botIdx++;
      }
    }

    if (participants.length < 2) {
      this.logWarn('Cannot start match with fewer than 2 players');
      return;
    }

    const seed = Date.now() & 0x7fffffff;
    this.initialSeed = seed;
    this.startedAtMs = Date.now();
    this.turnCount = 0;
    this.rematchVotes.clear();
    this.playerCounters.clear();
    this.replayEvents.length = 0;
    this.controller.initMatch(this.roomId, participants, seed, this.matchConfig.rules);
    this.controller.syncToRoomState(this.state);
    if (this.matchConfig.teamPlay && participants.length === 4) {
      participants.forEach((p, idx) => {
        const ps = this.state.players.get(p.id);
        if (ps) ps.teamId = idx % 2 === 0 ? 'A' : 'B';
      });
    }
    this.sendAllPrivateHands();
    if (!this.matchConfig.allowSpectators) {
      this.lock();
    }

    this.logInfo('UNO match started', {
      players: participants.length,
      seed,
    });
    this.scheduleNextTurn();
  }

  private executeAction(playerId: string, action: MatchAction, client?: Client): void {
    if (this.state.phase !== 'playing') {
      if (client) {
        this.sendSafe(client, TCP_CHANNELS.ACTION_RESULT, {
          type: 'action_result',
          ok: false,
          reason: 'La partita non è attiva',
        });
      }
      return;
    }

    try {
      const nextState = this.controller.dispatch(playerId, action);
      this.turnCount += 1;
      if (
        this.matchConfig.chaosFlipIntervalTurns > 0 &&
        nextState.phase === 'playing' &&
        this.turnCount % this.matchConfig.chaosFlipIntervalTurns === 0
      ) {
        nextState.direction = (nextState.direction * -1) as 1 | -1;
        this.broadcast('chaos_flip', {
          direction: nextState.direction,
          turnCount: this.turnCount,
        });
      }
      const stats = this.playerCounters.get(playerId) ?? { cardsPlayed: 0, unoCalls: 0, drawStacks: 0 };
      if (action.type === 'play_card') {
        stats.cardsPlayed += 1;
        if (nextState.pendingDrawCount > 0) stats.drawStacks += 1;
      } else if (action.type === 'call_uno') {
        stats.unoCalls += 1;
      }
      this.playerCounters.set(playerId, stats);
      if (this.replayEvents.length < 500) {
        this.replayEvents.push({ t: this.turnCount, playerId, action });
      }
      this.controller.syncToRoomState(this.state);
      this.sendAllPrivateHands();

      if (client) {
        this.sendSafe(client, TCP_CHANNELS.ACTION_RESULT, {
          type: 'action_result',
          ok: true,
        });
      }

      if (action.type === 'call_uno') {
        this.broadcast(TCP_CHANNELS.UNO_CALLED, {
          type: 'uno_called',
          playerId,
        });
      }

      if (nextState.phase === 'finished' && nextState.winnerId) {
        this.clearTimers();
        const scores = this.controller.computeScores();
        const winnerId = nextState.winnerId;
        const durationSec = Math.max(1, Math.round((Date.now() - this.startedAtMs) / 1000));
        const participantsPayload = [...nextState.players.values()].map((p) => {
          const c = this.playerCounters.get(p.id);
          return {
            id: p.id,
            username: p.username,
            isBot: p.isBot,
            score: scores[p.id] ?? 0,
            cardsPlayed: c?.cardsPlayed ?? 0,
            unoCalls: c?.unoCalls ?? 0,
            drawStacks: c?.drawStacks ?? 0,
          };
        });

        void settleFinishedMatchWithReceipts({
          matchId: this.roomId,
          mode: 'uno',
          variant: this.matchConfig.variant,
          isRanked: this.isRanked,
          winnerId,
          turnCount: this.turnCount,
          durationSec,
          participants: participantsPayload,
          replaySeed: this.initialSeed,
          replayEvents: [...this.replayEvents],
        })
          .then((receipts) => {
            this.broadcast(TCP_CHANNELS.MATCH_ENDED, {
              type: 'match_ended',
              winnerId,
              scores,
              receipts,
            });
          })
          .catch(() => {
            this.broadcast(TCP_CHANNELS.MATCH_ENDED, {
              type: 'match_ended',
              winnerId,
              scores,
            });
          });

        this.logInfo('UNO match finished', { winnerId });
        return;
      }

      this.scheduleNextTurn();
    } catch (err) {
      if (client) {
        this.sendSafe(client, TCP_CHANNELS.ACTION_RESULT, {
          type: 'action_result',
          ok: false,
          reason: err instanceof Error ? err.message : 'Mossa non valida',
        });
      }
    }
  }

  private scheduleNextTurn(): void {
    this.clearTimers();

    const engine = this.controller.state;
    if (!engine || engine.phase !== 'playing') return;

    const currentId = this.controller.getCurrentPlayerId();
    if (!currentId) return;

    const currentPlayer = engine.players.get(currentId);
    if (!currentPlayer) return;

    if (currentPlayer.isBot) {
      const delayMs = getThinkDelayMs(this.botDifficulty);
      this.botTimer = this.clock.setTimeout(() => {
        const latest = this.controller.state;
        if (!latest || latest.phase !== 'playing') return;
        if (!featureFlags.ENABLE_GEMINI_BOTS) {
          const action = decideAction(latest, currentId);
          this.executeAction(currentId, action);
          return;
        }
        const mmrMap = { easy: 400, normal: 850, hard: 1200, ultra: 1650 } as const;
        void adviseBotMove(latest, currentId, { botMMR: mmrMap[this.botDifficulty] }).then(
          ({ action }) => {
            const current = this.controller.state;
            if (!current || current.phase !== 'playing') return;
            if (this.controller.getCurrentPlayerId() !== currentId) return;
            this.executeAction(currentId, action);
          },
        );
      }, delayMs);
      return;
    }

    // Timeout turno umano → pesca automatica
    const timeoutMs = engine.rules.turnTimeoutSeconds * 1000;
    this.turnTimer = this.clock.setTimeout(() => {
      const latest = this.controller.state;
      if (!latest || latest.phase !== 'playing') return;
      if (this.controller.getCurrentPlayerId() !== currentId) return;
      this.logInfo('Turn timeout: forcing draw_card', { playerId: currentId });
      this.executeAction(currentId, { type: 'draw_card' });
    }, timeoutMs);
  }

  private sendPrivateHand(playerId: string): void {
    const client = this.playerIdToClient.get(playerId);
    if (!client) return;
    const cards = this.controller.getPlayerHand(playerId);
    this.sendSafe(client, TCP_CHANNELS.HAND, {
      type: 'hand',
      cards,
    });
  }

  private sendAllPrivateHands(): void {
    for (const playerId of this.playerIdToClient.keys()) {
      this.sendPrivateHand(playerId);
    }
  }

  private clearTimers(): void {
    if (this.botTimer) {
      this.botTimer.clear();
      this.botTimer = null;
    }
    if (this.turnTimer) {
      this.turnTimer.clear();
      this.turnTimer = null;
    }
  }
}
