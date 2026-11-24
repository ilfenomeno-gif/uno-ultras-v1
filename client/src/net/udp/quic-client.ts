// ============================================================
// UNO ULTRA Client — Optional WebTransport / QUIC Datagram Wrapper
// ============================================================

export class QuicClient {
  isSupported(): boolean {
    return typeof (globalThis as Record<string, unknown>)['WebTransport'] === 'function';
  }
}
