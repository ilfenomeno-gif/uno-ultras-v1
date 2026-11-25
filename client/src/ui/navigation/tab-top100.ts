// ============================================================
// UNO ULTRA Client — Top 100 Mondiale Tab (All Modes × 1v1 / 3p / 4p)
// ============================================================

import { getRankInfo, SSL_MMR_THRESHOLD, type GameMode } from '@uno/shared';
import { announce } from '../../core/aria-live.js';
import { playEarcon } from '../../core/audio-earcons.js';
import { computeSafeLoopIndex, hasBlockedModifier } from '../../core/keyboard-nav.js';
import { fetchTopLeaderboard, type TopLeaderboardEntry } from '../../net/tcp/rest-client.js';
import { getProfile } from '../../state/profile-store.js';
import {
  buildFallbackTop100Entries,
  TOP100_MODES,
  TOP100_PLAYER_COUNTS,
} from './top100-helpers.js';

export function createTop100View(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section top100-stage';
  root.setAttribute('aria-label', 'Classifica Top 100 Mondiale');

  let activeMode: GameMode = 'uno';
  let activePlayers: 2 | 3 | 4 = 2;
  let entries: readonly TopLeaderboardEntry[] = buildFallbackTop100Entries(
    activeMode,
    activePlayers,
  );
  let loading = false;

  const profile = getProfile();
  const myUsername = profile?.username ?? 'Tu';
  const myMmr = profile?.mmr ?? 400;
  const myRank = getRankInfo(myMmr);

  const hero = document.createElement('header');
  hero.className = 'top100-hero';

  const heroLeft = document.createElement('div');
  heroLeft.className = 'top100-hero-copy';
  const kicker = document.createElement('span');
  kicker.className = 'challenges-season-tag';
  kicker.textContent = 'STAGIONE 1 · CLASSIFICA MONDIALE';
  const title = document.createElement('h1');
  title.className = 'top100-hero-title';
  title.textContent = 'TOP 100 MONDIALE';
  const sub = document.createElement('p');
  sub.className = 'top100-hero-sub';
  sub.textContent = `Seleziona la modalità e il formato (1v1, 3 Giocatori, 4 Giocatori). Soglia SSL: ${SSL_MMR_THRESHOLD}+ MMR.`;
  heroLeft.append(kicker, title, sub);

  const heroRight = document.createElement('div');
  heroRight.className = 'top100-my-card';
  const myCardLbl = document.createElement('span');
  myCardLbl.className = 'top100-my-lbl';
  myCardLbl.textContent = `TUO PROFILO · ${myUsername}`;
  const myCardVal = document.createElement('strong');
  myCardVal.className = 'top100-my-val';
  myCardVal.style.color = myRank.colorHex;
  myCardVal.textContent = `${myRank.tier} · ${myMmr} MMR`;
  heroRight.append(myCardLbl, myCardVal);
  hero.append(heroLeft, heroRight);

  // ── Filter Controls: Modalità (Row 1) + Numero Giocatori (Row 2) ──
  const controlsBox = document.createElement('div');
  controlsBox.className = 'top100-controls';

  const modeGroup = document.createElement('div');
  modeGroup.className = 'top100-filter-block';
  const modeHeading = document.createElement('span');
  modeHeading.className = 'top100-filter-label';
  modeHeading.textContent = 'MODALITÀ DI GIOCO';
  const modeBar = document.createElement('div');
  modeBar.className = 'top100-mode-bar';
  modeBar.setAttribute('role', 'tablist');
  modeBar.setAttribute('aria-label', 'Modalità classifica Top 100');
  modeGroup.append(modeHeading, modeBar);

  const countGroup = document.createElement('div');
  countGroup.className = 'top100-filter-block';
  const countHeading = document.createElement('span');
  countHeading.className = 'top100-filter-label';
  countHeading.textContent = 'NUMERO GIOCATORI';
  const countBar = document.createElement('div');
  countBar.className = 'top100-players-bar';
  countBar.setAttribute('role', 'tablist');
  countBar.setAttribute('aria-label', 'Numero giocatori classifica Top 100');
  countGroup.append(countHeading, countBar);

  controlsBox.append(modeGroup, countGroup);

  const podiumHost = document.createElement('div');
  podiumHost.className = 'top100-podium';

  const statusLine = document.createElement('div');
  statusLine.className = 'tab-feedback';
  statusLine.setAttribute('role', 'status');

  const tableCard = document.createElement('div');
  tableCard.className = 'top100-table-card';

  const loadLeaderboard = async (): Promise<void> => {
    const reqMode = activeMode;
    const reqPlayers = activePlayers;
    loading = true;
    statusLine.textContent = 'Aggiornamento classifica mondiale…';
    try {
      const res = await fetchTopLeaderboard(100, {
        mode: reqMode,
        players: reqPlayers,
      });
      if (reqMode === activeMode && reqPlayers === activePlayers) {
        entries =
          res.entries.length > 0
            ? res.entries
            : buildFallbackTop100Entries(reqMode, reqPlayers);
        const modeMeta = TOP100_MODES.find((m) => m.id === reqMode);
        const pMeta = TOP100_PLAYER_COUNTS.find((p) => p.count === reqPlayers);
        statusLine.textContent = `Classifica ${modeMeta?.label ?? reqMode} · ${pMeta?.label ?? `${reqPlayers} Giocatori`} (${entries.length} giocatori)`;
      }
    } catch {
      if (reqMode === activeMode && reqPlayers === activePlayers) {
        entries = buildFallbackTop100Entries(reqMode, reqPlayers);
        statusLine.textContent = 'Classifica locale stagionale caricata.';
      }
    } finally {
      loading = false;
      renderBoard();
    }
  };

  const renderControls = (focusTarget?: 'mode' | 'players'): void => {
    modeBar.replaceChildren();
    TOP100_MODES.forEach((m, idx) => {
      const isSelected = m.id === activeMode;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tournaments-filter-btn${isSelected ? ' active' : ''}`;
      btn.textContent = m.label;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(isSelected));
      btn.tabIndex = isSelected ? 0 : -1;
      btn.addEventListener('click', () => {
        if (activeMode === m.id) return;
        activeMode = m.id;
        playEarcon('nav');
        announce(`Classifica ${m.label}`, 'polite');
        renderControls('mode');
        void loadLeaderboard();
      });
      btn.addEventListener('keydown', (ev) => {
        if (hasBlockedModifier(ev)) return;
        if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
        ev.preventDefault();
        const delta = ev.key === 'ArrowRight' ? 1 : -1;
        const { index, wrapped } = computeSafeLoopIndex(idx, delta, TOP100_MODES.length);
        const next = TOP100_MODES[index];
        if (next) {
          activeMode = next.id;
          playEarcon(wrapped ? 'boundary' : 'nav');
          renderControls('mode');
          void loadLeaderboard();
        }
      });
      modeBar.appendChild(btn);
      if (focusTarget === 'mode' && isSelected) btn.focus();
    });

    countBar.replaceChildren();
    TOP100_PLAYER_COUNTS.forEach((p, idx) => {
      const isSelected = p.count === activePlayers;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `top100-player-btn${isSelected ? ' active' : ''}`;
      btn.textContent = p.label;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(isSelected));
      btn.tabIndex = isSelected ? 0 : -1;
      btn.addEventListener('click', () => {
        if (activePlayers === p.count) return;
        activePlayers = p.count;
        playEarcon('nav');
        announce(`Formato ${p.label}`, 'polite');
        renderControls('players');
        void loadLeaderboard();
      });
      btn.addEventListener('keydown', (ev) => {
        if (hasBlockedModifier(ev)) return;
        if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
        ev.preventDefault();
        const delta = ev.key === 'ArrowRight' ? 1 : -1;
        const { index, wrapped } = computeSafeLoopIndex(
          idx,
          delta,
          TOP100_PLAYER_COUNTS.length,
        );
        const next = TOP100_PLAYER_COUNTS[index];
        if (next) {
          activePlayers = next.count;
          playEarcon(wrapped ? 'boundary' : 'nav');
          renderControls('players');
          void loadLeaderboard();
        }
      });
      countBar.appendChild(btn);
      if (focusTarget === 'players' && isSelected) btn.focus();
    });
  };

  const renderBoard = (): void => {
    podiumHost.replaceChildren();
    const top3 = entries.slice(0, 3);
    const medals = ['#1 ORO', '#2 ARGENTO', '#3 BRONZO'] as const;
    top3.forEach((entry, idx) => {
      const card = document.createElement('article');
      card.className = `top100-podium-card is-pos-${idx + 1}`;
      const rankInfo = getRankInfo(entry.mmr);

      const posEl = document.createElement('span');
      posEl.className = 'top100-podium-pos';
      posEl.textContent = medals[idx] ?? `#${entry.rank}`;

      const nameEl = document.createElement('h2');
      nameEl.className = 'top100-podium-name';
      nameEl.textContent = entry.username;

      const titleEl = document.createElement('span');
      titleEl.className = 'career-title-pill';
      titleEl.textContent = entry.title ?? rankInfo.tier;
      if (entry.titleColor) {
        titleEl.style.color = entry.titleColor;
        titleEl.style.borderColor = entry.titleColor;
      }

      const statRow = document.createElement('div');
      statRow.className = 'top100-podium-stats';
      const mmrEl = document.createElement('strong');
      mmrEl.style.color = rankInfo.colorHex;
      mmrEl.textContent = `${entry.mmr} MMR`;
      const wrEl = document.createElement('span');
      wrEl.textContent = `${entry.wins ?? 0}V · ${entry.winRate ?? 55}% WR`;
      statRow.append(mmrEl, wrEl);

      card.append(posEl, nameEl, titleEl, statRow);
      podiumHost.appendChild(card);
    });

    tableCard.replaceChildren();
    const head = document.createElement('div');
    head.className = 'top100-row top100-row--head';
    for (const col of ['#', 'Giocatore', 'Targhetta', 'Grado', 'Vittorie', 'WR', 'MMR']) {
      const s = document.createElement('span');
      s.textContent = col;
      head.appendChild(s);
    }
    tableCard.appendChild(head);

    if (loading && entries.length === 0) {
      const note = document.createElement('div');
      note.className = 'career-empty-note';
      note.textContent = 'Caricamento classifica Top 100…';
      tableCard.appendChild(note);
      return;
    }

    for (const entry of entries) {
      const row = document.createElement('div');
      const isMe = profile && entry.playerId === profile.id;
      row.className = `top100-row${isMe ? ' is-me' : ''}`;
      const rInfo = getRankInfo(entry.mmr);

      const c1 = document.createElement('strong');
      c1.className = 'top100-rank-num';
      c1.textContent = `#${entry.rank}`;

      const c2 = document.createElement('span');
      c2.className = 'top100-player-name';
      c2.textContent = entry.username;

      const c3 = document.createElement('span');
      c3.className = 'top100-player-title';
      c3.textContent = entry.title ?? '—';
      if (entry.titleColor) {
        c3.style.color = entry.titleColor;
        c3.style.fontWeight = '700';
      }

      const c4 = document.createElement('span');
      c4.style.color = rInfo.colorHex;
      c4.style.fontWeight = '700';
      c4.textContent = entry.rankTier;

      const c5 = document.createElement('span');
      c5.textContent = String(entry.wins ?? Math.round(entry.mmr / 20));

      const c6 = document.createElement('span');
      c6.textContent = `${entry.winRate ?? 55}%`;

      const c7 = document.createElement('strong');
      c7.className = 'top100-mmr-val';
      c7.textContent = String(entry.mmr);

      row.append(c1, c2, c3, c4, c5, c6, c7);
      tableCard.appendChild(row);
    }
  };

  renderControls();
  renderBoard();
  void loadLeaderboard();

  root.append(hero, controlsBox, statusLine, podiumHost, tableCard);
  return root;
}
