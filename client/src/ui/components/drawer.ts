// ============================================================
// UNO ULTRA Client — Reusable Side Drawer Component
// ============================================================

export function createDrawer(title: string): {
  element: HTMLElement;
  body: HTMLElement;
  open: () => void;
  close: () => void;
} {
  const element = document.createElement('aside');
  element.className = 'ultra-drawer glass-panel';
  element.style.display = 'none';

  const header = document.createElement('div');
  header.className = 'ultra-drawer-header';
  const h3 = document.createElement('h3');
  h3.textContent = title;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '✕';
  const close = (): void => {
    element.style.display = 'none';
  };
  closeBtn.addEventListener('click', close);
  header.append(h3, closeBtn);

  const body = document.createElement('div');
  body.className = 'ultra-drawer-body';
  element.append(header, body);

  return {
    element,
    body,
    open: () => {
      element.style.display = 'flex';
    },
    close,
  };
}
