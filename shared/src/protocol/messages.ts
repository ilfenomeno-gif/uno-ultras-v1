// ============================================================
// UNO ULTRA — Contratti messaggi TCP (WebSocket/Colyseus)
// ============================================================
// ClientToServerMessage : tutto ciò che il client può inviare
// ServerToClientMessage : tutto ciò che il server può inviare
// ============================================================

import type { UnoCard } from '../types/card.js';
import type { UnoColor } from '../constants/cards.js';

// ── Client → Server ──────────────────────────────────────────

/** Il client gioca una carta dalla propria mano. */
export interface PlayCardMessage {
  type: 'play_card';
  cardId: string;
  /** Colore dichiarato, obbligatorio solo per carte wild. */
  chosenColor?: UnoColor;
}

/** Il client pesca una carta dal mazzo. */
export interface DrawCardMessage {
  type: 'draw_card';
}

/** Il client dichiara "UNO!" (singola carta rimasta). */
export interface CallUnoMessage {
  type: 'call_uno';
}

/** Il client sfida un wild_draw4 appena giocato. */
export interface ChallengeWild4Message {
  type: 'challenge_wild4';
}

/** Il client richiede di lasciare la partita. */
export interface LeaveMatchMessage {
  type: 'leave_match';
}

/** Il client invia un messaggio di chat in partita. */
export interface ChatMessage {
  type: 'chat';
  text: string;
}

/** Ping heartbeat lato client (mantenimento connessione). */
export interface ClientPingMessage {
  type: 'ping';
  ts: number;
}

export type ClientToServerMessage =
  | PlayCardMessage
  | DrawCardMessage
  | CallUnoMessage
  | ChallengeWild4Message
  | LeaveMatchMessage
  | ChatMessage
  | ClientPingMessage;

// ── Server → Client ──────────────────────────────────────────

/** Il server invia la mano privata al solo destinatario. */
export interface HandUpdateMessage {
  type: 'hand';
  cards: UnoCard[];
}

/** Il server conferma o rigetta l'azione appena eseguita. */
export interface ActionResultMessage {
  type: 'action_result';
  ok: boolean;
  reason?: string;
}

/** Il server avvisa che un giocatore ha chiamato UNO. */
export interface UnoCalledMessage {
  type: 'uno_called';
  playerId: string;
}

/** Il server avvisa del risultato di una sfida wild4. */
export interface ChallengeResultMessage {
  type: 'challenge_result';
  valid: boolean;
  challengerId: string;
  targetId: string;
}

/** Il server annuncia la fine della partita. */
export interface MatchEndedMessage {
  type: 'match_ended';
  winnerId: string;
  scores: Record<string, number>;
}

/** Il server notifica che un giocatore si è disconnesso. */
export interface PlayerDisconnectedMessage {
  type: 'player_disconnected';
  playerId: string;
  reconnectWindowMs: number;
}

/** Il server notifica che un bot ha sostituito un giocatore DC. */
export interface BotReplacedMessage {
  type: 'bot_replaced';
  playerId: string;
  botProfile: 'AGGR' | 'CONS' | 'STRAT';
}

/** Messaggio di chat ricevuto dal server. */
export interface ServerChatMessage {
  type: 'chat';
  senderId: string;
  text: string;
  ts: number;
}

/** Pong heartbeat lato server. */
export interface ServerPongMessage {
  type: 'pong';
  ts: number;
}

export type ServerToClientMessage =
  | HandUpdateMessage
  | ActionResultMessage
  | UnoCalledMessage
  | ChallengeResultMessage
  | MatchEndedMessage
  | PlayerDisconnectedMessage
  | BotReplacedMessage
  | ServerChatMessage
  | ServerPongMessage;
