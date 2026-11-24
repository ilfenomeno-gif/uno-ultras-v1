// ============================================================
// UNO ULTRA Client — ASTRALIS v3 Audio, AriaLive & Keyboard Tests
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import type { UnoCard } from '@uno/shared';
import {
  clearAudioDucking,
  computeEffectiveGain,
  DUCKING_FACTOR,
  duckAudio,
  getAudioState,
  playEarcon,
  resetAudioEngineForTests,
  SAFETY_MAX_GAIN,
  syncAudioSettings,
} from '../src/core/audio-earcons.js';
import {
  announce,
  getAnnouncementHistory,
  getLastAnnouncement,
  purgeOnClose,
  resetAriaLiveForTests,
} from '../src/core/aria-live.js';
import {
  computeSafeLoopIndex,
  getCardShortcutLabel,
  hasBlockedModifier,
  resolveCardShortcutIndex,
  sortUnoHand,
} from '../src/core/keyboard-nav.js';
import { formatCardSpeechLabel } from '../src/game-view/card-format.js';
import {
  loadSettings,
  saveSettings,
  subscribeSettings,
} from '../src/ui/shell/settings-modal.js';

function installMemoryStorage(): void {
  const mem = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
    },
    configurable: true,
  });
}

describe('ASTRALIS v3 — Procedural Audio Safety & Ducking', () => {
  beforeEach(() => {
    resetAudioEngineForTests();
  });

  it('enforces 0.75 safety ceiling and zero gain when muted or zero volume', () => {
    expect(SAFETY_MAX_GAIN).toBe(0.75);
    expect(computeEffectiveGain(0, true, false)).toBe(0);
    expect(computeEffectiveGain(80, false, false)).toBe(0);
    expect(computeEffectiveGain(100, true, false)).toBeCloseTo(0.75, 5);
    expect(computeEffectiveGain(150, true, false)).toBeCloseTo(0.75, 5);
    expect(computeEffectiveGain(100, true, true)).toBeCloseTo(
      0.75 * DUCKING_FACTOR,
      5
    );
  });

  it('syncs volume/sfx state, ducks audio and safely no-ops earcons in headless env', () => {
    syncAudioSettings(100, true);
    expect(getAudioState().effectiveGain).toBeCloseTo(0.75, 5);

    duckAudio(500);
    expect(getAudioState().ducked).toBe(true);
    expect(getAudioState().effectiveGain).toBeCloseTo(0.3375, 4);

    clearAudioDucking();
    expect(getAudioState().ducked).toBe(false);

    expect(() => playEarcon('turn_start')).not.toThrow();
    expect(() => playEarcon('uno')).not.toThrow();
    expect(() => playEarcon('error')).not.toThrow();
  });
});

describe('ASTRALIS v3 — Single-Voice-Authority & Purge-on-Close', () => {
  beforeEach(() => {
    resetAudioEngineForTests();
    resetAriaLiveForTests();
  });

  it('tracks polite/assertive announcements, triggers ducking on alert and purges on close', () => {
    announce('   ', 'polite');
    expect(getLastAnnouncement()).toBeNull();

    announce('Tocca a te', 'polite');
    expect(getLastAnnouncement()).toEqual({ message: 'Tocca a te', priority: 'polite' });
    expect(getAudioState().ducked).toBe(false);

    announce('Carta non giocabile', 'assertive');
    expect(getLastAnnouncement()).toEqual({
      message: 'Carta non giocabile',
      priority: 'assertive',
    });
    expect(getAudioState().ducked).toBe(true);
    expect(getAnnouncementHistory()).toHaveLength(2);

    purgeOnClose();
    expect(getLastAnnouncement()).toBeNull();
    expect(getAudioState().ducked).toBe(false);
  });
});

describe('ASTRALIS v3 — Safe Loop, Card Shortcuts & Hand Sorting', () => {
  it('wraps around cleanly with Safe Loop indices', () => {
    expect(computeSafeLoopIndex(0, 1, 0)).toEqual({ index: -1, wrapped: false });
    expect(computeSafeLoopIndex(-1, 1, 5)).toEqual({ index: 0, wrapped: false });
    expect(computeSafeLoopIndex(-1, -1, 5)).toEqual({ index: 4, wrapped: false });
    expect(computeSafeLoopIndex(1, 1, 5)).toEqual({ index: 2, wrapped: false });
    expect(computeSafeLoopIndex(4, 1, 5)).toEqual({ index: 0, wrapped: true });
    expect(computeSafeLoopIndex(0, -1, 5)).toEqual({ index: 4, wrapped: true });
  });

  it('resolves card shortcut keys 1..9, 0, -, =', () => {
    expect(getCardShortcutLabel(0)).toBe('1');
    expect(getCardShortcutLabel(9)).toBe('0');
    expect(getCardShortcutLabel(10)).toBe('-');
    expect(getCardShortcutLabel(11)).toBe('=');
    expect(getCardShortcutLabel(12)).toBeNull();

    expect(resolveCardShortcutIndex('1')).toBe(0);
    expect(resolveCardShortcutIndex('0')).toBe(9);
    expect(resolveCardShortcutIndex('-')).toBe(10);
    expect(resolveCardShortcutIndex('=')).toBe(11);
    expect(resolveCardShortcutIndex('x')).toBe(-1);
  });

  it('blocks shortcuts when OS or screen-reader modifier keys are held', () => {
    expect(hasBlockedModifier({ ctrlKey: false, altKey: false, metaKey: false })).toBe(false);
    expect(hasBlockedModifier({ ctrlKey: true, altKey: false, metaKey: false })).toBe(true);
    expect(hasBlockedModifier({ ctrlKey: false, altKey: true, metaKey: false })).toBe(true);
    expect(hasBlockedModifier({ ctrlKey: false, altKey: false, metaKey: true })).toBe(true);
  });

  it('sorts UNO hand deterministically without mutating input array', () => {
    const hand: UnoCard[] = [
      { id: 'c1', color: 'wild', kind: 'wild_draw4' },
      { id: 'c2', color: 'blue', kind: 'number', value: 5 },
      { id: 'c3', color: 'red', kind: 'skip' },
      { id: 'c4', color: 'red', kind: 'number', value: 2 },
      { id: 'c5', color: 'yellow', kind: 'reverse' },
      { id: 'c6', color: 'green', kind: 'draw2' },
    ];
    const sorted = sortUnoHand(hand);
    expect(sorted.map((c) => c.id)).toEqual(['c4', 'c3', 'c5', 'c6', 'c2', 'c1']);
    expect(hand.map((c) => c.id)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'c6']);
  });

  it('formats all 6 UNO card kinds into Italian speech labels', () => {
    expect(formatCardSpeechLabel({ id: 'n', color: 'red', kind: 'number', value: 9 })).toBe('Rosso 9');
    expect(formatCardSpeechLabel({ id: 's', color: 'blue', kind: 'skip' })).toBe('Blu Salta');
    expect(formatCardSpeechLabel({ id: 'r', color: 'green', kind: 'reverse' })).toBe('Verde Inverti');
    expect(formatCardSpeechLabel({ id: 'd', color: 'yellow', kind: 'draw2' })).toBe('Giallo Pesca 2');
    expect(formatCardSpeechLabel({ id: 'w', color: 'wild', kind: 'wild' })).toBe('Jolly Cambia Colore');
    expect(formatCardSpeechLabel({ id: 'w4', color: 'wild', kind: 'wild_draw4' })).toBe('Jolly Pesca 4');
  });
});

describe('ASTRALIS v3 — Honest GUI Settings Subscription & Volume Sync', () => {
  beforeEach(() => {
    installMemoryStorage();
    resetAudioEngineForTests();
  });

  it('clamps out-of-range volume, syncs audio engine and notifies subscribers', () => {
    const seen: number[] = [];
    const unsub = subscribeSettings((s) => seen.push(s.audioVolume));

    const base = loadSettings();
    saveSettings({ ...base, audioVolume: 140, sfxEnabled: true });

    expect(loadSettings().audioVolume).toBe(100);
    expect(getAudioState().volumePercent).toBe(100);
    expect(getAudioState().effectiveGain).toBeCloseTo(0.75, 5);

    saveSettings({ ...base, audioVolume: -15, sfxEnabled: false });
    expect(loadSettings().audioVolume).toBe(0);
    expect(getAudioState().sfxEnabled).toBe(false);
    expect(getAudioState().effectiveGain).toBe(0);
    expect(seen).toEqual([100, 0]);

    unsub();
  });
});
