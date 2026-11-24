// ============================================================
// UNO ULTRA Client — Bootstrap & Global Navigation Shell
// ============================================================

import './styles/variables.css';
import './styles/base.css';
import './styles/splash.css';
import './styles/auth.css';
import './styles/lobby.css';
import './styles/social.css';
import './styles/game.css';
import './styles/shop.css';
import './styles/tournaments.css';
import './styles/minigames.css';

import { Router, type AppRoute } from './core/router.js';
import { announce, purgeOnClose } from './core/aria-live.js';
import { playEarcon } from './core/audio-earcons.js';
import { hasBlockedModifier } from './core/keyboard-nav.js';
import { ParticlesCanvas } from './fx/particles-canvas.js';
import { renderSplashScreen } from './ui/shell/splash-screen.js';
import { mountAuthScreen } from './ui/shell/auth-screen.js';
import { createTopBar, type TopBarCallbacks } from './ui/shell/top-bar.js';
import { NewsTicker } from './ui/shell/news-ticker.js';
import { applySettingsToDocument, openSettingsModal } from './ui/shell/settings-modal.js';
import { SocialDrawer } from './ui/play/social-drawer.js';
import type { LauncherConfig } from './ui/play/launcher.js';
import { createPlayView } from './ui/navigation/tab-play.js';
import { renderRouteTabView } from './ui/navigation/tab-controller.js';
import { openMiniGameSandboxModal } from './ui/minigames/sandbox-modal.js';
import { mountGameView } from './game-view/table.js';
import { initClientEnvironment } from './core/bootstrap.js';
import { getProfile, isAuthenticated } from './state/profile-store.js';
import { colyseus, enterMatch, signOut } from './net/connection-manager.js';

function bootstrap(): void {
  const appRoot = document.getElementById('app');
  const canvas = document.getElementById('bg-particles') as HTMLCanvasElement | null;
  if (!appRoot) throw new Error('Elemento #app non trovato');

  initClientEnvironment();
  applySettingsToDocument();

  if (canvas) {
    const particles = new ParticlesCanvas(canvas);
    particles.start();
  }

  const router = new Router();
  const newsTicker = new NewsTicker();
  const socialDrawer = new SocialDrawer();
  document.body.append(socialDrawer.backdrop, socialDrawer.drawer);

  let unmountActiveView: (() => void) | null = null;
  let previousRoute: AppRoute | null = null;

  const enterPostSplash = (): void => {
    router.navigate(isAuthenticated() ? 'gioca' : 'auth');
  };

  const handleLaunch = async (cfg: LauncherConfig): Promise<void> => {
    if (cfg.mode !== 'uno') {
      openMiniGameSandboxModal(cfg.mode);
      return;
    }
    const maxPlayers = cfg.variant === 'team' ? 4 : cfg.playerCount === 1 ? 4 : cfg.playerCount;
    await enterMatch({
      mode: cfg.mode,
      maxPlayers,
      ranked: cfg.ranked,
      fillWithBots: true,
      ...(cfg.variant !== undefined ? { variant: cfg.variant } : {}),
    });
    if (cfg.playerCount === 1) {
      colyseus.startMatch();
    }
    router.navigate('game');
  };

  const render = (route: AppRoute): void => {
    if (previousRoute !== null && previousRoute !== route) {
      purgeOnClose();
      playEarcon('nav');
      announce(`Sezione ${route}`, 'polite');
    }
    previousRoute = route;

    if (unmountActiveView) {
      unmountActiveView();
      unmountActiveView = null;
    }
    appRoot.innerHTML = '';

    if (route === 'splash') {
      appRoot.appendChild(renderSplashScreen(enterPostSplash));
      return;
    }

    if (route === 'auth') {
      if (isAuthenticated()) {
        router.navigate('gioca');
        return;
      }
      unmountActiveView = mountAuthScreen(appRoot, {
        onAuthenticated: () => router.navigate('gioca'),
        onBack: () => router.navigate('splash'),
      });
      return;
    }

    if (!isAuthenticated()) {
      router.navigate('auth');
      return;
    }

    if (route === 'game') {
      const room = colyseus.getRoom();
      if (!room) {
        router.navigate('gioca');
        return;
      }
      unmountActiveView = mountGameView(appRoot, {
        room,
        onExit: () => router.navigate('gioca'),
      });
      return;
    }

    const profile = getProfile();
    const shell = document.createElement('div');
    shell.className = 'shell-layout';

    const topBarCallbacks: TopBarCallbacks = {
      onSelectTab: (next) => router.navigate(next),
      onToggleSocial: () => socialDrawer.toggle(),
      onOpenSettings: () => openSettingsModal(),
      onLogout: () => {
        signOut();
        router.navigate('splash');
      },
      ...(profile?.username ? { username: profile.username } : {}),
    };
    const topBar = createTopBar(route, topBarCallbacks);

    const main = document.createElement('main');
    main.className = 'shell-main';
    main.tabIndex = -1;
    main.appendChild(
      route === 'gioca'
        ? createPlayView(socialDrawer, handleLaunch)
        : renderRouteTabView(route, socialDrawer, handleLaunch)
    );

    shell.append(topBar, newsTicker.element, main);
    appRoot.appendChild(shell);
  };

  router.subscribe(render);
  render(router.getRoute());

  // Navigazione da tastiera: INVIO su splash, ESC globale ovunque (tranne in partita attiva)
  window.addEventListener('keydown', (ev) => {
    if (hasBlockedModifier(ev)) return;
    const current = router.getRoute();
    if (ev.key === 'Enter' && current === 'splash') {
      enterPostSplash();
      return;
    }
    if (ev.key === 'Escape') {
      if (current === 'game') {
        return;
      }
      if (current === 'auth') {
        router.navigate('splash');
        return;
      }
      if (socialDrawer.isOpen()) {
        socialDrawer.close();
      } else if (newsTicker.isVisible() && current !== 'splash') {
        newsTicker.hide();
      } else if (current !== 'gioca' && current !== 'splash') {
        router.navigate('gioca');
      }
    }
  });
}

bootstrap();
