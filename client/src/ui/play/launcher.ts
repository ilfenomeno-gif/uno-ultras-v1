// ============================================================
// UNO ULTRA Client — Square Launcher Panel (Bottom-Left)
// ============================================================

import {
  GAME_MODES,
  PLAYER_COUNTS,
  type GameMode,
  type PlayerCount,
} from '@uno/shared';

export interface LauncherConfig {
  mode: GameMode;
  playerCount: PlayerCount;
  ranked: boolean;
}

const MODE_LABELS: Record<GameMode, string> = {
  uno: 'UNO Classic (Online)',
  blackjack: 'Blackjack',
  scala40: 'Scala 40',
  'ruba-mazzetto': 'Ruba Mazzetto',
  scopa: 'Scopa',
  'poker-texas': 'Poker Texas Hold’em',
  burraco: 'Burraco',
  'mille-miglia': 'Mille Miglia',
};

export function createLauncherPanel(
  initial: LauncherConfig,
  onLaunch: (config: LauncherConfig) => Promise<void> | void
): HTMLElement {
  const state: LauncherConfig = { ...initial };

  const panel = document.createElement('aside');
  panel.className = 'launcher-panel glass-panel';

  const heading = document.createElement('div');
  heading.className = 'launcher-heading';
  heading.textContent = 'Configura Partita';

  // Mode selector
  const modeField = document.createElement('div');
  modeField.className = 'launcher-field';
  const modeLabel = document.createElement('label');
  modeLabel.className = 'launcher-label';
  modeLabel.textContent = 'Modalità';
  const select = document.createElement('select');
  select.className = 'launcher-select';
  for (const mode of GAME_MODES) {
    const opt = document.createElement('option');
    opt.value = mode;
    opt.textContent = MODE_LABELS[mode];
    if (mode === state.mode) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener('change', () => {
    state.mode = select.value as GameMode;
  });
  modeField.append(modeLabel, select);

  // Player count selector (1-4)
  const countField = document.createElement('div');
  countField.className = 'launcher-field';
  const countLabel = document.createElement('span');
  countLabel.className = 'launcher-label';
  countLabel.textContent = 'Giocatori';
  const countRow = document.createElement('div');
  countRow.className = 'launcher-row';
  const pillButtons: HTMLButtonElement[] = [];

  for (const count of PLAYER_COUNTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `launcher-pill${state.playerCount === count ? ' active' : ''}`;
    btn.textContent = `${count}P`;
    btn.addEventListener('click', () => {
      state.playerCount = count;
      for (const b of pillButtons) b.classList.remove('active');
      btn.classList.add('active');
    });
    pillButtons.push(btn);
    countRow.appendChild(btn);
  }
  countField.append(countLabel, countRow);

  // Ranked toggle
  const rankedRow = document.createElement('div');
  rankedRow.className = 'launcher-toggle-row';
  const rankedLabel = document.createElement('span');
  rankedLabel.className = 'launcher-label';
  rankedLabel.textContent = 'Classificata (MMR)';
  const rankedBtn = document.createElement('button');
  rankedBtn.type = 'button';
  const syncRankedBtn = (): void => {
    rankedBtn.className = `launcher-ranked-btn${state.ranked ? ' active' : ''}`;
    rankedBtn.textContent = state.ranked ? 'RANKED ON' : 'CASUAL';
  };
  syncRankedBtn();
  rankedBtn.addEventListener('click', () => {
    state.ranked = !state.ranked;
    syncRankedBtn();
  });
  rankedRow.append(rankedLabel, rankedBtn);

  // Launch CTA
  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.className = 'launcher-play-btn';
  playBtn.textContent = 'GIOCA';

  // Status feedback
  const statusEl = document.createElement('div');
  statusEl.className = 'launcher-status';
  statusEl.setAttribute('role', 'status');

  playBtn.addEventListener('click', async () => {
    playBtn.disabled = true;
    statusEl.classList.remove('is-error');
    statusEl.textContent = 'Connessione alla partita…';
    try {
      await onLaunch({ ...state });
    } catch (err) {
      statusEl.classList.add('is-error');
      statusEl.textContent =
        err instanceof Error ? err.message : 'Impossibile avviare la partita. Riprova.';
      playBtn.disabled = false;
    }
  });

  panel.append(heading, modeField, countField, rankedRow, playBtn, statusEl);
  return panel;
}
