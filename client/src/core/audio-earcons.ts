// ============================================================
// UNO ULTRA Client — Procedural In-Memory Earcons (ASTRALIS v3)
// Safety Ceiling: 0.75 (-2.5 dB) + Dynamic Ducking (45%)
// ============================================================

export const SAFETY_MAX_GAIN = 0.75;
export const DUCKING_FACTOR = 0.45;

export type EarconKind =
  | 'nav'
  | 'confirm'
  | 'play_card'
  | 'draw'
  | 'turn_start'
  | 'uno'
  | 'error'
  | 'boundary'
  | 'win'
  | 'modal_open'
  | 'modal_close';

export interface AudioEngineState {
  readonly volumePercent: number;
  readonly sfxEnabled: boolean;
  readonly ducked: boolean;
  readonly effectiveGain: number;
}

interface ToneStep {
  readonly freq: number;
  readonly durationSec: number;
  readonly offsetSec: number;
  readonly type: OscillatorType;
  readonly weight?: number;
}

interface WindowWithWebkitAudio {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

const EARCON_PROGRAMS: Record<EarconKind, readonly ToneStep[]> = {
  nav: [{ freq: 660, durationSec: 0.05, offsetSec: 0, type: 'sine', weight: 0.55 }],
  confirm: [
    { freq: 520, durationSec: 0.06, offsetSec: 0, type: 'triangle', weight: 0.7 },
    { freq: 780, durationSec: 0.09, offsetSec: 0.055, type: 'triangle', weight: 0.75 },
  ],
  play_card: [
    { freq: 440, durationSec: 0.06, offsetSec: 0, type: 'triangle', weight: 0.75 },
    { freq: 587.33, durationSec: 0.08, offsetSec: 0.045, type: 'triangle', weight: 0.7 },
  ],
  draw: [
    { freq: 330, durationSec: 0.06, offsetSec: 0, type: 'sine', weight: 0.65 },
    { freq: 392, durationSec: 0.07, offsetSec: 0.05, type: 'sine', weight: 0.65 },
  ],
  turn_start: [
    { freq: 523.25, durationSec: 0.07, offsetSec: 0, type: 'triangle', weight: 0.7 },
    { freq: 659.25, durationSec: 0.07, offsetSec: 0.065, type: 'triangle', weight: 0.75 },
    { freq: 783.99, durationSec: 0.11, offsetSec: 0.13, type: 'triangle', weight: 0.8 },
  ],
  uno: [
    { freq: 880, durationSec: 0.08, offsetSec: 0, type: 'triangle', weight: 0.85 },
    { freq: 1046.5, durationSec: 0.14, offsetSec: 0.085, type: 'triangle', weight: 0.9 },
  ],
  error: [
    { freq: 220, durationSec: 0.08, offsetSec: 0, type: 'sawtooth', weight: 0.5 },
    { freq: 164.81, durationSec: 0.12, offsetSec: 0.075, type: 'sawtooth', weight: 0.45 },
  ],
  boundary: [{ freq: 280, durationSec: 0.05, offsetSec: 0, type: 'sine', weight: 0.5 }],
  win: [
    { freq: 523.25, durationSec: 0.08, offsetSec: 0, type: 'triangle', weight: 0.75 },
    { freq: 659.25, durationSec: 0.08, offsetSec: 0.075, type: 'triangle', weight: 0.75 },
    { freq: 783.99, durationSec: 0.08, offsetSec: 0.15, type: 'triangle', weight: 0.8 },
    { freq: 1046.5, durationSec: 0.18, offsetSec: 0.225, type: 'triangle', weight: 0.9 },
  ],
  modal_open: [
    { freq: 480, durationSec: 0.055, offsetSec: 0, type: 'sine', weight: 0.6 },
    { freq: 620, durationSec: 0.075, offsetSec: 0.05, type: 'sine', weight: 0.65 },
  ],
  modal_close: [
    { freq: 520, durationSec: 0.05, offsetSec: 0, type: 'sine', weight: 0.55 },
    { freq: 360, durationSec: 0.07, offsetSec: 0.045, type: 'sine', weight: 0.5 },
  ],
};

let volumePercent = 75;
let sfxEnabled = true;
let ducked = false;
let duckTimer: ReturnType<typeof setTimeout> | null = null;
let sharedCtx: AudioContext | null = null;

/** Computes normalized audio gain clamped strictly to SAFETY_MAX_GAIN (0.75). */
export function computeEffectiveGain(
  volPercent: number,
  enabled: boolean,
  isDucked: boolean
): number {
  if (!enabled || !Number.isFinite(volPercent) || volPercent <= 0) {
    return 0;
  }
  const clampedVol = Math.min(100, Math.max(0, volPercent));
  const raw = (clampedVol / 100) * SAFETY_MAX_GAIN;
  const attenuated = isDucked ? raw * DUCKING_FACTOR : raw;
  return Math.min(SAFETY_MAX_GAIN, Math.max(0, attenuated));
}

export function syncAudioSettings(volPercent: number, enabled: boolean): void {
  const safeVol = Number.isFinite(volPercent)
    ? Math.min(100, Math.max(0, Math.round(volPercent)))
    : 75;
  volumePercent = safeVol;
  sfxEnabled = enabled;
}

export function getAudioState(): AudioEngineState {
  return {
    volumePercent,
    sfxEnabled,
    ducked,
    effectiveGain: computeEffectiveGain(volumePercent, sfxEnabled, ducked),
  };
}

export function clearAudioDucking(): void {
  if (duckTimer !== null) {
    clearTimeout(duckTimer);
    duckTimer = null;
  }
  ducked = false;
}

export function duckAudio(durationMs = 650): void {
  if (duckTimer !== null) {
    clearTimeout(duckTimer);
    duckTimer = null;
  }
  ducked = true;
  if (durationMs > 0) {
    duckTimer = setTimeout(() => {
      ducked = false;
      duckTimer = null;
    }, durationMs);
  }
}

function resolveAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (sharedCtx && sharedCtx.state !== 'closed') {
    return sharedCtx;
  }
  const w = window as unknown as WindowWithWebkitAudio;
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (typeof Ctor !== 'function') {
    return null;
  }
  sharedCtx = new Ctor();
  return sharedCtx;
}

export function playEarcon(kind: EarconKind): void {
  const gainValue = computeEffectiveGain(volumePercent, sfxEnabled, ducked);
  if (gainValue <= 0) {
    return;
  }
  try {
    const ctx = resolveAudioContext();
    if (!ctx) {
      return;
    }
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }
    const baseTime = ctx.currentTime + 0.005;
    const steps = EARCON_PROGRAMS[kind];

    for (const step of steps) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = baseTime + step.offsetSec;
      const stop = start + step.durationSec;
      const peak = Math.min(SAFETY_MAX_GAIN, gainValue * (step.weight ?? 0.75));

      osc.type = step.type;
      osc.frequency.setValueAtTime(step.freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(Math.max(0.0002, peak), start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, stop);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(stop + 0.01);
    }
  } catch {
    // Graceful no-op in headless environments or locked autoplay contexts
  }
}

export function resetAudioEngineForTests(): void {
  clearAudioDucking();
  volumePercent = 75;
  sfxEnabled = true;
  if (sharedCtx) {
    try {
      void sharedCtx.close();
    } catch {
      // ignore
    }
    sharedCtx = null;
  }
}
