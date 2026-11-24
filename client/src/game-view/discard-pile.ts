// ============================================================
// UNO ULTRA Client — Discard Pile & Active Color Indicator
// ============================================================

import type { UnoCard } from '@uno/shared';
import { formatCardSymbol, formatColorLabel } from './card-format.js';

export function renderDiscardPile(
  container: HTMLElement,
  top: UnoCard | null,
  activeColor: string,
  direction: number
): void {
  container.innerHTML = '';

  const pileWrap = document.createElement('div');
  pileWrap.className = 'discard-pile-wrap';

  if (!top) {
    const empty = document.createElement('div');
    empty.className = 'uno-card uno-card--pile uno-card--empty';
    empty.textContent = '—';
    pileWrap.appendChild(empty);
  } else {
    const symbol = formatCardSymbol(top);
    const el = document.createElement('div');
    el.className = 'uno-card uno-card--pile';
    el.dataset['color'] = top.color;
    el.dataset['kind'] = top.kind;
    el.innerHTML = `
      <span class="uno-card__corner">${symbol}</span>
      <span class="uno-card__center">${symbol}</span>
      <span class="uno-card__corner uno-card__corner--br">${symbol}</span>
    `;
    pileWrap.appendChild(el);
  }

  const meta = document.createElement('div');
  meta.className = 'discard-meta';

  const colorBadge = document.createElement('div');
  colorBadge.className = 'active-color-pill';
  colorBadge.innerHTML = `
    <span class="active-color-dot" data-color="${activeColor || 'wild'}"></span>
    <span>${formatColorLabel(activeColor)}</span>
  `;

  const dirBadge = document.createElement('div');
  dirBadge.className = 'direction-pill';
  dirBadge.textContent = direction >= 0 ? '↻ Orario' : '↺ Antiorario';

  meta.append(colorBadge, dirBadge);
  container.append(pileWrap, meta);
}
