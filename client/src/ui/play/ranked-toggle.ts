// ============================================================
// UNO ULTRA Client — Ranked MMR Toggle Component
// ============================================================

export function createRankedToggle(
  initial: boolean,
  onChange: (ranked: boolean) => void,
): HTMLButtonElement {
  let ranked = initial;
  const btn = document.createElement('button');
  btn.type = 'button';

  const sync = (): void => {
    btn.className = `launcher-ranked-btn${ranked ? ' active' : ''}`;
    btn.textContent = ranked ? 'RANKED ON' : 'CASUAL';
  };
  sync();

  btn.addEventListener('click', () => {
    ranked = !ranked;
    sync();
    onChange(ranked);
  });

  return btn;
}
