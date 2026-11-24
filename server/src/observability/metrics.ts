// ============================================================
// UNO ULTRA Server — Lightweight In-Process Prometheus Metrics
// ============================================================

class MetricsRegistry {
  private readonly counters = new Map<string, number>();
  private readonly gauges = new Map<string, number>();

  inc(name: string, delta = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + delta);
  }

  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  snapshot(): { counters: Record<string, number>; gauges: Record<string, number> } {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
    };
  }

  toPrometheusText(): string {
    const lines: string[] = [];
    for (const [k, v] of this.counters) {
      lines.push(`# TYPE ${k} counter`, `${k} ${v}`);
    }
    for (const [k, v] of this.gauges) {
      lines.push(`# TYPE ${k} gauge`, `${k} ${v}`);
    }
    return lines.join('\n') + '\n';
  }
}

export const metrics = new MetricsRegistry();
