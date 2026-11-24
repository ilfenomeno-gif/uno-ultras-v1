// ============================================================
// UNO ULTRA Client — Auto-scrolling News Ticker (ESC to close)
// ============================================================

import { openModal } from '../components/modal.js';

const DEFAULT_NEWS = [
  'STAGIONE 1 ATTIVA — Scala la classifica fino a Supersonic Legend (1600+ MMR)!',
  'TORNEO UCS WEEKEND — Iscrizioni aperte nella scheda Tornei.',
  'BATTLE CARD LV. 1–100 — Sblocca dorsi neon e animazioni 3D esclusive.',
];

export class NewsTicker {
  readonly element: HTMLElement;
  private readonly track: HTMLElement;
  private index = 0;
  private timerId: number | null = null;
  private visible = true;

  constructor(private readonly items: readonly string[] = DEFAULT_NEWS) {
    this.element = document.createElement('div');
    this.element.className = 'news-ticker';

    this.track = document.createElement('div');
    this.track.className = 'news-ticker-track';
    this.track.textContent = this.items[0] ?? '';
    this.track.style.cursor = 'pointer';
    this.track.title = 'Clicca per leggere le notizie complete';
    this.track.addEventListener('click', () => {
      const list = document.createElement('ul');
      list.className = 'news-modal-list';
      for (const headline of this.items) {
        const li = document.createElement('li');
        li.textContent = headline;
        list.appendChild(li);
      }
      openModal({ title: 'Bollettino UNO ULTRA', body: list });
    });

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'news-ticker-close';
    closeBtn.textContent = 'ESC ✕';
    closeBtn.addEventListener('click', () => this.hide());

    this.element.append(this.track, closeBtn);
    this.startRotation();
  }

  isVisible(): boolean {
    return this.visible;
  }

  hide(): void {
    this.visible = false;
    this.element.classList.add('hidden');
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private startRotation(): void {
    if (this.items.length <= 1) return;
    this.timerId = window.setInterval(() => {
      this.index = (this.index + 1) % this.items.length;
      this.track.textContent = this.items[this.index] ?? '';
    }, 5500);
  }
}
