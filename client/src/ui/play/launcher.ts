// ============================================================
// UNO ULTRA Client — Square Launcher Panel (Bottom-Left)
// ============================================================

import {
  type GameMode,
  type MatchVariant,
  type PlayerCount,
} from '@uno/shared';
import { createModeSelector } from './mode-selector.js';
import { createPlayerCountSelector } from './player-count-selector.js';
import { createRankedToggle } from './ranked-toggle.js';

export interface LauncherConfig {
  mode: GameMode;
  playerCount: PlayerCount;
  ranked: boolean;
  variant?: MatchVariant;
}

const VARIANT_LABELS: ReadonlyArray<{ id: MatchVariant; label: string }> = [
  { id: 'standard', label: 'Classica' },
  { id: 'blitz', label: 'Blitz (10s · 5 carte)' },
  { id: 'chaos', label: 'Chaos (Flip ogni 4 turni)' },
  { id: 'team', label: 'Team 2v2 (4 giocatori)' },
];

export function createLauncherPanel(
  initial: LauncherConfig,
  onLaunch: (config: LauncherConfig) => Promise<void> | void,
  onChange?: (config: LauncherConfig) => void
): HTMLElement {
  const state: LauncherConfig = { variant: 'standard', ...initial };
  const notifyChange = (): void => {
    onChange?.({ ...state });
  };

  const panel = document.createElement('aside');
  panel.className = 'launcher-panel glass-panel';

  const heading = document.createElement('div');
  heading.className = 'launcher-heading';
  heading.textContent = 'Configura Partita';

  // Mode selector (reused component)
  const modeField = document.createElement('div');
  modeField.className = 'launcher-field';
  const modeLabel = document.createElement('label');
  modeLabel.className = 'launcher-label';
  modeLabel.textContent = 'Modalità';
  const select = createModeSelector(state.mode, (mode) => {
    state.mode = mode;
    variantField.style.display = mode === 'uno' ? '' : 'none';
    notifyChange();
  });
  modeField.append(modeLabel, select);

  // Variant selector (Standard / Blitz / Chaos / Team)
  const variantField = document.createElement('div');
  variantField.className = 'launcher-field';
  variantField.style.display = state.mode === 'uno' ? '' : 'none';
  const variantLabel = document.createElement('label');
  variantLabel.className = 'launcher-label';
  variantLabel.textContent = 'Variante UNO';
  const variantSelect = document.createElement('select');
  variantSelect.className = 'launcher-select';
  for (const v of VARIANT_LABELS) {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = v.label;
    if (v.id === (state.variant ?? 'standard')) opt.selected = true;
    variantSelect.appendChild(opt);
  }
  variantSelect.addEventListener('change', () => {
    state.variant = variantSelect.value as MatchVariant;
    notifyChange();
  });
  variantField.append(variantLabel, variantSelect);

  // Player count selector (1-4)
  const countField = document.createElement('div');
  countField.className = 'launcher-field';
  const countLabel = document.createElement('span');
  countLabel.className = 'launcher-label';
  countLabel.textContent = 'Giocatori';
  const countRow = createPlayerCountSelector(state.playerCount, (count) => {
    state.playerCount = count;
    notifyChange();
  });
  countField.append(countLabel, countRow);

  // Ranked toggle
  const rankedRow = document.createElement('div');
  rankedRow.className = 'launcher-toggle-row';
  const rankedLabel = document.createElement('span');
  rankedLabel.className = 'launcher-label';
  rankedLabel.textContent = 'Classificata (MMR)';
  const rankedBtn = createRankedToggle(state.ranked, (ranked) => {
    state.ranked = ranked;
    notifyChange();
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
    if (playBtn.disabled) return;
    playBtn.disabled = true;
    statusEl.classList.remove('is-error');
    statusEl.textContent = 'Connessione alla partita…';
    try {
      await onLaunch({ ...state });
      statusEl.textContent = '';
    } catch (err) {
      statusEl.classList.add('is-error');
      statusEl.textContent =
        err instanceof Error ? err.message : 'Impossibile avviare la partita. Riprova.';
    } finally {
      playBtn.disabled = false;
    }
  });

  panel.append(heading, modeField, variantField, countField, rankedRow, playBtn, statusEl);
  return panel;
}
