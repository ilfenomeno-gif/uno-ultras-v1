// ============================================================
// UNO ULTRA — Canali UDP (WebRTC DataChannel / QUIC)
// ============================================================
// I canali UDP hanno ID numerico a 1 byte per massimizzare
// il throughput e minimizzare l'overhead nel payload.
// Usati per dati tolleranti alla perdita (telemetria, voice).
// ============================================================

export const UDP_CHANNELS = {
  /** Telemetria in-game: latenza, FPS, eventi di animazione. */
  TELEMETRY: 1,
  /** Relay voice-chat (PCM float32 compresso con Opus). */
  VOICE_RELAY: 2,
  /** Ping/pong RTT tra client e server. */
  PING: 3,
} as const;

export type UdpChannel = (typeof UDP_CHANNELS)[keyof typeof UDP_CHANNELS];

// ── Strutture pacchetti UDP ───────────────────────────────────

/** Pacchetto ping UDP inviato dal client. */
export interface UdpPingPacket {
  channel: typeof UDP_CHANNELS.PING;
  /** Timestamp in millisecondi (performance.now() lato client). */
  clientTs: number;
}

/** Pacchetto pong UDP inviato dal server in risposta al ping. */
export interface UdpPongPacket {
  channel: typeof UDP_CHANNELS.PING;
  /** Timestamp originale del client, echeggiato per il calcolo RTT. */
  clientTs: number;
  /** Timestamp del server al momento della risposta. */
  serverTs: number;
}

/** Pacchetto di telemetria in-game (direzione client → server). */
export interface UdpTelemetryPacket {
  channel: typeof UDP_CHANNELS.TELEMETRY;
  /** ID sessione di gioco (corrisponde all'ID della Colyseus room). */
  roomId: string;
  /** FPS correnti del client. */
  fps: number;
  /** RTT stimato in millisecondi (calcolato dal client). */
  rttMs: number;
  /** Numero di pacchetti persi nell'ultimo secondo. */
  packetLoss: number;
}
