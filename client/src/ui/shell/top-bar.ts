// ============================================================
// UNO ULTRA Client — Top Navigation Bar (8 Tabs)
// ============================================================

import type { AppRoute } from '../../core/router.js';
import { playEarcon } from '../../core/audio-earcons.js';
import { computeSafeLoopIndex, hasBlockedModifier } from '../../core/keyboard-nav.js';

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
  { route: 'top100', label: 'Top 100' },
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
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Navigazione principale');

  const tabButtons: HTMLButtonElement[] = [];

  for (const tab of TOP_TABS) {
    const isActive = activeRoute === tab.route;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `top-bar-tab${isActive ? ' active' : ''}`;
    btn.textContent = tab.label;
    btn.dataset['route'] = tab.route;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(isActive));
    btn.tabIndex = isActive ? 0 : -1;
    btn.addEventListener('click', () => callbacks.onSelectTab(tab.route));
    tabButtons.push(btn);
    nav.appendChild(btn);
  }

  nav.addEventListener('keydown', (ev) => {
    if (hasBlockedModifier(ev)) return;
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    ev.preventDefault();
    const curIdx =
      document.activeElement instanceof HTMLButtonElement
        ? tabButtons.indexOf(document.activeElement)
        : TOP_TABS.findIndex((t) => t.route === activeRoute);
    const delta = ev.key === 'ArrowRight' ? 1 : -1;
    const { index, wrapped } = computeSafeLoopIndex(curIdx, delta, tabButtons.length);
    const nextBtn = tabButtons[index];
    if (nextBtn) {
      nextBtn.focus();
      playEarcon(wrapped ? 'boundary' : 'nav');
    }
  });

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
