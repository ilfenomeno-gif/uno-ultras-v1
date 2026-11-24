// ============================================================
// UNO ULTRA Client — Reactive Store & App Lifecycle Helpers
// ============================================================

export class ReactiveStore<T> {
  private readonly listeners = new Set<(value: T) => void>();

  constructor(private value: T) {}

  get(): T {
    return this.value;
  }

  set(next: T): void {
    this.value = next;
    for (const l of this.listeners) l(next);
  }

  subscribe(fn: (value: T) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
