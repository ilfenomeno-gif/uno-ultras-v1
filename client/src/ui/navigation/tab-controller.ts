// ============================================================
// UNO ULTRA Client — Centralized 8-Tab Controller (Lazy Code-Splitting)
// ============================================================

import type { AppRoute } from '../../core/router.js';
import type { LauncherConfig } from '../play/launcher.js';
import type { SocialDrawer } from '../play/social-drawer.js';
import { createPlayView } from './tab-play.js';

export function renderRouteTabView(
  route: Exclude<AppRoute, 'splash' | 'auth' | 'game'>,
  socialDrawer: SocialDrawer,
  onLaunch: (cfg: LauncherConfig) => Promise<void>,
): HTMLElement {
  if (route === 'gioca') {
    return createPlayView(socialDrawer, onLaunch);
  }

  const host = document.createElement('div');
  host.className = 'tab-lazy-host';

  const loadTab = async (): Promise<HTMLElement> => {
    switch (route) {
      case 'negozio': {
        const { createShopView } = await import('./tab-shop.js');
        return createShopView();
      }
      case 'armadietto': {
        const { createLockerView } = await import('./tab-locker.js');
        return createLockerView();
      }
      case 'battle-card': {
        const { createBattleCardView } = await import('./tab-battle-card.js');
        return createBattleCardView();
      }
      case 'sfide': {
        const { createChallengesView } = await import('./tab-challenges.js');
        return createChallengesView();
      }
      case 'tornei': {
        const { createTournamentsView } = await import('./tab-tournaments.js');
        return createTournamentsView();
      }
      case 'carriera': {
        const { createCareerView } = await import('./tab-career.js');
        return createCareerView();
      }
      case 'vcard': {
        const { createVCardView } = await import('./tab-vcard.js');
        return createVCardView();
      }
    }
  };

  void loadTab().then((view) => {
    host.innerHTML = '';
    host.appendChild(view);
  });

  return host;
}
