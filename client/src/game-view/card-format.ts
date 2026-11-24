// ============================================================
// UNO ULTRA Client — Card display formatting helpers
// ============================================================

import type { UnoCard } from '@uno/shared';

const COLOR_LABELS: Record<string, string> = {
  red: 'Rosso',
  yellow: 'Giallo',
  green: 'Verde',
  blue: 'Blu',
  wild: 'Jolly',
};

export function formatCardSymbol(card: UnoCard): string {
  switch (card.kind) {
    case 'number':
      return String(card.value ?? 0);
    case 'skip':
      return '⊘';
    case 'reverse':
      return '⇄';
    case 'draw2':
      return '+2';
    case 'wild':
      return '★';
    case 'wild_draw4':
      return '+4';
  }
}

export function formatColorLabel(color: string): string {
  return COLOR_LABELS[color] ?? '—';
}
