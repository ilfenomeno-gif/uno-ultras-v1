// ============================================================
// UNO ULTRA Client — Sfide Tab (Daily, Weekly, Seasonal + Banner)
// ============================================================

import {
  DAILY_CHALLENGES_POOL,
  SEASONAL_CHALLENGES_POOL,
  WEEKLY_CHALLENGES_POOL,
  type ChallengePeriod,
} from '@uno/shared';
import { announce } from '../../core/aria-live.js';
import { playEarcon } from '../../core/audio-earcons.js';
import { computeSafeLoopIndex, hasBlockedModifier } from '../../core/keyboard-nav.js';
import { claimChallenge, fetchChallenges } from '../../net/tcp/rest-client.js';
import { getEconomySnapshot, setEconomySnapshot } from '../../state/inventory-store.js';
import { patchProfile } from '../../state/profile-store.js';
import {
  CHALLENGE_TABS,
  computeChallengePercent,
  filterChallengesByPeriod,
  getChallengeClaimState,
  type ChallengeViewItem,
} from './challenges-helpers.js';

const PERIOD_BADGE_LABELS: Readonly<Record<ChallengePeriod, string>> = {
  daily: 'GIORNALIERA',
  weekly: 'SETTIMANALE',
  seasonal: 'STAGIONALE',
};

export function createChallengesView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section challenges-stage';
  root.setAttribute('aria-label', 'Sfide Stagione 1');

  let activePeriod: ChallengePeriod = 'daily';
  let claimingId: string | null = null;
  let statusText = '';

  let list: ChallengeViewItem[] = [
    ...DAILY_CHALLENGES_POOL,
    ...WEEKLY_CHALLENGES_POOL,
    ...SEASONAL_CHALLENGES_POOL,
  ].map((def) => ({
    definition: def,
    progress: 0,
    claimed: false,
  }));

  const seasonBanner = document.createElement('header');
  seasonBanner.className = 'challenges-season-banner';

  const filterBar = document.createElement('div');
  filterBar.className = 'challenges-filter-bar';
  filterBar.setAttribute('role', 'tablist');
  filterBar.setAttribute('aria-label', 'Filtri temporali sfide');

  const feedback = document.createElement('div');
  feedback.className = 'tab-feedback challenges-feedback';

  const grid = document.createElement('div');
  grid.className = 'challenges-grid';

  const renderBanner = (): void => {
    seasonBanner.innerHTML = '';

    const left = document.createElement('div');
    left.className = 'challenges-banner-copy';

    const tag = document.createElement('span');
    tag.className = 'challenges-season-tag';
    tag.textContent = 'STAGIONE 1 ATTIVA';

    const title = document.createElement('h2');
    title.className = 'challenges-banner-title';
    title.textContent =
      'Scala la classifica fino a Supersonic Legend (1600+ MMR)!';

    const sub = document.createElement('p');
    sub.className = 'challenges-banner-sub';
    sub.textContent =
      'Completa le missioni per accumulare XP Battle Card (Lv. 1–100) e V-Card per il Negozio Cosmetico.';

    left.append(tag, title, sub);

    const completedCount = list.filter(
      (i) => i.claimed || i.progress >= i.definition.target
    ).length;
    const readyCount = list.filter(
      (i) => !i.claimed && i.progress >= i.definition.target
    ).length;

    const right = document.createElement('div');
    right.className = 'challenges-banner-stats';

    const donePill = document.createElement('span');
    donePill.className = 'shop-currency-badge shop-currency-badge--tournament';
    donePill.textContent = `${completedCount}/${list.length} Completate`;
    right.appendChild(donePill);

    if (readyCount > 0) {
      const readyPill = document.createElement('span');
      readyPill.className = 'shop-currency-badge shop-currency-badge--vcard';
      readyPill.textContent = `${readyCount} da riscattare`;
      right.appendChild(readyPill);
    }

    seasonBanner.append(left, right);
  };

  const renderTabs = (focusActive = false): void => {
    filterBar.innerHTML = '';

    for (const tab of CHALLENGE_TABS) {
      const tabItems = filterChallengesByPeriod(list, tab.id);
      const claimableInTab = tabItems.filter(
        (i) => !i.claimed && i.progress >= i.definition.target
      ).length;
      const isSelected = tab.id === activePeriod;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `challenges-tab-btn${isSelected ? ' active' : ''}`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(isSelected));
      btn.tabIndex = isSelected ? 0 : -1;

      const lbl = document.createElement('span');
      lbl.textContent = `${tab.label} (${tabItems.length})`;
      btn.appendChild(lbl);

      if (claimableInTab > 0) {
        const dot = document.createElement('span');
        dot.className = 'challenges-tab-ready';
        dot.textContent = `+${claimableInTab}`;
        btn.appendChild(dot);
      }

      btn.addEventListener('click', () => {
        if (activePeriod === tab.id) return;
        activePeriod = tab.id;
        playEarcon('nav');
        announce(`Sfide ${tab.label}`, 'polite');
        render(true);
      });

      filterBar.appendChild(btn);
      if (focusActive && isSelected) {
        btn.focus();
      }
    }
  };

  const renderCards = (): void => {
    grid.innerHTML = '';
    const filtered = filterChallengesByPeriod(list, activePeriod);
    const tabMeta = CHALLENGE_TABS.find((t) => t.id === activePeriod);

    for (const item of filtered) {
      const def = item.definition;
      const pct = computeChallengePercent(item.progress, def.target);
      const claimState = getChallengeClaimState(item);
      const isBusy = claimingId === def.id;

      const card = document.createElement('article');
      card.className = `challenge-card challenge-card--${def.period}${
        claimState.status === 'claimable' ? ' is-ready' : ''
      }${claimState.status === 'claimed' ? ' is-claimed' : ''}`;

      const topRow = document.createElement('div');
      topRow.className = 'challenge-card-top';

      const periodBadge = document.createElement('span');
      periodBadge.className = `challenge-period-pill challenge-period-pill--${def.period}`;
      periodBadge.textContent = PERIOD_BADGE_LABELS[def.period];

      const resetSpan = document.createElement('span');
      resetSpan.className = 'challenge-reset-hint';
      resetSpan.textContent = tabMeta?.resetHint ?? '';
      topRow.append(periodBadge, resetSpan);

      const title = document.createElement('h3');
      title.className = 'challenge-title';
      title.textContent = def.title;

      const desc = document.createElement('p');
      desc.className = 'challenge-desc';
      desc.textContent = def.description;

      const progressWrap = document.createElement('div');
      progressWrap.className = 'challenge-progress-wrap';

      const progressHead = document.createElement('div');
      progressHead.className = 'challenge-progress-meta';
      const progressText = document.createElement('span');
      progressText.textContent = `${Math.min(item.progress, def.target)} / ${def.target}`;
      const pctText = document.createElement('strong');
      pctText.textContent = `${pct}%`;
      progressHead.append(progressText, pctText);

      const track = document.createElement('div');
      track.className = 'challenge-progress-track';
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', String(def.target));
      track.setAttribute('aria-valuenow', String(Math.min(item.progress, def.target)));
      const fill = document.createElement('div');
      fill.className = 'challenge-progress-fill';
      fill.style.width = `${pct}%`;
      track.appendChild(fill);
      progressWrap.append(progressHead, track);

      const footer = document.createElement('div');
      footer.className = 'challenge-card-footer';

      const rewards = document.createElement('div');
      rewards.className = 'challenge-rewards';

      const xpChip = document.createElement('span');
      xpChip.className = 'challenge-reward challenge-reward--xp';
      xpChip.textContent = `+${def.rewardXp} XP`;

      const vcardChip = document.createElement('span');
      vcardChip.className = 'challenge-reward challenge-reward--vcard';
      vcardChip.textContent = `+${def.rewardVCard} V-Card`;

      rewards.append(xpChip, vcardChip);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `challenge-claim-btn challenge-claim-btn--${claimState.status}`;
      btn.textContent = isBusy ? 'Riscatto…' : claimState.label;
      btn.setAttribute(
        'aria-label',
        `${def.title}: ${claimState.label}, +${def.rewardXp} XP e +${def.rewardVCard} V-Card`
      );
      if (!claimState.actionable || isBusy) {
        btn.setAttribute('aria-disabled', 'true');
      }

      btn.addEventListener('click', async () => {
        if (isBusy) return;
        if (!claimState.actionable) {
          playEarcon(claimState.status === 'claimed' ? 'nav' : 'error');
          const msg =
            claimState.status === 'claimed'
              ? `${def.title} già riscattata`
              : `Completa prima la sfida (${item.progress}/${def.target})`;
          statusText = msg;
          feedback.textContent = msg;
          announce(msg, claimState.status === 'claimed' ? 'polite' : 'assertive');
          return;
        }
        claimingId = def.id;
        render();
        try {
          const res = await claimChallenge(def.id);
          item.claimed = true;
          const cur = getEconomySnapshot();
          setEconomySnapshot({ ...cur, vcard: res.vcardAfter });
          patchProfile({ vcard: res.vcardAfter });
          statusText = `Ricompensa ${def.title} riscattata! (+${def.rewardXp} XP, +${def.rewardVCard} V-Card)`;
          playEarcon('win');
          announce(statusText, 'polite');
        } catch (err) {
          statusText =
            err instanceof Error ? err.message : 'Sfida non completata';
          playEarcon('error');
          announce(statusText, 'assertive');
        } finally {
          claimingId = null;
          render();
        }
      });

      footer.append(rewards, btn);
      card.append(topRow, title, desc, progressWrap, footer);
      grid.appendChild(card);
    }
  };

  const render = (focusActiveTab = false): void => {
    renderBanner();
    renderTabs(focusActiveTab);
    feedback.textContent = statusText;
    renderCards();
  };

  filterBar.addEventListener('keydown', (ev) => {
    if (hasBlockedModifier(ev)) return;
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    ev.preventDefault();
    const curIdx = CHALLENGE_TABS.findIndex((t) => t.id === activePeriod);
    const delta = ev.key === 'ArrowRight' ? 1 : -1;
    const { index, wrapped } = computeSafeLoopIndex(
      curIdx,
      delta,
      CHALLENGE_TABS.length
    );
    const nextTab = CHALLENGE_TABS[index];
    if (nextTab) {
      activePeriod = nextTab.id;
      playEarcon(wrapped ? 'boundary' : 'nav');
      announce(`Sfide ${nextTab.label}`, 'polite');
      render(true);
    }
  });

  render();

  void fetchChallenges()
    .then((res) => {
      if (res.challenges.length > 0) {
        list = res.challenges.map((c) => ({
          definition: { ...c.definition, metric: 'matches_played' as const },
          progress: c.progress,
          claimed: c.claimed,
        }));
        render();
      }
    })
    .catch(() => {});

  root.append(seasonBanner, filterBar, feedback, grid);
  return root;
}
