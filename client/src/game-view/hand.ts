// ============================================================
// UNO ULTRA Client — Player Hand Renderer
// ============================================================

import {
  canPlay,
  DEFAULT_UNO_RULES,
  type UnoCard,
  type UnoColor,
} from '@uno/shared';
import { formatCardSymbol } from './card-format.js';

export interface HandRenderContext {
  activeColor: UnoColor | null;
  discardTop: UnoCard | null;
  pendingDraw: number;
  enabled: boolean;
}

export function renderHand(
  container: HTMLElement,
  hand: readonly UnoCard[],
  ctx: HandRenderContext,
  onPlay: (card: UnoCard) => void
): void {
  container.innerHTML = '';

  hand.forEach((card, idx) => {
    const symbol = formatCardSymbol(card);
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'uno-card';
    el.dataset['color'] = card.color;
    el.dataset['kind'] = card.kind;
    el.style.setProperty('--stack-index', String(idx));
    el.innerHTML = `
      <span class="uno-card__corner">${symbol}</span>
      <span class="uno-card__center">${symbol}</span>
      <span class="uno-card__corner uno-card__corner--br">${symbol}</span>
    `;

    const playable = canPlay(
      card,
      ctx.discardTop,
      ctx.activeColor,
      hand,
      ctx.pendingDraw,
      DEFAULT_UNO_RULES
    );

    if (!playable || !ctx.enabled) {
      el.disabled = true;
    }

    el.addEventListener('click', () => {
      if (el.disabled) return;
      onPlay(card);
    });

    container.appendChild(el);
  });

  if (hand.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'hand-empty';
    empty.textContent = 'Mano vuota';
    container.appendChild(empty);
  }
}
