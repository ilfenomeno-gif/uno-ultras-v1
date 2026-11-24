// ============================================================
// UNO ULTRA Client — UI Badge Component
// ============================================================

export function createBadge(text: string, tone: 'info' | 'gold' | 'mythic' | 'success' = 'info'): HTMLElement {
  const el = document.createElement('span');
  el.className = `ultra-badge ultra-badge--${tone}`;
  el.textContent = text;
  return el;
}
