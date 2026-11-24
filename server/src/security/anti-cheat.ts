// ============================================================
// UNO ULTRA Server — Room anti-cheat & action flood throttle
// ============================================================

interface WindowCounter {
  count: number;
  windowStartMs: number;
}

export class RoomActionThrottle {
  private readonly counters = new Map<string, WindowCounter>();

  constructor(
    private readonly maxActions = 10,
    private readonly windowMs = 2000
  ) {}

  allow(playerId: string, nowMs = Date.now()): boolean {
    const entry = this.counters.get(playerId);
    if (!entry || nowMs - entry.windowStartMs >= this.windowMs) {
      this.counters.set(playerId, { count: 1, windowStartMs: nowMs });
      return true;
    }
    if (entry.count >= this.maxActions) {
      return false;
    }
    entry.count += 1;
    return true;
  }

  reset(playerId: string): void {
    this.counters.delete(playerId);
  }
}
