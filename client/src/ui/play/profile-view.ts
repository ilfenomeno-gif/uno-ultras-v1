// ============================================================
// UNO ULTRA Client — Public Player Profile Inspection Modal
// ============================================================

import { fetchPublicProfile } from '../../net/tcp/rest-client.js';

const PRESENCE_LABELS: Record<string, string> = {
  online: 'Online',
  ingame: 'In Partita',
  offline: 'Offline',
};

export function openProfileModal(username: string): void {
  const existing = document.querySelector('.profile-modal-backdrop');
  existing?.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'profile-modal-backdrop';
  backdrop.innerHTML = `
    <div class="profile-modal glass-panel" role="dialog" aria-modal="true" aria-label="Profilo Giocatore">
      <div class="profile-modal-header">
        <h3>${username}</h3>
        <button type="button" class="news-ticker-close" data-action="close">ESC ✕</button>
      </div>
      <div data-role="content" class="social-empty">Caricamento profilo…</div>
    </div>
  `;

  const close = (): void => {
    window.removeEventListener('keydown', onKey);
    backdrop.remove();
  };

  const onKey = (ev: KeyboardEvent): void => {
    if (ev.key === 'Escape') {
      ev.stopPropagation();
      close();
    }
  };

  window.addEventListener('keydown', onKey);
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) close();
  });
  backdrop.querySelector('[data-action="close"]')?.addEventListener('click', close);
  document.body.appendChild(backdrop);

  const content = backdrop.querySelector<HTMLElement>('[data-role="content"]')!;
  void fetchPublicProfile(username)
    .then((profile) => {
      const statusLabel = PRESENCE_LABELS[profile.presenceStatus] ?? 'Offline';
      const joinedDate = new Date(profile.createdAt).toLocaleDateString('it-IT');
      content.className = '';
      content.innerHTML = `
        <div class="social-row" style="margin-bottom: 0.75rem;">
          <div class="social-row-info">
            <span class="presence-dot ${profile.presenceStatus}"></span>
            <span>Stato: <strong>${statusLabel}</strong></span>
          </div>
          <span class="social-meta">Dal ${joinedDate}</span>
        </div>
        <div class="profile-stat-grid">
          <div class="profile-stat-box">
            <small>Rank</small>
            <strong>${profile.rank}</strong>
          </div>
          <div class="profile-stat-box">
            <small>MMR</small>
            <strong>${profile.mmr}</strong>
          </div>
          <div class="profile-stat-box">
            <small>Battle Card</small>
            <strong>Lv. ${profile.battleCardLevel}</strong>
          </div>
          <div class="profile-stat-box">
            <small>ID Giocatore</small>
            <strong>${profile.id.slice(0, 8)}…</strong>
          </div>
        </div>
      `;
    })
    .catch((err) => {
      content.className = 'social-feedback is-error';
      content.textContent =
        err instanceof Error ? err.message : 'Impossibile caricare il profilo';
    });
}
