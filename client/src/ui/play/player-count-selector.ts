// ============================================================
// UNO ULTRA Client — Player Count Selector (1P..4P)
// ============================================================

import { PLAYER_COUNTS, type PlayerCount } from '@uno/shared';

export function createPlayerCountSelector(
  initial: PlayerCount,
  onChange: (count: PlayerCount) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'launcher-row';
  const buttons: HTMLButtonElement[] = [];

  for (const count of PLAYER_COUNTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `launcher-pill${initial === count ? ' active' : ''}`;
    btn.textContent = `${count}P`;
    btn.addEventListener('click', () => {
      for (const b of buttons) b.classList.remove('active');
      btn.classList.add('active');
      onChange(count);
    });
    buttons.push(btn);
    row.appendChild(btn);
  }
  return row;
}
