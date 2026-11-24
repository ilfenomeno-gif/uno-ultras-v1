// ============================================================
// UNO ULTRA Client — UI Button Component
// ============================================================

export function createButton(options: {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  onClick: () => void;
}): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `ultra-btn ultra-btn--${options.variant ?? 'primary'}`;
  btn.textContent = options.label;
  if (options.disabled) btn.disabled = true;
  btn.addEventListener('click', options.onClick);
  return btn;
}
