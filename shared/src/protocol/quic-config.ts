// ============================================================
// UNO ULTRA — Configurazione QUIC / WebTransport
// ============================================================
// Parametri per il canale QUIC usato come trasporto UDP
// ad alta affidabilità. Pensato per il layer voice + telemetria
// con fallback a WebRTC DataChannel nei browser.
// ============================================================

export interface QuicConfig {
  /** Indirizzo di bind del server QUIC (default 0.0.0.0). */
  host: string;
  /** Porta di ascolto QUIC (default 443, multiplexata con HTTPS). */
  port: number;
  /** Timeout di idle prima di chiudere la connessione (ms). */
  maxIdleTimeoutMs: number;
  /** Dimensione massima payload UDP (MTU safe, no fragmentation). */
  maxUdpPayloadSize: number;
  /** Finestra di controllo del flusso iniziale (byte). */
  initialMaxData: number;
  /**
   * Protocolli ALPN negoziati durante il TLS handshake.
   * 'h3' per WebTransport over HTTP/3; 'uno-ultra/1' custom.
   */
  alpn: string[];
}

export const DEFAULT_QUIC_CONFIG: QuicConfig = {
  host: '0.0.0.0',
  port: 443,
  maxIdleTimeoutMs: 30_000,
  maxUdpPayloadSize: 1_350,
  initialMaxData: 1_000_000,
  alpn: ['h3', 'uno-ultra/1'],
};
