// ============================================================
// UNO ULTRA Client — 3D Rotating Card Showcase (CSS rotateY)
// ============================================================

export function createCard3DSpinner(): HTMLElement {
  const stage = document.createElement('div');
  stage.className = 'card-3d-stage';
  stage.setAttribute('aria-label', 'Carta UNO ULTRA 3D');

  stage.innerHTML = `
    <div class="card-3d-body">
      <div class="card-3d-face card-3d-front">
        <div class="card-3d-oval">
          <span class="card-3d-label">UNO</span>
        </div>
      </div>
      <div class="card-3d-face card-3d-back">
        <div class="card-3d-oval">
          <span class="card-3d-label">ULTRA</span>
        </div>
      </div>
    </div>
  `;

  return stage;
}
