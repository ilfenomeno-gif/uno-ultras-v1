// ============================================================
// UNO ULTRA Server — Lightweight UDP Voice Packet Relay
// ============================================================

import { EventEmitter } from 'node:events';
import { metrics } from '../../observability/metrics.js';

export interface VoiceFrame {
  readonly roomId: string;
  readonly senderId: string;
  readonly sequence: number;
  readonly muted: boolean;
  readonly pcmOrOpusChunk: Uint8Array;
}

export class VoiceRelay extends EventEmitter {
  private readonly mutedPlayers = new Set<string>();

  setMuted(playerId: string, muted: boolean): void {
    if (muted) this.mutedPlayers.add(playerId);
    else this.mutedPlayers.delete(playerId);
  }

  relayFrame(frame: VoiceFrame): boolean {
    if (frame.muted || this.mutedPlayers.has(frame.senderId)) {
      return false;
    }
    metrics.inc('voice_frames_relayed_total');
    this.emit(`room:${frame.roomId}`, frame);
    return true;
  }
}

export const voiceRelay = new VoiceRelay();
