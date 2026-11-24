// ============================================================
// UNO ULTRA Server — WebRTC Offer / Answer / ICE Signaling Broker
// ============================================================

export interface SignalEnvelope {
  readonly roomId: string;
  readonly fromPlayerId: string;
  readonly toPlayerId: string;
  readonly kind: 'offer' | 'answer' | 'ice-candidate';
  readonly payload: unknown;
  readonly createdAtMs: number;
}

export class WebRtcSignalingBroker {
  private readonly queues = new Map<string, SignalEnvelope[]>();
  private static readonly MAX_QUEUES = 500;
  private static readonly TTL_MS = 60_000;

  enqueueSignal(signal: Omit<SignalEnvelope, 'createdAtMs'>): SignalEnvelope {
    const now = Date.now();
    if (this.queues.size >= WebRtcSignalingBroker.MAX_QUEUES) {
      for (const [k, q] of this.queues) {
        const last = q[q.length - 1];
        if (!last || now - last.createdAtMs > WebRtcSignalingBroker.TTL_MS) {
          this.queues.delete(k);
        }
      }
      if (this.queues.size >= WebRtcSignalingBroker.MAX_QUEUES) {
        const oldest = this.queues.keys().next().value;
        if (oldest) this.queues.delete(oldest);
      }
    }
    const envelope: SignalEnvelope = { ...signal, createdAtMs: now };
    const key = `${signal.roomId}:${signal.toPlayerId}`;
    const list = (this.queues.get(key) ?? []).filter(
      (item) => now - item.createdAtMs <= WebRtcSignalingBroker.TTL_MS,
    );
    list.push(envelope);
    if (list.length > 50) list.shift();
    this.queues.set(key, list);
    return envelope;
  }

  drainSignals(roomId: string, playerId: string): SignalEnvelope[] {
    const key = `${roomId}:${playerId}`;
    const items = this.queues.get(key) ?? [];
    this.queues.delete(key);
    return items;
  }
}

export const webrtcSignaling = new WebRtcSignalingBroker();
