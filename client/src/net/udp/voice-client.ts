// ============================================================
// UNO ULTRA Client — Voice Chat Mic / Mute Controller
// ============================================================

export class VoiceClient {
  private stream: MediaStream | null = null;
  private muted = true;

  isMuted(): boolean {
    return this.muted;
  }

  async enableMicrophone(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) return false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.setMuted(false);
      return true;
    } catch {
      return false;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.stream) {
      for (const track of this.stream.getAudioTracks()) {
        track.enabled = !muted;
      }
    }
  }

  dispose(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}
