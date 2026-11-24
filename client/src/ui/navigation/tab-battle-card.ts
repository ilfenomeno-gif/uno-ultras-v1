// ============================================================
// UNO ULTRA Client — Battle Card Tab (Lv. 1..100 + 1000/1500/Unlock All)
// ============================================================

import {
  BATTLE_CARD_PRICE_BASE,
  BATTLE_CARD_PRICE_BUNDLE_20,
  BATTLE_CARD_REWARDS,
} from '@uno/shared';
import {
  buyBattleCard,
  claimBattleCardTier,
  fetchBattleCard,
  unlockAllBattleCard,
} from '../../net/tcp/rest-client.js';

export function createBattleCardView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section';

  let state = {
    tier: 'free' as 'free' | 'base' | 'bundle20',
    level: 1,
    xp: 0,
    claimedLevels: [] as string[],
  };

  const summary = document.createElement('div');
  summary.className = 'tab-status-bar glass-panel';
  const feedback = document.createElement('div');
  feedback.className = 'tab-feedback';
  const track = document.createElement('div');
  track.className = 'battle-card-track';

  const render = (): void => {
    summary.innerHTML = `
      <div>
        <strong>BATTLE CARD STAGIONE 1</strong> — Livello <b>${state.level}/100</b> (${state.xp}/1000 XP)
        · Stato: <span class="ultra-badge ultra-badge--gold">${state.tier.toUpperCase()}</span>
      </div>
      <div class="battle-actions"></div>
    `;
    const actionsEl = summary.querySelector('.battle-actions')!;

    if (state.tier === 'free') {
      const baseBtn = document.createElement('button');
      baseBtn.type = 'button';
      baseBtn.className = 'ultra-btn ultra-btn--primary';
      baseBtn.textContent = `Pass Base (${BATTLE_CARD_PRICE_BASE} V-Card)`;
      baseBtn.addEventListener('click', async () => {
        try {
          await buyBattleCard('base');
          state.tier = 'base';
          feedback.textContent = 'Battle Card Premium attivata!';
          render();
        } catch (err) {
          feedback.textContent = err instanceof Error ? err.message : 'Acquisto disponibile online con saldo sufficiente';
        }
      });

      const bundleBtn = document.createElement('button');
      bundleBtn.type = 'button';
      bundleBtn.className = 'ultra-btn ultra-btn--secondary';
      bundleBtn.textContent = `Bundle +20 Livelli (${BATTLE_CARD_PRICE_BUNDLE_20} V-Card)`;
      bundleBtn.addEventListener('click', async () => {
        try {
          await buyBattleCard('bundle20');
          state.tier = 'bundle20';
          state.level = Math.min(100, state.level + 20);
          feedback.textContent = 'Bundle +20 Livelli attivato!';
          render();
        } catch (err) {
          feedback.textContent = err instanceof Error ? err.message : 'Saldo insufficiente o offline';
        }
      });
      actionsEl.append(baseBtn, bundleBtn);
    }

    if (state.level < 100) {
      const unlockAllBtn = document.createElement('button');
      unlockAllBtn.type = 'button';
      unlockAllBtn.className = 'ultra-btn ultra-btn--ghost';
      unlockAllBtn.textContent = `Sblocca Tutto (${(100 - state.level) * 150} V-Card)`;
      unlockAllBtn.addEventListener('click', async () => {
        try {
          await unlockAllBattleCard();
          state.level = 100;
          feedback.textContent = 'Tutti i 100 livelli sbloccati!';
          render();
        } catch (err) {
          feedback.textContent = err instanceof Error ? err.message : 'V-Card insufficienti';
        }
      });
      actionsEl.appendChild(unlockAllBtn);
    }

    track.innerHTML = '';
    // Mostra livelli rilevanti con reward + milestone fino a 100
    const milestones = BATTLE_CARD_REWARDS.filter((r) => r.free !== null || r.premium !== null);
    for (const tier of milestones) {
      const card = document.createElement('article');
      card.className = `battle-tier-card glass-panel${state.level >= tier.level ? ' unlocked' : ''}`;
      card.innerHTML = `<h4>Livello ${tier.level}</h4>`;

      const addRewardRow = (kind: 'free' | 'premium', label: string): void => {
        const key = `${kind}:${tier.level}`;
        const row = document.createElement('div');
        row.className = 'battle-reward-row';
        const span = document.createElement('span');
        span.textContent = `[${kind.toUpperCase()}] ${label}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ultra-btn ultra-btn--primary';
        const canClaim =
          state.level >= tier.level &&
          (kind === 'free' || state.tier !== 'free') &&
          !state.claimedLevels.includes(key);
        btn.textContent = state.claimedLevels.includes(key) ? 'Riscattato' : 'Riscatta';
        btn.disabled = !canClaim;
        btn.addEventListener('click', async () => {
          try {
            await claimBattleCardTier(tier.level, kind);
            state.claimedLevels.push(key);
            feedback.textContent = `Riscattato ${label}!`;
            render();
          } catch (err) {
            feedback.textContent = err instanceof Error ? err.message : 'Errore riscatto';
          }
        });
        row.append(span, btn);
        card.appendChild(row);
      };

      if (tier.free) addRewardRow('free', tier.free.label);
      if (tier.premium) addRewardRow('premium', tier.premium.label);
      track.appendChild(card);
    }
  };

  render();
  void fetchBattleCard()
    .then((res) => {
      state = res.state;
      render();
    })
    .catch(() => {});

  root.append(summary, feedback, track);
  return root;
}
