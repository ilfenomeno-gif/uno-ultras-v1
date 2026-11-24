// ============================================================
// UNO ULTRA Client — Hash-based SPA Router
// ============================================================

export const APP_ROUTES = [
  'splash',
  'auth',
  'gioca',
  'negozio',
  'armadietto',
  'battle-card',
  'sfide',
  'tornei',
  'carriera',
  'vcard',
  'game',
] as const;

export type AppRoute = (typeof APP_ROUTES)[number];

type RouteListener = (route: AppRoute) => void;

function parseHash(hash: string): AppRoute {
  const cleaned = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if ((APP_ROUTES as readonly string[]).includes(cleaned)) {
    return cleaned as AppRoute;
  }
  return 'splash';
}

export class Router {
  private current: AppRoute = parseHash(window.location.hash);
  private readonly listeners = new Set<RouteListener>();

  constructor() {
    window.addEventListener('hashchange', () => {
      const next = parseHash(window.location.hash);
      if (next !== this.current) {
        this.current = next;
        this.emit();
      }
    });
  }

  getRoute(): AppRoute {
    return this.current;
  }

  navigate(route: AppRoute): void {
    if (this.current === route && window.location.hash === `#${route}`) {
      return;
    }
    this.current = route;
    window.location.hash = `#${route}`;
    this.emit();
  }

  subscribe(listener: RouteListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.current);
    }
  }
}
