// ============================================================
// UNO ULTRA Client — Action Hints & Controls (Zero Focus Drop)
// ============================================================

import { announce } from '../core/aria-live.js';
import { playEarcon } from '../core/audio-earcons.js';

export interface ActionHintsCallbacks {
  onDraw: () => void;
  onCallUno: () => void;
  onChallengeWild4: () => void;
}

export function renderActionHints(
  container: HTMLElement,
  ctx: {
    canDraw: boolean;
    canCallUno: boolean;
    canChallenge: boolean;
    pendingDraw: number;
    showKeyHints?: boolean;
  },
  cb: ActionHintsCallbacks
): void {
  container.innerHTML = '';
  const showHints = ctx.showKeyHints !== false;

  if (ctx.pendingDraw > 0) {
    const badge = document.createElement('div');
    badge.className = 'hint hint--danger';
    badge.textContent = `+${ctx.pendingDraw} in arrivo`;
    container.appendChild(badge);
  }

  const drawBtn = document.createElement('button');
  drawBtn.type = 'button';
  drawBtn.className = `hint-btn${ctx.canDraw ? '' : ' is-disabled'}`;
  drawBtn.dataset['action'] = 'draw';
  const drawBase = ctx.pendingDraw > 0 ? `PESCA +${ctx.pendingDraw}` : 'PESCA';
  drawBtn.textContent = showHints ? `${drawBase} [P]` : drawBase;
  drawBtn.setAttribute('aria-disabled', String(!ctx.canDraw));
  drawBtn.addEventListener('click', () => {
    if (!ctx.canDraw) {
      playEarcon('error');
      announce('Non puoi pescare adesso', 'assertive');
      return;
    }
    cb.onDraw();
  });
  container.appendChild(drawBtn);

  const unoBtn = document.createElement('button');
  unoBtn.type = 'button';
  unoBtn.className = `hint-btn hint-btn--accent${ctx.canCallUno ? '' : ' is-disabled'}`;
  unoBtn.dataset['action'] = 'call-uno';
  unoBtn.textContent = showHints ? 'UNO! [U]' : 'UNO!';
  unoBtn.setAttribute('aria-disabled', String(!ctx.canCallUno));
  unoBtn.addEventListener('click', () => {
    if (!ctx.canCallUno) {
      playEarcon('error');
      announce('Puoi gridare UNO solo con una carta rimasta', 'assertive');
      return;
    }
    cb.onCallUno();
  });
  container.appendChild(unoBtn);

  if (ctx.canChallenge) {
    const chBtn = document.createElement('button');
    chBtn.type = 'button';
    chBtn.className = 'hint-btn hint-btn--warn';
    chBtn.dataset['action'] = 'challenge-wild4';
    chBtn.textContent = showHints ? 'SFIDA +4 [C]' : 'SFIDA +4';
    chBtn.addEventListener('click', cb.onChallengeWild4);
    container.appendChild(chBtn);
  }
}
