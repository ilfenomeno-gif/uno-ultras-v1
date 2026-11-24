// ============================================================
// UNO ULTRA Client — Accessible Modal Dialog (ASTRALIS v3)
// Modal Anechoic Chamber + Focus Trap + Purge-on-Close
// ============================================================

import { announce, purgeOnClose } from '../../core/aria-live.js';
import { playEarcon } from '../../core/audio-earcons.js';

export interface ModalHandle {
  readonly backdrop: HTMLElement;
  close(): void;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('hidden') && el.offsetParent !== null
  );
}

export function openModal(options: {
  title: string;
  body: HTMLElement | string;
  onClose?: () => void;
}): ModalHandle {
  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const backdrop = document.createElement('div');
  backdrop.className = 'ultra-modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-label', options.title);

  const dialog = document.createElement('div');
  dialog.className = 'ultra-modal glass-panel';

  const header = document.createElement('div');
  header.className = 'ultra-modal-header';
  const heading = document.createElement('h2');
  heading.textContent = options.title;
  heading.tabIndex = -1;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'ultra-modal-close';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Chiudi finestra');
  header.append(heading, closeBtn);

  const content = document.createElement('div');
  content.className = 'ultra-modal-body';
  if (typeof options.body === 'string') {
    content.innerHTML = options.body;
  } else {
    content.appendChild(options.body);
  }

  dialog.append(header, content);
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);

  let closed = false;

  const close = (): void => {
    if (closed) return;
    closed = true;
    window.removeEventListener('keydown', onKeyDown, true);
    backdrop.remove();
    purgeOnClose();
    playEarcon('modal_close');
    if (previousFocus && previousFocus.isConnected) {
      previousFocus.focus();
    }
    options.onClose?.();
  };

  const onKeyDown = (ev: KeyboardEvent): void => {
    if (ev.key === 'Escape') {
      ev.stopPropagation();
      close();
      return;
    }
    if (ev.key === 'Tab') {
      const focusables = getFocusableElements(dialog);
      if (focusables.length === 0) {
        ev.preventDefault();
        heading.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (ev.shiftKey && (document.activeElement === first || document.activeElement === heading)) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    }
  };

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) close();
  });
  window.addEventListener('keydown', onKeyDown, true);

  heading.focus();
  playEarcon('modal_open');
  announce(`Finestra aperta: ${options.title}`, 'polite');

  return { backdrop, close };
}
