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
import './styles/battle-card.css';
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
import {
  cancelMatchmaking,
  enqueueMatchmaking,
  fetchInventory,
  getMatchmakingStatus,
} from './net/tcp/rest-client.js';
import { getEconomySnapshot, setEconomySnapshot } from './state/inventory-store.js';
import { getProfile, isAuthenticated } from './state/profile-store.js';
import { colyseus, enterMatch, joinMatchById, signOut } from './net/connection-manager.js';

function bootstrap(): void {
  const appRoot = document.getElementById('app');
  const canvas = document.getElementById('bg-particles') as HTMLCanvasElement | null;
  if (!appRoot) throw new Error('Elemento #app non trovato');

  initClientEnvironment();
  applySettingsToDocument();

  const hydrateEquippedInventory = async (): Promise<void> => {
    if (!isAuthenticated()) return;
    try {
      const inv = await fetchInventory();
      const cur = getEconomySnapshot();
      const activeTheme = cur.loadout.theme;
      if (activeTheme && activeTheme !== 'theme_default') {
        document.body.dataset['arenaTheme'] = activeTheme;
      }
      setEconomySnapshot({
        ...cur,
        items: inv.items.map((r) => ({
          itemId: r.item_id,
          category: r.category,
          quantity: r.quantity,
        })),
        loadout: {
          ...cur.loadout,
          avatar: inv.loadout.avatar,
          frame: inv.loadout.frame,
          cardStyle: inv.loadout.cardStyle,
          title: inv.loadout.title,
        },
      });
    } catch {
      // Fallback silenzioso in caso di sessione ospite o offline
    }
  };
  void hydrateEquippedInventory();

  if (canvas) {
    const particles = new ParticlesCanvas(canvas);
    particles.start();
  }

  const router = new Router();
  const newsTicker = new NewsTicker();
  const socialDrawer = new SocialDrawer({
    onJoinInvite: async (roomId) => {
      await joinMatchById(roomId);
      socialDrawer.close();
      router.navigate('game');
    },
  });
  document.body.append(socialDrawer.backdrop, socialDrawer.drawer);

  let unmountActiveView: (() => void) | null = null;
  let previousRoute: AppRoute | null = null;

  const enterPostSplash = (): void => {
    router.navigate(isAuthenticated() ? 'gioca' : 'auth');
  };

  const handleLaunch = async (cfg: LauncherConfig): Promise<void> => {
    if (cfg.mode !== 'uno') {
      openMiniGameSandboxModal(cfg.mode, {
        ranked: cfg.ranked,
        playerCount: cfg.playerCount === 1 ? 2 : cfg.playerCount,
      });
      return;
    }
    const maxPlayers = cfg.variant === 'team' ? 4 : cfg.playerCount === 1 ? 2 : cfg.playerCount;
    if (cfg.playerCount >= 2) {
      const queued = await enqueueMatchmaking({
        mode: 'uno',
        ranked: cfg.ranked,
        targetPlayers: maxPlayers,
        ...(cfg.variant !== undefined ? { variant: cfg.variant } : {}),
      });
      const immediateRoomId =
        typeof queued.matched?.roomId === 'string' ? queued.matched.roomId : undefined;
      if (immediateRoomId) {
        await joinMatchById(immediateRoomId);
        router.navigate('game');
        return;
      }

      let matchedRoomId: string | undefined;
      let cancelled = false;
      const deadline = Date.now() + 12_000;
      while (Date.now() < deadline) {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 250);
        });
        try {
          const statusRes = await getMatchmakingStatus(queued.ticket.ticketId);
          if (statusRes.status === 'matched' && typeof statusRes.roomId === 'string') {
            matchedRoomId = statusRes.roomId;
            break;
          }
          if (statusRes.status === 'cancelled') {
            cancelled = true;
            break;
          }
        } catch {
          // Ignore transient poll errors while waiting for server match or bot fallback
        }
      }

      if (cancelled) {
        throw new Error('Coda matchmaking annullata');
      }
      if (matchedRoomId) {
        await joinMatchById(matchedRoomId);
        router.navigate('game');
        return;
      }

      await cancelMatchmaking('uno', cfg.ranked).catch(() => undefined);
      throw new Error('Timeout matchmaking: nessun server di gioco disponibile. Riprova.');
    }

    const room = await enterMatch({
      mode: cfg.mode,
      maxPlayers,
      ranked: cfg.ranked,
      fillWithBots: true,
      ...(cfg.variant !== undefined ? { variant: cfg.variant } : {}),
    });
    if (room.state?.phase !== 'playing' && room.state?.phase !== 'finished') {
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
        void hydrateEquippedInventory();
        router.navigate('gioca');
        return;
      }
      unmountActiveView = mountAuthScreen(appRoot, {
        onAuthenticated: () => {
          void hydrateEquippedInventory();
          router.navigate('gioca');
        },
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
