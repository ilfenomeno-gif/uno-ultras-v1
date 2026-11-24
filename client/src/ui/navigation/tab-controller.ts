// ============================================================
// UNO ULTRA Client — Centralized 8-Tab Controller (Instant + Safe)
// ============================================================

import type { AppRoute } from '../../core/router.js';
import type { LauncherConfig } from '../play/launcher.js';
import type { SocialDrawer } from '../play/social-drawer.js';
import { createPlayView } from './tab-play.js';
import { createShopView } from './tab-shop.js';
import { createLockerView } from './tab-locker.js';
import { createBattleCardView } from './tab-battle-card.js';
import { createChallengesView } from './tab-challenges.js';
import { createTournamentsView } from './tab-tournaments.js';
import { createCareerView } from './tab-career.js';
import { createVCardView } from './tab-vcard.js';

function createTabErrorFallback(route: string, err: unknown): HTMLElement {
  const section = document.createElement('section');
  section.className = 'tab-section';

  const box = document.createElement('div');
  box.className = 'tab-placeholder-card glass-panel';

  const heading = document.createElement('h2');
  heading.textContent = `Errore caricamento scheda ${route}`;

  const msg = document.createElement('p');
  msg.textContent =
    err instanceof Error ? err.message : 'Si è verificato un errore imprevisto.';

  const retryBtn = document.createElement('button');
  retryBtn.type = 'button';
  retryBtn.className = 'ultra-btn ultra-btn--primary';
  retryBtn.textContent = 'Ricarica Applicazione';
  retryBtn.addEventListener('click', () => {
    window.location.reload();
  });

  box.append(heading, msg, retryBtn);
  section.appendChild(box);
  return section;
}

export function renderRouteTabView(
  route: Exclude<AppRoute, 'splash' | 'auth' | 'game'>,
  socialDrawer: SocialDrawer,
  onLaunch: (cfg: LauncherConfig) => Promise<void>
): HTMLElement {
  try {
    switch (route) {
      case 'gioca':
        return createPlayView(socialDrawer, onLaunch);
      case 'negozio':
        return createShopView();
      case 'armadietto':
        return createLockerView();
      case 'battle-card':
        return createBattleCardView();
      case 'sfide':
        return createChallengesView();
      case 'tornei':
        return createTournamentsView();
      case 'carriera':
        return createCareerView();
      case 'vcard':
        return createVCardView();
    }
  } catch (err) {
    return createTabErrorFallback(route, err);
  }
}
