// ============================================================
// UNO ULTRA Client — UI Panel Card Component
// ============================================================

export function createCardPanel(title: string, subtitle?: string): {
  root: HTMLElement;
  body: HTMLElement;
  footer: HTMLElement;
} {
  const root = document.createElement('article');
  root.className = 'ultra-card glass-panel';

  const header = document.createElement('div');
  header.className = 'ultra-card-header';
  const h3 = document.createElement('h3');
  h3.textContent = title;
  header.appendChild(h3);

  if (subtitle) {
    const sub = document.createElement('p');
    sub.className = 'ultra-card-sub';
    sub.textContent = subtitle;
    header.appendChild(sub);
  }

  const body = document.createElement('div');
  body.className = 'ultra-card-body';

  const footer = document.createElement('div');
  footer.className = 'ultra-card-footer';

  root.append(header, body, footer);
  return { root, body, footer };
}
