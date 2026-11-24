// ============================================================
// UNO ULTRA Client — Neon Glow & Route Transitions FX Helpers
// ============================================================

export function applyNeonPulse(element: HTMLElement, accentHex = '#00f0ff'): void {
  element.style.boxShadow = `0 0 18px ${accentHex}44, inset 0 0 12px ${accentHex}22`;
}

export function clearNeonPulse(element: HTMLElement): void {
  element.style.boxShadow = '';
}
