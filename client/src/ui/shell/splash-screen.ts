// ============================================================
// UNO ULTRA Client — Splash Screen ("AVANZA")
// ============================================================

export function renderSplashScreen(onAdvance: () => void): HTMLElement {
  const section = document.createElement('section');
  section.className = 'splash-screen';

  section.innerHTML = `
    <div class="splash-brand">
      <span class="splash-eyebrow">Competitive Card Platform</span>
      <h1 class="splash-title">UNO <span>ULTRA</span></h1>
    </div>
    <button type="button" class="splash-avanza-btn" data-action="avanza">AVANZA</button>
    <p class="splash-hint">Premi AVANZA o INVIO per entrare in lobby</p>
  `;

  const btn = section.querySelector<HTMLButtonElement>('[data-action="avanza"]');
  btn?.addEventListener('click', onAdvance);

  return section;
}
