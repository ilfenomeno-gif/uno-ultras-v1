// ============================================================
// UNO ULTRA Client — Play Tab Stage (3D Spinner + Launcher + HUD)
// ============================================================

import { INITIAL_MMR, rankFromMMR } from '@uno/shared';
import { createCard3DSpinner } from '../../fx/card-3d-spinner.js';
import { getProfile } from '../../state/profile-store.js';
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

  // Pannello quadrato Launcher (basso-sinistra)
  const launcher = createLauncherPanel(
    { mode: 'uno', playerCount: 2, ranked: true },
    onLaunch
  );

  // Cerchio livello Battle Card + Anello Rank (basso-destra)
  const progressHud = document.createElement('div');
  progressHud.className = 'hud-progress-widget glass-panel';
  const profile = getProfile();
  const mmr = profile?.mmr ?? INITIAL_MMR;
  const currentRank = profile?.rankTier ?? rankFromMMR(mmr);
  const bcLevel = profile?.battleCardLevel ?? 1;
  progressHud.innerHTML = `
    <div class="battle-card-circle">
      <small>BC LV</small>
      <strong>${bcLevel}</strong>
    </div>
    <div class="rank-ring-meta">
      <span class="rank-ring-tier">${currentRank}</span>
      <span class="rank-ring-mmr">${mmr} MMR</span>
    </div>
  `;

  stage.append(showcase, launcher, progressHud);
  return stage;
}
