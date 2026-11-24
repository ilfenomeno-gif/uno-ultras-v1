// ============================================================
// UNO ULTRA Client — Sfide Tab (Daily & Weekly Challenges)
// ============================================================

import { DAILY_CHALLENGES_POOL, WEEKLY_CHALLENGES_POOL } from '@uno/shared';
import { claimChallenge, fetchChallenges } from '../../net/tcp/rest-client.js';

export function createChallengesView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section';

  const header = document.createElement('div');
  header.className = 'tab-status-bar glass-panel';
  header.innerHTML = '<strong>SFIDE GIORNALIERE & SETTIMANALI</strong> — XP Battle Card + V-Card';

  const feedback = document.createElement('div');
  feedback.className = 'tab-feedback';

  const grid = document.createElement('div');
  grid.className = 'shop-grid';

  let list = [...DAILY_CHALLENGES_POOL, ...WEEKLY_CHALLENGES_POOL].map((def) => ({
    definition: def,
    progress: 0,
    claimed: false,
  }));

  const render = (): void => {
    grid.innerHTML = '';
    for (const item of list) {
      const def = item.definition;
      const pct = Math.min(100, Math.round((item.progress / def.target) * 100));
      const card = document.createElement('article');
      card.className = 'ultra-card glass-panel';
      card.innerHTML = `
        <div class="card-top-row">
          <span class="ultra-badge">${def.period === 'daily' ? 'GIORNALIERA' : 'SETTIMANALE'}</span>
          <span class="ultra-badge ultra-badge--gold">+${def.rewardVCard} V-Card / +${def.rewardXp} XP</span>
        </div>
        <h3>${def.title}</h3>
        <p>${def.description}</p>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-label">${item.progress}/${def.target}</div>
      `;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ultra-btn ultra-btn--primary';
      btn.textContent = item.claimed ? 'Riscattata' : 'Riscatta';
      btn.disabled = item.claimed || item.progress < def.target;
      btn.addEventListener('click', async () => {
        try {
          await claimChallenge(def.id);
          item.claimed = true;
          feedback.textContent = `Ricompensa ${def.title} riscattata!`;
          render();
        } catch (err) {
          feedback.textContent = err instanceof Error ? err.message : 'Sfida non completata';
        }
      });
      card.appendChild(btn);
      grid.appendChild(card);
    }
  };

  render();
  void fetchChallenges()
    .then((res) => {
      list = res.challenges.map((c) => ({
        definition: { ...c.definition, metric: 'matches_played' as const },
        progress: c.progress,
        claimed: c.claimed,
      }));
      render();
    })
    .catch(() => {});

  root.append(header, feedback, grid);
  return root;
}
