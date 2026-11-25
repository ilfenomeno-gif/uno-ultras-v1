// ============================================================
// UNO ULTRA Client — Play Tab Stage (3D Spinner + Launcher + HUD)
// ============================================================

import {
  formatPlaylistKey,
  getRankInfo,
  getSubDivision,
  INITIAL_MMR,
  normalizePlaylistPlayerCount,
  PLACEMENT_MATCHES_REQUIRED,
  type RankTier,
} from '@uno/shared';
import { createCard3DSpinner } from '../../fx/card-3d-spinner.js';
import { fetchProgressionSnapshot } from '../../net/tcp/rest-client.js';
import { getProfile, patchProfile } from '../../state/profile-store.js';
import { openModal } from '../components/modal.js';
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
  let activeBan: { remainingSeconds: number; reason: string } | null = null;

  const openRankRulesModal = (): void => {
    const body = document.createElement('div');
    body.className = 'rank-guide-list';
    body.innerHTML = `
      <p><strong>Promozioni & Retrocessioni:</strong> vincendo le partite competitive sali di divisione e di grado; perdendo più partite di quelle che vinci retrocedi. Non esiste un numero fisso di match: il calcolo pesa sia il risultato sia la difficoltà degli avversari.</p>
      <p><strong>Classificazione (10 partite) & Anti-Smurfing Involontario:</strong> nelle prime 10 partite di una playlist sei in classificazione. Se il sistema rileva da altre playlist competitive che il tuo livello reale è superiore, al termine dei 10 match calibra il tuo grado verso l'alto.</p>
      <p><strong>Abilità ponderata di gruppo:</strong> in squadra il matchmaking usa una media ponderata (più vicina al grado massimo se il divario nel gruppo è ampio; per gradi <em>Campione</em> o superiori il giocatore più alto pesa molto di più). In Casuale resta più vicina alla media. Sconfiggere avversari più forti dà più MMR e riduce la perdita in caso di sconfitta.</p>
      <p><strong>Limite 3 livelli (gruppi incompleti):</strong> un gruppo di 2 giocatori in coda 3G/4G UNO o Torneo non può superare i <strong>3 gradi</strong> di differenza (es. Platino II vs Diamante III = 4 livelli è bloccato; Platino III vs Diamante III = 3 livelli è ammesso). Non si applica in 1v1 o nei Mini-Giochi extra.</p>
      <p><strong>Forma Gruppo & Abbandono anticipato:</strong> a fine partita puoi usare <em>Forma Gruppo</em> per rigiocare coi compagni. Chi lascia una partita competitiva subisce la sconfitta, un <strong>ban progressivo dal matchmaking</strong> e il primo a uscire riceve una penalità MMR aggravata.</p>
    `;
    openModal({ title: 'Come funzionano i Rank Competitivi', body });
  };

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
    const matchesPlayed =
      playlistEntry?.matchesPlayed ?? (playlistEntry ? playlistEntry.wins + playlistEntry.losses : 0);
    const placementComplete = matchesPlayed >= PLACEMENT_MATCHES_REQUIRED;
    const subDiv = playlistEntry?.subDivision ?? getSubDivision(mmr);
    const tierLabel = placementComplete
      ? `${currentRank}${subDiv ? ` · Div. ${subDiv}` : ''}`
      : `Classificazione ${matchesPlayed}/${PLACEMENT_MATCHES_REQUIRED} · ${currentRank}`;
    const bcLevel = profile?.battleCardLevel ?? 1;
    progressHud.replaceChildren();

    const circle = document.createElement('div');
    circle.className = 'battle-card-circle';
    circle.innerHTML = `<small>BC LV</small><strong>${bcLevel}</strong>`;

    const meta = document.createElement('div');
    meta.className = 'rank-ring-meta';

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.alignItems = 'center';
    topRow.style.gap = '0.45rem';

    const tierEl = document.createElement('span');
    tierEl.className = 'rank-ring-tier';
    tierEl.style.color = rankInfo.colorHex;
    tierEl.textContent = tierLabel;

    const infoBtn = document.createElement('button');
    infoBtn.type = 'button';
    infoBtn.className = 'rank-guide-btn';
    infoBtn.textContent = '?';
    infoBtn.title = 'Come funzionano i Rank competitivi';
    infoBtn.setAttribute('aria-label', 'Come funzionano i Rank competitivi');
    infoBtn.addEventListener('click', openRankRulesModal);

    topRow.append(tierEl, infoBtn);

    const mmrEl = document.createElement('span');
    mmrEl.className = 'rank-ring-mmr';
    mmrEl.textContent = `${selectedCfg.mode.toUpperCase()} · ${formatLabel} · ${mmr} MMR`;

    meta.append(topRow, mmrEl);

    if (activeBan && activeBan.remainingSeconds > 0) {
      const banEl = document.createElement('span');
      banEl.className = 'rank-ban-pill';
      const mins = Math.max(1, Math.ceil(activeBan.remainingSeconds / 60));
      banEl.textContent = `BAN CODA: ${mins}m`;
      banEl.title = activeBan.reason;
      meta.appendChild(banEl);
    }

    progressHud.append(circle, meta);
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
      activeBan = snap.activeBan ?? null;
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
