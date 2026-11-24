// ============================================================
// UNO ULTRA Client — Carriera Tab (MMR Progression, Top 100, Stats, Replay)
// ============================================================

import { getRankInfo } from '@uno/shared';
import {
  fetchCareerSummary,
  fetchTopLeaderboard,
} from '../../net/tcp/rest-client.js';
import { getProfile } from '../../state/profile-store.js';
import { renderChallengerList, type ChallengerEntry } from '../tournament/challenger-list.js';

export function createCareerView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section';

  const profile = getProfile();
  const mmr = profile?.mmr ?? 0;
  const rankInfo = getRankInfo(mmr);
  const nextThreshold = rankInfo.maxMMR !== null ? rankInfo.maxMMR + 1 : null;
  const mmrToNextTier = nextThreshold !== null ? Math.max(0, nextThreshold - mmr) : 0;
  const span = nextThreshold !== null ? Math.max(1, nextThreshold - rankInfo.minMMR) : 1;
  const progressPercent =
    nextThreshold !== null
      ? Math.min(100, Math.max(0, Math.round(((mmr - rankInfo.minMMR) / span) * 100)))
      : 100;

  const summary = document.createElement('div');
  summary.className = 'tab-status-bar glass-panel';
  const sumLeft = document.createElement('div');
  const sumTitle = document.createElement('strong');
  sumTitle.textContent = 'CARRIERA GIOCATORE';
  const sumTier = document.createElement('b');
  sumTier.style.color = rankInfo.colorHex;
  sumTier.textContent = rankInfo.tier;
  sumLeft.append(
    sumTitle,
    document.createTextNode(' — Tier '),
    sumTier,
    document.createTextNode(` (${mmr} MMR · ${progressPercent}% verso il prossimo grado)`),
  );
  const sumRight = document.createElement('div');
  sumRight.className = 'wallet-pills';
  const sumBadge = document.createElement('span');
  sumBadge.className = 'ultra-badge ultra-badge--info';
  sumBadge.textContent =
    mmrToNextTier > 0 ? `${mmrToNextTier} MMR al prossimo tier` : 'APEX SSL';
  sumRight.appendChild(sumBadge);
  summary.append(sumLeft, sumRight);

  const statsBox = document.createElement('div');
  statsBox.className = 'shop-grid';
  statsBox.innerHTML = `
    <article class="ultra-card glass-panel">
      <h3>UNO Classic</h3>
      <p>Vittorie e serie attive registrate sul server autoritativo.</p>
      <div class="ultra-badge">Rank Attuale: ${rankInfo.tier}</div>
    </article>
  `;

  const boardHeading = document.createElement('h3');
  boardHeading.textContent = 'Classifica Top 100 Globale';
  const boardContainer = document.createElement('div');
  const fallbackBoard: ChallengerEntry[] = [
    {
      rank: 1,
      username: profile?.username ?? 'Player',
      mmr,
      rankTier: rankInfo.tier,
    },
  ];
  boardContainer.appendChild(renderChallengerList(fallbackBoard));

  void fetchTopLeaderboard(100)
    .then((res) => {
      if (res.entries.length > 0) {
        boardContainer.innerHTML = '';
        boardContainer.appendChild(renderChallengerList(res.entries));
      }
    })
    .catch(() => {});

  void fetchCareerSummary()
    .then((res) => {
      if (res.modeStats.length === 0 && res.recentMatches.length === 0) return;
      statsBox.innerHTML = '';
      for (const st of res.modeStats) {
        const card = document.createElement('article');
        card.className = 'ultra-card glass-panel';
        card.innerHTML = `
          <h3>${st.mode.toUpperCase()}</h3>
          <p>${st.matchesPlayed} partite · ${st.wins} vittorie (${st.winRate}%)</p>
          <span class="ultra-badge ultra-badge--gold">Miglior Serie: ${st.bestStreak}</span>
        `;
        statsBox.appendChild(card);
      }
    })
    .catch(() => {});

  root.append(summary, statsBox, boardHeading, boardContainer);
  return root;
}
