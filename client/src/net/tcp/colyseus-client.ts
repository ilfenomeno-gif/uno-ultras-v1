// ============================================================
// UNO ULTRA — Colyseus room connection
// ============================================================

import { Client, type Room } from 'colyseus.js';
import {
  TCP_CHANNELS,
  type ActionResultMessage,
  type HandUpdateMessage,
  type MatchAction,
  type MatchEndedMessage,
  type UnoCalledMessage,
  type UnoCard,
  type UnoRoomState,
} from '@uno/shared';

const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ??
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:3000`;

let client: Client | null = null;
let room: Room<UnoRoomState> | null = null;
let latestHand: UnoCard[] | null = null;

function getClient(): Client {
  if (!client) client = new Client(WS_URL);
  return client;
}

export interface JoinOptions {
  token: string;
  mode: string;
  maxPlayers: number;
  ranked: boolean;
  fillWithBots?: boolean;
  variant?: string;
  spectator?: boolean;
}

function formatWsJoinError(err: unknown): Error {
  if (err instanceof Error && err.message && err.message !== '[object Event]') {
    return err;
  }
  return new Error(
    'Connessione al server di gioco non riuscita. Verifica che il server sia attivo e riprova.',
  );
}

export async function joinUnoRoom(opts: JoinOptions): Promise<Room<UnoRoomState>> {
  if (room) await leaveRoom();
  latestHand = null;
  const payload = {
    token: opts.token,
    mode: opts.mode,
    maxPlayers: opts.maxPlayers,
    ranked: opts.ranked,
    ...(opts.fillWithBots !== undefined ? { fillWithBots: opts.fillWithBots } : {}),
    ...(opts.variant !== undefined ? { variant: opts.variant } : {}),
    ...(opts.spectator !== undefined ? { spectator: opts.spectator } : {}),
  };
  try {
    room = await getClient().joinOrCreate<UnoRoomState>('uno', payload);
  } catch (err) {
    throw formatWsJoinError(err);
  }
  room.onMessage<HandUpdateMessage>(TCP_CHANNELS.HAND, (msg) => {
    latestHand = msg.cards;
  });
  return room;
}

export async function joinUnoRoomById(
  roomId: string,
  token: string,
): Promise<Room<UnoRoomState>> {
  if (room) await leaveRoom();
  latestHand = null;
  try {
    room = await getClient().joinById<UnoRoomState>(roomId, { token });
  } catch (err) {
    throw formatWsJoinError(err);
  }
  room.onMessage<HandUpdateMessage>(TCP_CHANNELS.HAND, (msg) => {
    latestHand = msg.cards;
  });
  return room;
}

export async function leaveRoom(): Promise<void> {
  latestHand = null;
  const active = room;
  room = null;
  if (!active) return;
  try {
    await Promise.race([
      active.leave(true),
      new Promise<void>((resolve) => {
        setTimeout(resolve, 1500);
      }),
    ]);
  } catch {
    // Non-fatal if socket already closed
  }
}

export function getRoom(): Room<UnoRoomState> | null {
  return room;
}

export function startMatch(): void {
  if (!room) throw new Error('Not connected to a room');
  room.send('start_match');
}

export function sendAction(action: MatchAction): void {
  if (!room) throw new Error('Not connected to a room');
  room.send(action.type, action);
}

export function callUno(): void {
  sendAction({ type: 'call_uno' });
}

export function challengeWild4(): void {
  sendAction({ type: 'challenge_wild4' });
}

/** Registra un handler per la mano privata inviata dal server. */
export function onHand(cb: (cards: UnoCard[]) => void): () => void {
  if (!room) throw new Error('Not connected');
  if (latestHand !== null) {
    cb(latestHand);
  }
  return room.onMessage<HandUpdateMessage>(TCP_CHANNELS.HAND, (msg) => {
    latestHand = msg.cards;
    cb(msg.cards);
  });
}

/** Registra un handler per l'esito delle azioni inviate al server. */
export function onActionResult(cb: (result: ActionResultMessage) => void): () => void {
  if (!room) throw new Error('Not connected');
  return room.onMessage<ActionResultMessage>(TCP_CHANNELS.ACTION_RESULT, cb);
}

/** Registra un handler per le chiamate UNO!. */
export function onUnoCalled(cb: (msg: UnoCalledMessage) => void): () => void {
  if (!room) throw new Error('Not connected');
  return room.onMessage<UnoCalledMessage>(TCP_CHANNELS.UNO_CALLED, cb);
}

/** Registra un handler per la fine della partita. */
export function onMatchEnded(cb: (msg: MatchEndedMessage) => void): () => void {
  if (!room) throw new Error('Not connected');
  return room.onMessage<MatchEndedMessage>(TCP_CHANNELS.MATCH_ENDED, cb);
}
