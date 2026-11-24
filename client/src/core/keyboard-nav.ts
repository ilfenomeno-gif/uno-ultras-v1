// ============================================================
// UNO ULTRA Client — Safe Loop, Card Shortcuts & Hand Sorting
// ASTRALIS v3 Keyboard Ergonomics & Verifiable Ordering
// ============================================================

import type { UnoCard, UnoCardKind, UnoColor } from '@uno/shared';

export const CARD_SHORTCUT_KEYS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '0',
  '-',
  '=',
] as const;

const COLOR_ORDER: Readonly<Record<UnoColor | 'wild', number>> = {
  red: 0,
  yellow: 1,
  green: 2,
  blue: 3,
  wild: 4,
};

const KIND_ORDER: Readonly<Record<UnoCardKind, number>> = {
  number: 0,
  skip: 1,
  reverse: 2,
  draw2: 3,
  wild: 4,
  wild_draw4: 5,
};

export function getCardShortcutLabel(index: number): string | null {
  if (index < 0 || index >= CARD_SHORTCUT_KEYS.length) {
    return null;
  }
  return CARD_SHORTCUT_KEYS[index] ?? null;
}

export function resolveCardShortcutIndex(key: string): number {
  return (CARD_SHORTCUT_KEYS as readonly string[]).indexOf(key);
}

/** Computes wrapped circular navigation index with wrap notification flag. */
export function computeSafeLoopIndex(
  current: number,
  delta: number,
  length: number
): { index: number; wrapped: boolean } {
  if (length <= 0) {
    return { index: -1, wrapped: false };
  }
  const base = current < 0 || current >= length
    ? (delta >= 0 ? -1 : length)
    : current;
  const raw = base + delta;
  const index = ((raw % length) + length) % length;
  const wrapped = current >= 0 && current < length && (raw < 0 || raw >= length);
  return { index, wrapped };
}

/** Blocks app shortcuts whenever OS/Screen-Reader modifier keys are pressed. */
export function hasBlockedModifier(
  ev: Pick<KeyboardEvent, 'ctrlKey' | 'altKey' | 'metaKey'>
): boolean {
  return ev.ctrlKey || ev.altKey || ev.metaKey;
}

/** Deterministic UNO hand sort (color -> kind -> numeric value -> id). */
export function sortUnoHand(cards: readonly UnoCard[]): UnoCard[] {
  return [...cards].sort((a, b) => {
    const colorDiff = COLOR_ORDER[a.color] - COLOR_ORDER[b.color];
    if (colorDiff !== 0) return colorDiff;

    const kindDiff = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    if (kindDiff !== 0) return kindDiff;

    const valA = a.kind === 'number' ? (a.value ?? 0) : 99;
    const valB = b.kind === 'number' ? (b.value ?? 0) : 99;
    if (valA !== valB) return valA - valB;

    return a.id.localeCompare(b.id);
  });
}
