// ============================================================
// UNO ULTRA Client — Play Tab Stage (3D Spinner + Launcher + HUD)
// ============================================================

import {
  formatPlaylistKey,
  getRankInfo,
  INITIAL_MMR,
  normalizePlaylistPlayerCount,
  type RankTier,
} from '@uno/shared';
import { createCard3DSpinner } from '../../fx/card-3d-spinner.js';
import { fetchProgressionSnapshot } from '../../net/tcp/rest-client.js';
import { getProfile, patchProfile } from '../../state/profile-store.js';
import { createLauncherPanel, type LauncherConfig } from '../play/launcher.js';
import type { SocialDrawer } from '../play/social-drawer.js';

export function createPlayView(
  socialDrawer: SocialDrawer,
  onLaunch: (cfg: LauncherConfig) => Promise<void>
): HTMLElement {
  const stage = document.createElement('div');
  stage.className = 'play-stage';

  // Centro: 1x "+" sinistra | Carta 3D rotante | 2x "+" destra
  const showcase = document.createElement('div');
  showcase.className = 'center-showcase';

  const makePlusBtn = (label: string): HTMLButtonElement => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'party-plus-btn';
    btn.textContent = '+';
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.addEventListener('click', () => socialDrawer.open());
    return btn;
  };

  const leftSlots = document.createElement('div');
  leftSlots.className = 'party-slots-group';
  leftSlots.appendChild(makePlusBtn('Invita giocatore slot 1'));

  const rightSlots = document.createElement('div');
  rightSlots.className = 'party-slots-group';
  rightSlots.append(
    makePlusBtn('Invita giocatore slot 2'),
    makePlusBtn('Invita giocatore slot 3')
  );

  showcase.append(leftSlots, createCard3DSpinner(), rightSlots);

  let selectedCfg: LauncherConfig = { mode: 'uno', playerCount: 2, ranked: true };

  // Cerchio livello Battle Card + Anello Rank indipendente per playlist (basso-destra)
  const progressHud = document.createElement('div');
  progressHud.className = 'hud-progress-widget glass-panel';

  const syncHud = (): void => {
    const profile = getProfile();
    const playlistKey = formatPlaylistKey(selectedCfg.mode, selectedCfg.playerCount);
    const playlistEntry = profile?.playlistRanks?.[playlistKey];
    const normCount = normalizePlaylistPlayerCount(selectedCfg.playerCount);
    const formatLabel = normCount === 2 ? '1v1' : `${normCount}G`;
    const mmr = playlistEntry?.mmr ?? INITIAL_MMR;
    const rankInfo = getRankInfo(mmr);
    const currentRank = playlistEntry?.rankTier ?? rankInfo.tier;
    const bcLevel = profile?.battleCardLevel ?? 1;
    progressHud.innerHTML = `
      <div class="battle-card-circle">
        <small>BC LV</small>
        <strong>${bcLevel}</strong>
      </div>
      <div class="rank-ring-meta">
        <span class="rank-ring-tier" style="color:${rankInfo.colorHex}">${currentRank}</span>
        <span class="rank-ring-mmr">${selectedCfg.mode.toUpperCase()} · ${formatLabel} · ${mmr} MMR</span>
      </div>
    `;
  };

  // Pannello quadrato Launcher (basso-sinistra)
  const launcher = createLauncherPanel(
    selectedCfg,
    onLaunch,
    (nextCfg) => {
      selectedCfg = nextCfg;
      syncHud();
    }
  );

  syncHud();

  void fetchProgressionSnapshot()
    .then((snap) => {
      patchProfile({
        mmr: snap.mmr,
        rankTier: snap.rankTier as RankTier,
        vcard: snap.vcardBalance,
        battleCardLevel: snap.battleCard.level,
        ...(snap.playlistRanks ? { playlistRanks: snap.playlistRanks } : {}),
      });
      syncHud();
    })
    .catch(() => {});

  stage.append(showcase, launcher, progressHud);
  return stage;
}
