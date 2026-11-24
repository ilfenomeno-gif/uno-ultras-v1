// ============================================================
// UNO ULTRA — Codec TCP/UDP
// ============================================================
// Funzioni di serializzazione/deserializzazione usate sia
// dal server Node.js che dal client browser (bundle Vite).
// Due formati:
//   • JSON  — leggibile, usato su WebSocket/TCP (Colyseus room.send)
//   • Binary — MessagePack-like compatto, usato su UDP/QUIC
// ============================================================

// ── JSON Codec ───────────────────────────────────────────────

/**
 * Serializza un oggetto in stringa JSON.
 * Wrappa JSON.stringify con gestione errore uniforme.
 */
export function encodeJson(payload: unknown): string {
  try {
    return JSON.stringify(payload);
  } catch (err) {
    throw new Error(
      `[codec] encodeJson fallito: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Deserializza una stringa JSON verso il tipo T.
 * Non valida lo schema: usare Zod dopo la chiamata.
 */
export function decodeJson<T = unknown>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(
      `[codec] decodeJson fallito: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ── Binary Codec (MessagePack-lite) ──────────────────────────
// Formato minimale per pacchetti UDP:
//   byte 0    = channel ID (1 byte)
//   byte 1..N = JSON serializzato del payload (UTF-8)
// Questo approccio tiene i payload piccoli senza introdurre
// una dipendenza msgpack completa nel bundle condiviso.

/**
 * Codifica un pacchetto UDP: [channelId (1 byte) | payload JSON (UTF-8)].
 */
export function encodeBinary(channelId: number, payload: unknown): Uint8Array {
  const json = encodeJson(payload);
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(json);
  const buffer = new Uint8Array(1 + jsonBytes.byteLength);
  buffer[0] = channelId & 0xff;
  buffer.set(jsonBytes, 1);
  return buffer;
}

/**
 * Decodifica un pacchetto UDP: restituisce {channel, payload}.
 * Non valida lo schema del payload: usare type-guard dopo.
 */
export function decodeBinary<T = unknown>(
  raw: Uint8Array | ArrayBuffer
): { channel: number; payload: T } {
  const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  if (bytes.byteLength < 2) {
    throw new Error('[codec] decodeBinary: pacchetto troppo corto (< 2 byte)');
  }
  const channel = bytes[0]!;
  const decoder = new TextDecoder();
  const json = decoder.decode(bytes.subarray(1));
  return { channel, payload: decodeJson<T>(json) };
}
