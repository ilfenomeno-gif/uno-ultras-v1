// ============================================================
// UNO ULTRA Server — Reusable Authoritative Turn/Countdown Timer
// ============================================================

export class MatchTimer {
  private handle: ReturnType<typeof setTimeout> | null = null;
  private deadlineMs = 0;

  start(durationMs: number, onExpire: () => void): void {
    this.cancel();
    if (durationMs <= 0) return;
    this.deadlineMs = Date.now() + durationMs;
    this.handle = setTimeout(() => {
      this.handle = null;
      this.deadlineMs = 0;
      onExpire();
    }, durationMs);
  }

  remainingMs(): number {
    if (!this.handle || this.deadlineMs === 0) return 0;
    return Math.max(0, this.deadlineMs - Date.now());
  }

  cancel(): void {
    if (this.handle) {
      clearTimeout(this.handle);
      this.handle = null;
    }
    this.deadlineMs = 0;
  }
}
