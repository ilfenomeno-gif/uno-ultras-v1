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

export function formatCardSpeechLabel(card: UnoCard): string {
  const colorName = formatColorLabel(card.color);
  switch (card.kind) {
    case 'number':
      return `${colorName} ${card.value ?? 0}`;
    case 'skip':
      return `${colorName} Salta`;
    case 'reverse':
      return `${colorName} Inverti`;
    case 'draw2':
      return `${colorName} Pesca 2`;
    case 'wild':
      return 'Jolly Cambia Colore';
    case 'wild_draw4':
      return 'Jolly Pesca 4';
  }
}
