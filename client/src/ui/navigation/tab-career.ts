// ============================================================
// UNO ULTRA Client — 3-Column Carriera Dashboard (Cosmetics, KPIs, History)
// ============================================================

import {
  CATALOG_BY_ID,
  getRankInfo,
  LEGACY_TITLES_BY_ID,
  SSL_MMR_THRESHOLD,
  type PlaylistRankEntry,
} from '@uno/shared';
import { announce } from '../../core/aria-live.js';
import { playEarcon } from '../../core/audio-earcons.js';
import {
  fetchCareerSummary,
  fetchChallenges,
  fetchInventory,
  fetchMatchReplay,
  fetchProgressionSnapshot,
} from '../../net/tcp/rest-client.js';
import {
  getEconomySnapshot,
  setEconomySnapshot,
} from '../../state/inventory-store.js';
import { getProfile } from '../../state/profile-store.js';
import { openModal } from '../components/modal.js';
import { getShopItemArtworkSvg } from './shop-artworks.js';
import {
  aggregateCareerStats,
  computeSslProgressPercent,
  formatMatchOutcome,
  formatMmrDelta,
  resolveCareerFrameClass,
  type CareerModeStat,
} from './career-helpers.js';

interface RecentMatchItem {
  readonly matchId: string;
  readonly mode: string;
  readonly variant: string;
  readonly isRanked: boolean;
  readonly placement: number;
  readonly mmrDelta: number;
  readonly vcardEarned: number;
}

const SPECIAL_CHALLENGE_IDS = new Set([
  'daily_uno_2',
  'weekly_stacks_8',
  'seasonal_stacks_35',
]);

export function createCareerView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section career-stage';
  root.setAttribute('aria-label', 'Carriera Competitiva UNO ULTRA');

  const profile = getProfile();
  const username = profile?.username ?? 'Contendente';
  const mmr = profile?.mmr ?? 0;
  const rankInfo = getRankInfo(mmr);
  const nextThreshold = rankInfo.maxMMR !== null ? rankInfo.maxMMR + 1 : null;
  const mmrToNextTier = nextThreshold !== null ? Math.max(0, nextThreshold - mmr) : 0;
  const tierSpan =
    nextThreshold !== null ? Math.max(1, nextThreshold - rankInfo.minMMR) : 1;
  const tierPercent =
    nextThreshold !== null
      ? Math.min(100, Math.max(0, Math.round(((mmr - rankInfo.minMMR) / tierSpan) * 100)))
      : 100;
  const sslPercent = computeSslProgressPercent(mmr);

  let modeStats: CareerModeStat[] = [];
  let recentMatches: RecentMatchItem[] = [];
  let specialCardsPlayed = 0;
  let playlistRanks: Readonly<Record<string, PlaylistRankEntry>> = profile?.playlistRanks ?? {};

  const layout = document.createElement('div');
  layout.className = 'career-layout';

  const profileCol = document.createElement('aside');
  profileCol.className = 'career-profile-col';

  const statsCol = document.createElement('div');
  statsCol.className = 'career-stats-col';

  const historyCol = document.createElement('div');
  historyCol.className = 'career-history-col';

  layout.append(profileCol, statsCol, historyCol);

  const openReplayViewer = (
    matchId: string,
    events: readonly Record<string, unknown>[]
  ): void => {
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

  const renderProfile = (): void => {
    profileCol.innerHTML = '';
    const { loadout } = getEconomySnapshot();
    const avatarMeta = CATALOG_BY_ID[loadout.avatar];
    const frameMeta = CATALOG_BY_ID[loadout.frame];
    const titleMeta = CATALOG_BY_ID[loadout.title];
    const legacyTitleMeta = LEGACY_TITLES_BY_ID[loadout.title];

    const avatarFrame = document.createElement('div');
    avatarFrame.className = `career-avatar-frame ${resolveCareerFrameClass(loadout.frame)}`;
    avatarFrame.innerHTML = getShopItemArtworkSvg(loadout.avatar, 'avatar');

    const identity = document.createElement('div');
    identity.className = 'career-identity';

    const nameEl = document.createElement('h2');
    nameEl.className = 'career-username';
    nameEl.textContent = username;

    const titlePill = document.createElement('span');
    titlePill.className = 'career-title-pill';
    titlePill.textContent =
      titleMeta?.name ?? legacyTitleMeta?.name ?? 'Contendente UNO ULTRA';
    if (legacyTitleMeta?.color) {
      titlePill.style.color = legacyTitleMeta.color;
      titlePill.style.borderColor = legacyTitleMeta.color;
    }

    const cosmeticMeta = document.createElement('span');
    cosmeticMeta.className = 'career-cosmetic-sub';
    cosmeticMeta.textContent = `${avatarMeta?.name ?? 'Avatar Classico'} · ${
      frameMeta?.name ?? 'Cornice Base'
    }`;

    identity.append(nameEl, titlePill, cosmeticMeta);

    const rankBox = document.createElement('div');
    rankBox.className = 'career-rank-box';

    const rankTop = document.createElement('div');
    rankTop.className = 'career-rank-top';
    const tierBadge = document.createElement('span');
    tierBadge.className = 'career-rank-tier';
    tierBadge.style.color = rankInfo.colorHex;
    tierBadge.textContent = rankInfo.tier;
    const mmrBadge = document.createElement('strong');
    mmrBadge.className = 'career-rank-mmr';
    mmrBadge.textContent = `${mmr} MMR`;
    rankTop.append(tierBadge, mmrBadge);

    const nextBarWrap = document.createElement('div');
    nextBarWrap.className = 'challenge-progress-wrap';
    const nextMeta = document.createElement('div');
    nextMeta.className = 'challenge-progress-meta';
    const nextLbl = document.createElement('span');
    nextLbl.textContent =
      mmrToNextTier > 0 ? `${mmrToNextTier} MMR al prossimo grado` : 'Grado Massimo SSL';
    const nextPct = document.createElement('strong');
    nextPct.textContent = `${tierPercent}%`;
    nextMeta.append(nextLbl, nextPct);

    const nextTrack = document.createElement('div');
    nextTrack.className = 'challenge-progress-track';
    const nextFill = document.createElement('div');
    nextFill.className = 'challenge-progress-fill';
    nextFill.style.width = `${tierPercent}%`;
    nextTrack.appendChild(nextFill);
    nextBarWrap.append(nextMeta, nextTrack);

    const sslBarWrap = document.createElement('div');
    sslBarWrap.className = 'challenge-progress-wrap';
    const sslMeta = document.createElement('div');
    sslMeta.className = 'challenge-progress-meta';
    const sslLbl = document.createElement('span');
    sslLbl.textContent = `Verso Supersonic Legend (${mmr}/${SSL_MMR_THRESHOLD})`;
    const sslPct = document.createElement('strong');
    sslPct.textContent = `${sslPercent}%`;
    sslMeta.append(sslLbl, sslPct);

    const sslTrack = document.createElement('div');
    sslTrack.className = 'challenge-progress-track';
    const sslFill = document.createElement('div');
    sslFill.className = 'challenge-progress-fill career-ssl-fill';
    sslFill.style.width = `${sslPercent}%`;
    sslTrack.appendChild(sslFill);
    sslBarWrap.append(sslMeta, sslTrack);

    rankBox.append(rankTop, nextBarWrap, sslBarWrap);

    const lockerBtn = document.createElement('button');
    lockerBtn.type = 'button';
    lockerBtn.className = 'ultra-btn ultra-btn--ghost career-locker-btn';
    lockerBtn.textContent = 'Personalizza in Armadietto';
    lockerBtn.addEventListener('click', () => {
      playEarcon('nav');
      announce('Apertura Armadietto', 'polite');
      window.location.hash = '#armadietto';
    });

    const top100Btn = document.createElement('button');
    top100Btn.type = 'button';
    top100Btn.className = 'ultra-btn ultra-btn--ghost career-locker-btn';
    top100Btn.textContent = 'Classifica Top 100 Globale →';
    top100Btn.addEventListener('click', () => {
      playEarcon('nav');
      announce('Apertura Top 100 Globale', 'polite');
      window.location.hash = '#top100';
    });

    profileCol.append(avatarFrame, identity, rankBox, lockerBtn, top100Btn);
  };

  const renderStats = (): void => {
    statsCol.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'career-col-header';
    const h3 = document.createElement('h3');
    h3.textContent = 'STATISTICHE PRINCIPALI';
    const sub = document.createElement('span');
    sub.textContent = `Grado: ${rankInfo.tier}`;
    head.append(h3, sub);

    const kpi = aggregateCareerStats(modeStats, specialCardsPlayed);

    const kpiGrid = document.createElement('div');
    kpiGrid.className = 'career-kpi-grid';

    const tiles: ReadonlyArray<{
      label: string;
      value: string;
      sub: string;
      tone: 'cyan' | 'gold' | 'violet' | 'emerald';
    }> = [
      {
        label: 'Partite Giocate',
        value: String(kpi.totalMatches),
        sub: `${modeStats.length || 1} modalità attive`,
        tone: 'cyan',
      },
      {
        label: 'Percentuale Vittorie',
        value: `${kpi.winRatePercent}%`,
        sub: `${kpi.totalWins} vittorie totali`,
        tone: 'emerald',
      },
      {
        label: 'Miglior Serie',
        value: String(kpi.bestStreak),
        sub: 'Vittorie consecutive',
        tone: 'gold',
      },
      {
        label: 'Carte Speciali Giocate',
        value: String(kpi.specialCardsPlayed),
        sub: '+2 / +4 / Chiamate UNO!',
        tone: 'violet',
      },
    ];

    for (const tile of tiles) {
      const card = document.createElement('article');
      card.className = `career-kpi-card career-kpi-card--${tile.tone}`;
      const lbl = document.createElement('span');
      lbl.className = 'career-kpi-label';
      lbl.textContent = tile.label;
      const val = document.createElement('strong');
      val.className = 'career-kpi-value';
      val.textContent = tile.value;
      const hint = document.createElement('span');
      hint.className = 'career-kpi-sub';
      hint.textContent = tile.sub;
      card.append(lbl, val, hint);
      kpiGrid.appendChild(card);
    }

    const breakdownHead = document.createElement('div');
    breakdownHead.className = 'career-sub-heading';
    breakdownHead.textContent = 'RENDIMENTO PER MODALITÀ';

    const modeList = document.createElement('div');
    modeList.className = 'career-mode-list';

    if (modeStats.length === 0) {
      const emptyMode = document.createElement('div');
      emptyMode.className = 'career-empty-note';
      emptyMode.textContent =
        'Completa la prima partita autoritativa per registrare le statistiche per modalità.';
      modeList.appendChild(emptyMode);
    } else {
      for (const st of modeStats) {
        const row = document.createElement('div');
        row.className = 'career-mode-row';
        const mName = document.createElement('strong');
        mName.textContent = st.mode.toUpperCase();
        const mMeta = document.createElement('span');
        mMeta.textContent = `${st.matchesPlayed} partite · ${st.wins}V (${st.winRate}%) · Serie ${st.bestStreak}`;
        row.append(mName, mMeta);
        modeList.appendChild(row);
      }
    }

    const playlistHead = document.createElement('div');
    playlistHead.className = 'career-sub-heading';
    playlistHead.textContent = 'GRADI INDIPENDENTI PER MODALITÀ & FORMATO';

    const playlistList = document.createElement('div');
    playlistList.className = 'career-mode-list';
    const playlistEntries = Object.values(playlistRanks).sort(
      (a, b) => b.mmr - a.mmr || a.mode.localeCompare(b.mode) || a.playerCount - b.playerCount,
    );
    if (playlistEntries.length === 0) {
      const emptyPl = document.createElement('div');
      emptyPl.className = 'career-empty-note';
      emptyPl.textContent =
        'Ogni combinazione Modalità × Formato (1v1, 3G, 4G) parte da Bronze I (400 MMR).';
      playlistList.appendChild(emptyPl);
    } else {
      for (const pl of playlistEntries) {
        const plInfo = getRankInfo(pl.mmr);
        const row = document.createElement('div');
        row.className = 'career-mode-row';
        const left = document.createElement('strong');
        const fmt = pl.playerCount === 2 ? '1v1' : `${pl.playerCount}G`;
        left.textContent = `${pl.mode.toUpperCase()} · ${fmt}`;
        const right = document.createElement('span');
        right.style.color = plInfo.colorHex;
        right.textContent = `${pl.rankTier} · ${pl.mmr} MMR (${pl.wins}V/${pl.losses}S)`;
        row.append(left, right);
        playlistList.appendChild(row);
      }
    }

    statsCol.append(head, kpiGrid, breakdownHead, modeList, playlistHead, playlistList);
  };

  const renderHistory = (): void => {
    historyCol.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'career-col-header';
    const h3 = document.createElement('h3');
    h3.textContent = 'CRONOLOGIA ULTIME PARTITE';
    const countSpan = document.createElement('span');
    countSpan.textContent = `${recentMatches.length} recenti`;
    head.append(h3, countSpan);

    const listWrap = document.createElement('div');
    listWrap.className = 'career-match-list';

    if (recentMatches.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'career-empty-note';
      empty.textContent =
        'Nessuna partita recente ancora registrata su questo account.';
      listWrap.appendChild(empty);
    } else {
      for (const rm of recentMatches.slice(0, 8)) {
        const outcome = formatMatchOutcome(rm.placement);
        const item = document.createElement('article');
        item.className = `career-match-item ${outcome.won ? 'is-win' : 'is-loss'}`;

        const top = document.createElement('div');
        top.className = 'career-match-top';

        const outcomePill = document.createElement('span');
        outcomePill.className = `career-outcome-pill ${
          outcome.won ? 'is-win' : 'is-loss'
        }`;
        outcomePill.textContent = `${outcome.label} · #${rm.placement}`;

        const mmrDeltaEl = document.createElement('span');
        mmrDeltaEl.className = `career-mmr-delta ${
          rm.mmrDelta > 0 ? 'is-pos' : rm.mmrDelta < 0 ? 'is-neg' : ''
        }`;
        mmrDeltaEl.textContent = formatMmrDelta(rm.mmrDelta);

        top.append(outcomePill, mmrDeltaEl);

        const bottom = document.createElement('div');
        bottom.className = 'career-match-bottom';

        const modeInfo = document.createElement('span');
        modeInfo.className = 'career-match-mode';
        modeInfo.textContent = `${rm.mode.toUpperCase()} (${
          rm.isRanked ? 'Ranked' : 'Standard'
        }) · +${rm.vcardEarned} V-Card`;

        const replayBtn = document.createElement('button');
        replayBtn.type = 'button';
        replayBtn.className = 'ultra-btn ultra-btn--ghost career-replay-btn';
        replayBtn.textContent = 'Replay';
        replayBtn.addEventListener('click', () => {
          playEarcon('nav');
          void fetchMatchReplay(rm.matchId)
            .then((rp) => openReplayViewer(rm.matchId, rp.events))
            .catch(() => openReplayViewer(rm.matchId, []));
        });

        bottom.append(modeInfo, replayBtn);
        item.append(top, bottom);
        listWrap.appendChild(item);
      }
    }

    historyCol.append(head, listWrap);
  };

  renderProfile();
  renderStats();
  renderHistory();

  void fetchInventory()
    .then((res) => {
      const cur = getEconomySnapshot();
      setEconomySnapshot({
        ...cur,
        loadout: {
          ...res.loadout,
          theme: cur.loadout.theme ?? 'theme_default',
        },
        items: res.items.map((r) => ({
          itemId: r.item_id,
          category: r.category,
          quantity: r.quantity,
        })),
      });
      renderProfile();
    })
    .catch(() => {});

  void fetchCareerSummary()
    .then((res) => {
      modeStats = [...res.modeStats];
      recentMatches = [...res.recentMatches];
      renderStats();
      renderHistory();
    })
    .catch(() => {});

  void fetchChallenges()
    .then((res) => {
      let sum = 0;
      for (const ch of res.challenges) {
        if (SPECIAL_CHALLENGE_IDS.has(ch.definition.id)) {
          sum += ch.progress;
        }
      }
      specialCardsPlayed = sum;
      renderStats();
    })
    .catch(() => {});

  void fetchProgressionSnapshot()
    .then((snap) => {
      if (snap.playlistRanks) {
        playlistRanks = snap.playlistRanks;
        renderStats();
      }
    })
    .catch(() => {});

  root.append(layout);
  return root;
}
