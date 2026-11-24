// ============================================================
// UNO ULTRA Client — Accessible Toggle Switch Component
// ============================================================

export function createToggle(options: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}): HTMLElement {
  let state = options.checked;
  const row = document.createElement('div');
  row.className = 'ultra-toggle-row';

  const lbl = document.createElement('span');
  lbl.textContent = options.label;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('role', 'switch');

  const sync = (): void => {
    btn.className = `ultra-toggle-btn${state ? ' active' : ''}`;
    btn.setAttribute('aria-checked', String(state));
    btn.textContent = state ? 'ON' : 'OFF';
  };
  sync();

  btn.addEventListener('click', () => {
    state = !state;
    sync();
    options.onChange(state);
  });

  row.append(lbl, btn);
  return row;
}
