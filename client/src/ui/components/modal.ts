// ============================================================
// UNO ULTRA Client — Accessible Modal Dialog (WCAG + ESC close)
// ============================================================

export interface ModalHandle {
  readonly backdrop: HTMLElement;
  close(): void;
}

export function openModal(options: {
  title: string;
  body: HTMLElement | string;
  onClose?: () => void;
}): ModalHandle {
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

  const close = (): void => {
    window.removeEventListener('keydown', onKeyDown);
    backdrop.remove();
    options.onClose?.();
  };

  const onKeyDown = (ev: KeyboardEvent): void => {
    if (ev.key === 'Escape') {
      ev.stopPropagation();
      close();
    }
  };

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) close();
  });
  window.addEventListener('keydown', onKeyDown, true);

  return { backdrop, close };
}
