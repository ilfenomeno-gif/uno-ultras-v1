// ============================================================
// UNO ULTRA Client — Discard Pile & Active Color Indicator
// ============================================================

import type { UnoCard } from '@uno/shared';
import { getShopItemArtworkSvg } from '../ui/navigation/shop-artworks.js';
import { formatCardSymbol, formatColorLabel } from './card-format.js';

export function renderDiscardPile(
  container: HTMLElement,
  top: UnoCard | null,
  activeColor: string,
  direction: number,
  cardBackId = 'back_default'
): void {
  container.innerHTML = '';

  const pileWrap = document.createElement('div');
  pileWrap.className = 'discard-pile-wrap';

  const drawDeck = document.createElement('div');
  drawDeck.className = 'uno-deck-card';
  drawDeck.dataset['cardBack'] = cardBackId || 'back_default';
  drawDeck.innerHTML = `
    <div class="uno-deck-card__art">${getShopItemArtworkSvg(cardBackId || 'back_default', 'card_back')}</div>
    <span class="uno-deck-card__label">MAZZO</span>
  `;
  pileWrap.appendChild(drawDeck);

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
