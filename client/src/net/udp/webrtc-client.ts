// ============================================================
// UNO ULTRA Client — WebRTC Unreliable DataChannel & ICE Client
// ============================================================

export interface IceServerEntry {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export class WebRtcUdpClient {
  private pc: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;

  connect(iceServers: IceServerEntry[], onMessage: (raw: Uint8Array) => void): void {
    if (typeof RTCPeerConnection === 'undefined') return;
    this.close();
    this.pc = new RTCPeerConnection({ iceServers });
    this.channel = this.pc.createDataChannel('uno-telemetry', {
      ordered: false,
      maxRetransmits: 0,
    });
    this.channel.binaryType = 'arraybuffer';
    this.channel.onmessage = (ev) => {
      if (ev.data instanceof ArrayBuffer) {
        onMessage(new Uint8Array(ev.data));
      }
    };
  }

  sendPacket(bytes: Uint8Array): boolean {
    if (!this.channel || this.channel.readyState !== 'open') return false;
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    this.channel.send(copy.buffer);
    return true;
  }

  close(): void {
    this.channel?.close();
    this.pc?.close();
    this.channel = null;
    this.pc = null;
  }
}
