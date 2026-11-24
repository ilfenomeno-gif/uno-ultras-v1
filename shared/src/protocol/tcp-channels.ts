// ============================================================
// UNO ULTRA — Canali TCP (WebSocket / Colyseus room.send)
// ============================================================
// Stringhe usate come "type" per tutti i messaggi TCP.
// Centralizzate qui per evitare magic-string sparse nel codice.
// ============================================================

export const TCP_CHANNELS = {
  // Client → Server
  PLAY_CARD: 'play_card',
  DRAW_CARD: 'draw_card',
  CALL_UNO: 'call_uno',
  CHALLENGE_WILD4: 'challenge_wild4',
  LEAVE_MATCH: 'leave_match',
  CHAT: 'chat',
  PING: 'ping',

  // Server → Client
  HAND: 'hand',
  ACTION_RESULT: 'action_result',
  UNO_CALLED: 'uno_called',
  CHALLENGE_RESULT: 'challenge_result',
  MATCH_ENDED: 'match_ended',
  PLAYER_DISCONNECTED: 'player_disconnected',
  BOT_REPLACED: 'bot_replaced',
  PONG: 'pong',
  PRESENCE_UPDATE: 'presence_update',
  PRESENCE_SNAPSHOT: 'presence_snapshot',
} as const;

export type TcpChannel = (typeof TCP_CHANNELS)[keyof typeof TCP_CHANNELS];
