// ============================================================
// UNO ULTRA Client — Carriera Tab (MMR Progression, Top 100, Stats, Replay)
// ============================================================

import { getRankInfo } from '@uno/shared';
import {
  fetchCareerSummary,
  fetchMatchReplay,
  fetchTopLeaderboard,
} from '../../net/tcp/rest-client.js';
import { getProfile } from '../../state/profile-store.js';
import { openModal } from '../components/modal.js';
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
  const defaultCard = document.createElement('article');
  defaultCard.className = 'ultra-card glass-panel';
  const dTitle = document.createElement('h3');
  dTitle.textContent = 'UNO Classic & Trofei';
  const dSub = document.createElement('p');
  dSub.textContent = 'Trofei sbloccati e storico partite autoritative.';
  const dBadge = document.createElement('div');
  dBadge.className = 'ultra-badge';
  dBadge.textContent = `Rank Attuale: ${rankInfo.tier}`;
  defaultCard.append(dTitle, dSub, dBadge);
  statsBox.appendChild(defaultCard);

  const recentBox = document.createElement('div');
  recentBox.className = 'shop-grid';

  const openReplayViewer = (matchId: string, events: readonly Record<string, unknown>[]): void => {
    let stepIdx = 0;
    const body = document.createElement('div');
    const stepText = document.createElement('pre');
    stepText.className = 'lab-json-preview';
    const navRow = document.createElement('div');
    navRow.className = 'battle-actions';
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'ultra-btn ultra-btn--ghost';
    prevBtn.textContent = 'Precedente';
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'ultra-btn ultra-btn--primary';
    nextBtn.textContent = 'Successivo';
    const syncStep = (): void => {
      stepText.textContent =
        events.length === 0
          ? 'Nessun evento registrato per questo replay.'
          : `Mossa ${stepIdx + 1}/${events.length}\n${JSON.stringify(events[stepIdx], null, 2)}`;
      prevBtn.disabled = stepIdx <= 0;
      nextBtn.disabled = stepIdx >= events.length - 1;
    };
    prevBtn.addEventListener('click', () => {
      if (stepIdx > 0) {
        stepIdx -= 1;
        syncStep();
      }
    });
    nextBtn.addEventListener('click', () => {
      if (stepIdx < events.length - 1) {
        stepIdx += 1;
        syncStep();
      }
    });
    navRow.append(prevBtn, nextBtn);
    body.append(stepText, navRow);
    syncStep();
    openModal({ title: `Replay Partita ${matchId.slice(0, 8)}`, body });
  };

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
      if (res.modeStats.length > 0) {
        statsBox.innerHTML = '';
        for (const st of res.modeStats) {
          const card = document.createElement('article');
          card.className = 'ultra-card glass-panel';
          const h3 = document.createElement('h3');
          h3.textContent = st.mode.toUpperCase();
          const p = document.createElement('p');
          p.textContent = `${st.matchesPlayed} partite · ${st.wins} vittorie (${st.winRate}%)`;
          const badge = document.createElement('span');
          badge.className = 'ultra-badge ultra-badge--gold';
          badge.textContent = `Miglior Serie: ${st.bestStreak}`;
          card.append(h3, p, badge);
          statsBox.appendChild(card);
        }
      }
      if (res.recentMatches.length > 0) {
        recentBox.innerHTML = '';
        for (const rm of res.recentMatches.slice(0, 6)) {
          const mc = document.createElement('article');
          mc.className = 'ultra-card glass-panel';
          const mh3 = document.createElement('h4');
          mh3.textContent = `${rm.mode.toUpperCase()} (#${rm.placement})`;
          const mp = document.createElement('p');
          mp.textContent = `${rm.isRanked ? 'Ranked' : 'Casual'} · MMR ${rm.mmrDelta >= 0 ? `+${rm.mmrDelta}` : rm.mmrDelta} · +${rm.vcardEarned} V-Card`;
          const rBtn = document.createElement('button');
          rBtn.type = 'button';
          rBtn.className = 'ultra-btn ultra-btn--ghost';
          rBtn.textContent = 'Apri Replay';
          rBtn.addEventListener('click', () => {
            void fetchMatchReplay(rm.matchId)
              .then((rp) => openReplayViewer(rm.matchId, rp.events))
              .catch(() => openReplayViewer(rm.matchId, []));
          });
          mc.append(mh3, mp, rBtn);
          recentBox.appendChild(mc);
        }
      }
    })
    .catch(() => {});

  root.append(summary, statsBox, recentBox, boardHeading, boardContainer);
  return root;
}
