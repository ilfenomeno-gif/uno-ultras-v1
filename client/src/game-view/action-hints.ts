// ============================================================
// UNO ULTRA Client — Action Hints & Controls
// ============================================================

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
  },
  cb: ActionHintsCallbacks
): void {
  container.innerHTML = '';

  if (ctx.pendingDraw > 0) {
    const badge = document.createElement('div');
    badge.className = 'hint hint--danger';
    badge.textContent = `+${ctx.pendingDraw} in arrivo`;
    container.appendChild(badge);
  }

  const drawBtn = document.createElement('button');
  drawBtn.type = 'button';
  drawBtn.className = 'hint-btn';
  drawBtn.textContent = ctx.pendingDraw > 0 ? `PESCA +${ctx.pendingDraw}` : 'PESCA';
  drawBtn.disabled = !ctx.canDraw;
  drawBtn.addEventListener('click', cb.onDraw);
  container.appendChild(drawBtn);

  const unoBtn = document.createElement('button');
  unoBtn.type = 'button';
  unoBtn.className = 'hint-btn hint-btn--accent';
  unoBtn.textContent = 'UNO!';
  unoBtn.disabled = !ctx.canCallUno;
  unoBtn.addEventListener('click', cb.onCallUno);
  container.appendChild(unoBtn);

  if (ctx.canChallenge) {
    const chBtn = document.createElement('button');
    chBtn.type = 'button';
    chBtn.className = 'hint-btn hint-btn--warn';
    chBtn.textContent = 'SFIDA +4';
    chBtn.addEventListener('click', cb.onChallengeWild4);
    container.appendChild(chBtn);
  }
}
