// ============================================================
// UNO ULTRA Client — Player Hand Renderer (ASTRALIS v3 A11y)
// Zero Focus Drop (aria-disabled) + Auto-Sort + Card Shortcuts
// ============================================================

import {
  canPlay,
  DEFAULT_UNO_RULES,
  type UnoCard,
  type UnoColor,
} from '@uno/shared';
import { announce } from '../core/aria-live.js';
import { playEarcon } from '../core/audio-earcons.js';
import { getCardShortcutLabel, sortUnoHand } from '../core/keyboard-nav.js';
import { formatCardSpeechLabel, formatCardSymbol } from './card-format.js';

export interface HandRenderContext {
  activeColor: UnoColor | null;
  discardTop: UnoCard | null;
  pendingDraw: number;
  enabled: boolean;
  autoSort?: boolean;
  showKeyHints?: boolean;
}

export function renderHand(
  container: HTMLElement,
  hand: readonly UnoCard[],
  ctx: HandRenderContext,
  onPlay: (card: UnoCard) => void
): UnoCard[] {
  container.innerHTML = '';

  const displayed = ctx.autoSort ? sortUnoHand(hand) : [...hand];

  displayed.forEach((card, idx) => {
    const symbol = formatCardSymbol(card);
    const shortcut = getCardShortcutLabel(idx);
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'uno-card';
    el.dataset['color'] = card.color;
    el.dataset['kind'] = card.kind;
    el.dataset['cardId'] = card.id;
    el.style.setProperty('--stack-index', String(idx));

    const playable = canPlay(
      card,
      ctx.discardTop,
      ctx.activeColor,
      displayed,
      ctx.pendingDraw,
      DEFAULT_UNO_RULES
    );
    const isPlayableNow = playable && ctx.enabled;

    el.setAttribute('aria-disabled', String(!isPlayableNow));
    if (!isPlayableNow) {
      el.classList.add('is-disabled');
    }

    const speech = formatCardSpeechLabel(card);
    const shortcutHint = shortcut ? `, tasto ${shortcut}` : '';
    el.setAttribute(
      'aria-label',
      `${speech}${shortcutHint}, ${isPlayableNow ? 'giocabile' : 'non giocabile'}`
    );

    const topCorner = document.createElement('span');
    topCorner.className = 'uno-card__corner';
    topCorner.textContent = symbol;

    const center = document.createElement('span');
    center.className = 'uno-card__center';
    center.textContent = symbol;

    const botCorner = document.createElement('span');
    botCorner.className = 'uno-card__corner uno-card__corner--br';
    botCorner.textContent = symbol;

    el.append(topCorner, center);

    if (shortcut && ctx.showKeyHints !== false) {
      const hotkey = document.createElement('span');
      hotkey.className = 'uno-card__hotkey';
      hotkey.setAttribute('aria-hidden', 'true');
      hotkey.textContent = shortcut;
      el.appendChild(hotkey);
    }

    el.appendChild(botCorner);

    el.addEventListener('click', () => {
      if (!isPlayableNow) {
        playEarcon('error');
        announce(
          !ctx.enabled ? 'Non è il tuo turno' : 'Carta non giocabile',
          'assertive'
        );
        return;
      }
      onPlay(card);
    });

    container.appendChild(el);
  });

  if (displayed.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'hand-empty';
    empty.textContent = 'Mano vuota';
    container.appendChild(empty);
  }

  return displayed;
}
