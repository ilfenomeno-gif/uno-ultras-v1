// ============================================================
// UNO ULTRA Client — Smooth View Transition Utility
// ============================================================

export function fadeInElement(el: HTMLElement, durationMs = 220): void {
  if (typeof el.animate !== 'function') return;
  el.animate(
    [
      { opacity: '0', transform: 'translateY(8px)' },
      { opacity: '1', transform: 'translateY(0)' },
    ],
    { duration: durationMs, easing: 'ease-out', fill: 'forwards' },
  );
}
