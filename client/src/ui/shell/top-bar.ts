// ============================================================
// UNO ULTRA Client — Top Navigation Bar (8 Tabs)
// ============================================================

import type { AppRoute } from '../../core/router.js';

export interface TopTabItem {
  route: Exclude<AppRoute, 'splash' | 'auth' | 'game'>;
  label: string;
}

export const TOP_TABS: readonly TopTabItem[] = [
  { route: 'gioca', label: 'Gioca' },
  { route: 'negozio', label: 'Negozio' },
  { route: 'armadietto', label: 'Armadietto' },
  { route: 'battle-card', label: 'Battle Card' },
  { route: 'sfide', label: 'Sfide' },
  { route: 'tornei', label: 'Tornei' },
  { route: 'carriera', label: 'Carriera' },
  { route: 'vcard', label: 'V-Card' },
];

export interface TopBarCallbacks {
  onSelectTab: (route: Exclude<AppRoute, 'splash' | 'auth' | 'game'>) => void;
  onToggleSocial: () => void;
  onOpenSettings?: () => void;
  username?: string;
  onLogout?: () => void;
}

export function createTopBar(
  activeRoute: AppRoute,
  callbacks: TopBarCallbacks
): HTMLElement {
  const header = document.createElement('header');
  header.className = 'top-bar';

  const logo = document.createElement('div');
  logo.className = 'top-bar-logo';
  logo.innerHTML = 'UNO <span>ULTRA</span>';

  const nav = document.createElement('nav');
  nav.className = 'top-bar-tabs';
  nav.setAttribute('aria-label', 'Navigazione principale');

  for (const tab of TOP_TABS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `top-bar-tab${activeRoute === tab.route ? ' active' : ''}`;
    btn.textContent = tab.label;
    btn.dataset['route'] = tab.route;
    btn.addEventListener('click', () => callbacks.onSelectTab(tab.route));
    nav.appendChild(btn);
  }

  const actions = document.createElement('div');
  actions.className = 'top-bar-actions';

  if (callbacks.username) {
    const userBadge = document.createElement('span');
    userBadge.className = 'top-bar-user';
    userBadge.textContent = callbacks.username;
    actions.appendChild(userBadge);
  }

  const socialBtn = document.createElement('button');
  socialBtn.type = 'button';
  socialBtn.className = 'top-bar-social-btn';
  socialBtn.textContent = 'SOCIAL';
  socialBtn.addEventListener('click', callbacks.onToggleSocial);
  actions.appendChild(socialBtn);

  if (callbacks.onOpenSettings) {
    const onOpenSettings = callbacks.onOpenSettings;
    const settingsBtn = document.createElement('button');
    settingsBtn.type = 'button';
    settingsBtn.className = 'top-bar-social-btn';
    settingsBtn.textContent = '⚙';
    settingsBtn.setAttribute('aria-label', 'Impostazioni');
    settingsBtn.addEventListener('click', onOpenSettings);
    actions.appendChild(settingsBtn);
  }

  if (callbacks.onLogout) {
    const onLogout = callbacks.onLogout;
    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'top-bar-logout-btn';
    logoutBtn.textContent = 'ESCI';
    logoutBtn.addEventListener('click', onLogout);
    actions.appendChild(logoutBtn);
  }

  header.append(logo, nav, actions);
  return header;
}
