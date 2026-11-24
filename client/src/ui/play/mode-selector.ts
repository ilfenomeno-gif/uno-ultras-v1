// ============================================================
// UNO ULTRA Client — Modular Mode Selector Component
// ============================================================

import { GAME_MODES, type GameMode } from '@uno/shared';

export const MODE_DISPLAY_LABELS: Record<GameMode, string> = {
  uno: 'UNO Classic (Online)',
  blackjack: 'Blackjack 21',
  scala40: 'Scala 40',
  'ruba-mazzetto': 'Ruba Mazzetto',
  scopa: 'Scopa Classica',
  'poker-texas': "Poker Texas Hold'em",
  burraco: 'Burraco Online',
  'mille-miglia': 'Mille Miglia 1000',
};

export function createModeSelector(
  initial: GameMode,
  onChange: (mode: GameMode) => void,
): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'launcher-select';
  for (const mode of GAME_MODES) {
    const opt = document.createElement('option');
    opt.value = mode;
    opt.textContent = MODE_DISPLAY_LABELS[mode];
    if (mode === initial) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener('change', () => onChange(select.value as GameMode));
  return select;
}
