// ============================================================
// UNO ULTRA Client — Single-Voice-Authority (AriaLiveOrchestrator)
// ASTRALIS v3: Centralized ARIA live regions + Purge-on-Close
// ============================================================

import { clearAudioDucking, duckAudio } from './audio-earcons.js';

export type AnnouncementPriority = 'polite' | 'assertive';

export interface AnnouncementRecord {
  readonly message: string;
  readonly priority: AnnouncementPriority;
}

const MAX_HISTORY = 20;

let politeRegion: HTMLElement | null = null;
let assertiveRegion: HTMLElement | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let lastAnnouncement: AnnouncementRecord | null = null;
const history: AnnouncementRecord[] = [];

function ensureLiveRegion(priority: AnnouncementPriority): HTMLElement | null {
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }
  const existing = priority === 'assertive' ? assertiveRegion : politeRegion;
  if (existing && existing.isConnected) {
    return existing;
  }

  const el = document.createElement('div');
  el.className = 'sr-only';
  el.dataset['astralisLive'] = priority;
  el.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
  el.setAttribute('aria-live', priority);
  el.setAttribute('aria-atomic', 'true');
  document.body.appendChild(el);

  if (priority === 'assertive') {
    assertiveRegion = el;
  } else {
    politeRegion = el;
  }
  return el;
}

/** Announces a single authoritative message and ducks SFX on urgent alerts. */
export function announce(
  message: string,
  priority: AnnouncementPriority = 'polite'
): void {
  const trimmed = message.trim();
  if (!trimmed) {
    return;
  }

  const record: AnnouncementRecord = { message: trimmed, priority };
  lastAnnouncement = record;
  history.push(record);
  if (history.length > MAX_HISTORY) {
    history.shift();
  }

  if (priority === 'assertive') {
    duckAudio(650);
  }

  const target = ensureLiveRegion(priority);
  if (!target) {
    return;
  }

  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  // Clear first so identical consecutive messages still trigger screen readers
  target.textContent = '';
  flushTimer = setTimeout(() => {
    flushTimer = null;
    if (target.isConnected) {
      target.textContent = trimmed;
    }
  }, 16);
}

/** Immediately silences queued announcements and clears live regions on close/nav. */
export function purgeOnClose(): void {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  clearAudioDucking();
  if (politeRegion) {
    politeRegion.textContent = '';
  }
  if (assertiveRegion) {
    assertiveRegion.textContent = '';
  }
  lastAnnouncement = null;
}

export function getLastAnnouncement(): AnnouncementRecord | null {
  return lastAnnouncement;
}

export function getAnnouncementHistory(): readonly AnnouncementRecord[] {
  return [...history];
}

export function resetAriaLiveForTests(): void {
  purgeOnClose();
  history.length = 0;
  politeRegion?.remove();
  assertiveRegion?.remove();
  politeRegion = null;
  assertiveRegion = null;
}
