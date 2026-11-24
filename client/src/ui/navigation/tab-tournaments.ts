// ============================================================
// UNO ULTRA Client — Tornei Tab (UCS Weekend, Rank Tiers, Bracket & Crates)
// ============================================================

import { TOURNAMENT_PRESETS, type TournamentPreset } from '@uno/shared';
import { announce } from '../../core/aria-live.js';
import { playEarcon } from '../../core/audio-earcons.js';
import { computeSafeLoopIndex, hasBlockedModifier } from '../../core/keyboard-nav.js';
import {
  createTournament,
  fetchBalances,
  fetchTournaments,
  joinTournament,
} from '../../net/tcp/rest-client.js';
import { getEconomySnapshot, setEconomySnapshot } from '../../state/inventory-store.js';
import { getProfile } from '../../state/profile-store.js';
import { renderBracketView, type UiBracketSlot } from '../tournament/bracket-view.js';
import { createTournamentShopPanel } from '../tournament/tournament-shop.js';
import {
  computeNextWeekendKickoffMs,
  filterTournamentsByBracket,
  formatCountdown,
  getTournamentScheduleMeta,
  getTournamentTierBracket,
  TOURNAMENT_TIER_FILTERS,
  type TournamentTierBracket,
} from '../tournament/tournament-helpers.js';

const TIER_LABELS: Readonly<Record<'bronzo' | 'arena' | 'ssl', string>> = {
  bronzo: 'FASCIA BRONZO',
  arena: 'FASCIA ARENA',
  ssl: 'SUPERSONIC LEGEND',
};

export function createTournamentsView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section tournaments-stage';
  root.setAttribute('aria-label', 'Tornei Ufficiali UNO ULTRA');

  let activeBracket: TournamentTierBracket = 'all';
  let joiningKind: string | null = null;
  let statusMessage = '';

  const profile = getProfile();
  const myRank = profile?.rankTier ?? 'Bronze I';
  const myMMR = profile?.mmr ?? 0;

  // ── 1. Hero Banner: TORNEO UCS WEEKEND ─────────────────────────
  const hero = document.createElement('header');
  hero.className = 'tournament-hero';

  const heroLeft = document.createElement('div');
  heroLeft.className = 'tournament-hero-copy';

  const heroBadge = document.createElement('span');
  heroBadge.className = 'tournament-hero-badge';
  heroBadge.textContent = 'EVENTO PRINCIPALE WEEKEND · SUPERSONIC LEGEND';

  const heroTitle = document.createElement('h2');
  heroTitle.className = 'tournament-hero-title';
  heroTitle.textContent = 'TORNEO UCS WEEKEND';

  const heroDesc = document.createElement('p');
  heroDesc.className = 'tournament-hero-desc';
  heroDesc.textContent =
    'Sfida i migliori contendenti sul tabellone a 2 ali simmetriche per vincere Crediti Torneo spendibili in Casse Esclusive.';

  const heroPrizes = document.createElement('div');
  heroPrizes.className = 'tournament-hero-prizes';

  const prizeCredits = document.createElement('span');
  prizeCredits.className = 'shop-currency-badge shop-currency-badge--tournament';
  prizeCredits.textContent = '10.000 Crediti Torneo';

  const prizeVCard = document.createElement('span');
  prizeVCard.className = 'shop-currency-badge shop-currency-badge--vcard';
  prizeVCard.textContent = '1.200 V-Card (1° Posto)';

  const prizeCrate = document.createElement('span');
  prizeCrate.className = 'shop-currency-badge shop-currency-badge--crates';
  prizeCrate.textContent = 'Cassa Leggenda SSL';

  heroPrizes.append(prizeCredits, prizeVCard, prizeCrate);
  heroLeft.append(heroBadge, heroTitle, heroDesc, heroPrizes);

  const heroRight = document.createElement('div');
  heroRight.className = 'tournament-hero-side';

  const walletStrip = document.createElement('div');
  walletStrip.className = 'tournament-wallet-strip';
  const creditsWalletPill = document.createElement('span');
  creditsWalletPill.className = 'shop-currency-badge shop-currency-badge--tournament';
  const vcardWalletPill = document.createElement('span');
  vcardWalletPill.className = 'shop-currency-badge shop-currency-badge--vcard';
  walletStrip.append(creditsWalletPill, vcardWalletPill);

  const countdownBox = document.createElement('div');
  countdownBox.className = 'tournament-countdown-box';
  const countdownLbl = document.createElement('span');
  countdownLbl.className = 'tournament-countdown-label';
  countdownLbl.textContent = 'INIZIO PROSSIMO WEEKEND';
  const countdownValue = document.createElement('strong');
  countdownValue.className = 'tournament-countdown-value';
  countdownBox.append(countdownLbl, countdownValue);

  const heroCta = document.createElement('button');
  heroCta.type = 'button';
  heroCta.className = 'tournament-hero-cta';
  heroCta.textContent = 'Iscriviti Ora';

  heroRight.append(walletStrip, countdownBox, heroCta);
  hero.append(heroLeft, heroRight);

  const updateWalletPills = (): void => {
    const snap = getEconomySnapshot();
    creditsWalletPill.textContent = `${snap.tournamentCredits} Crediti Torneo`;
    vcardWalletPill.textContent = `${snap.vcard} V-Card`;
  };

  const refreshCountdown = (): void => {
    countdownValue.textContent = formatCountdown(
      computeNextWeekendKickoffMs(Date.now())
    );
  };
  refreshCountdown();

  const timerId = window.setInterval(() => {
    if (!root.isConnected) {
      window.clearInterval(timerId);
      return;
    }
    refreshCountdown();
  }, 1000);

  // ── 2. Filters, Feedback, Schedule Grid, Bracket & Shop ────────
  const filterBar = document.createElement('div');
  filterBar.className = 'tournaments-filter-bar';
  filterBar.setAttribute('role', 'tablist');
  filterBar.setAttribute('aria-label', 'Fasce grado tornei');

  const feedback = document.createElement('div');
  feedback.className = 'tab-feedback tournaments-feedback';

  const scheduleGrid = document.createElement('div');
  scheduleGrid.className = 'tournaments-schedule-grid';

  const bracketHead = document.createElement('div');
  bracketHead.className = 'tournament-section-head';
  const bracketTitle = document.createElement('h3');
  bracketTitle.textContent = 'Tabellone Attivo a 2 Ali Simmetriche';
  bracketHead.appendChild(bracketTitle);

  const bracketHost = document.createElement('div');
  const demoSlots: UiBracketSlot[] = [
    { matchIndex: 0, wing: 'left', round: 1, playerA: 'Nova_Strike', playerB: 'Tu', winner: null },
    { matchIndex: 1, wing: 'right', round: 1, playerA: 'Vega_Prime', playerB: 'Zenith_SSL', winner: null },
    { matchIndex: 2, wing: 'final', round: 2, playerA: null, playerB: null, winner: null },
  ];
  bracketHost.appendChild(renderBracketView(demoSlots));

  const shopHead = document.createElement('div');
  shopHead.className = 'tournament-section-head';
  const shopTitle = document.createElement('h3');
  shopTitle.textContent = 'Shop Casse Torneo (Spendi Crediti Torneo)';
  const shopSub = document.createElement('span');
  shopSub.textContent = 'Le stesse casse sono accessibili anche nel Negozio Cosmetico.';
  shopHead.append(shopTitle, shopSub);

  const shopPanel = createTournamentShopPanel(
    (msg) => {
      statusMessage = msg;
      feedback.textContent = msg;
    },
    updateWalletPills
  );

  const enrollInTournament = async (preset: TournamentPreset): Promise<void> => {
    if (joiningKind !== null) return;
    joiningKind = preset.kind;
    renderSchedule();
    try {
      const created = await createTournament(preset.kind);
      const tid = String(created.tournament['id'] ?? '');
      if (tid) {
        const joined = await joinTournament(tid);
        bracketHost.innerHTML = '';
        bracketHost.appendChild(renderBracketView(joined.bracket as UiBracketSlot[]));
        statusMessage = `Iscritto a ${preset.title}! Partecipanti: ${joined.participantCount}`;
        playEarcon('confirm');
        announce(statusMessage, 'polite');
      }
    } catch (err) {
      statusMessage =
        err instanceof Error
          ? err.message
          : `Anteprima bracket ${preset.title} aggiornata`;
      playEarcon('error');
      announce(statusMessage, 'assertive');
    } finally {
      joiningKind = null;
      feedback.textContent = statusMessage;
      renderSchedule();
    }
  };

  heroCta.addEventListener('click', () => {
    const ucsPreset =
      TOURNAMENT_PRESETS.find((p) => p.kind === 'ucs-ssl') ?? TOURNAMENT_PRESETS[0];
    if (ucsPreset) {
      void enrollInTournament(ucsPreset);
    }
  });

  const renderFilters = (focusActive = false): void => {
    filterBar.innerHTML = '';
    for (const opt of TOURNAMENT_TIER_FILTERS) {
      const count = filterTournamentsByBracket(TOURNAMENT_PRESETS, opt.id).length;
      const isSelected = opt.id === activeBracket;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tournaments-filter-btn${isSelected ? ' active' : ''}`;
      btn.textContent = `${opt.label} (${count})`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(isSelected));
      btn.tabIndex = isSelected ? 0 : -1;
      btn.addEventListener('click', () => {
        if (activeBracket === opt.id) return;
        activeBracket = opt.id;
        playEarcon('nav');
        announce(`Tornei fascia ${opt.label}`, 'polite');
        renderFilters(true);
        renderSchedule();
      });
      filterBar.appendChild(btn);
      if (focusActive && isSelected) {
        btn.focus();
      }
    }
  };

  filterBar.addEventListener('keydown', (ev) => {
    if (hasBlockedModifier(ev)) return;
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    ev.preventDefault();
    const curIdx = TOURNAMENT_TIER_FILTERS.findIndex((o) => o.id === activeBracket);
    const delta = ev.key === 'ArrowRight' ? 1 : -1;
    const { index, wrapped } = computeSafeLoopIndex(
      curIdx,
      delta,
      TOURNAMENT_TIER_FILTERS.length
    );
    const next = TOURNAMENT_TIER_FILTERS[index];
    if (next) {
      activeBracket = next.id;
      playEarcon(wrapped ? 'boundary' : 'nav');
      announce(`Tornei fascia ${next.label}`, 'polite');
      renderFilters(true);
      renderSchedule();
    }
  });

  const renderSchedule = (): void => {
    scheduleGrid.innerHTML = '';
    const filtered = filterTournamentsByBracket(TOURNAMENT_PRESETS, activeBracket);

    for (const preset of filtered) {
      const tier = getTournamentTierBracket(preset.minMMR);
      const meta = getTournamentScheduleMeta(preset.kind, myRank);
      const isBusy = joiningKind === preset.kind;
      const meetsMMR = myMMR >= preset.minMMR;

      const card = document.createElement('article');
      card.className = `tournament-card tournament-card--${tier}`;

      const topRow = document.createElement('div');
      topRow.className = 'shop-card-badges';
      const tierPill = document.createElement('span');
      tierPill.className = `tournament-tier-pill tournament-tier-pill--${tier}`;
      tierPill.textContent = TIER_LABELS[tier];
      const capPill = document.createElement('span');
      capPill.className = 'shop-tag-pill shop-tag-pill--crate';
      capPill.textContent = `${preset.maxPlayers} GIOCATORI`;
      topRow.append(tierPill, capPill);

      const title = document.createElement('h3');
      title.className = 'tournament-card-title';
      title.textContent = preset.title;

      const desc = document.createElement('p');
      desc.className = 'tournament-card-desc';
      desc.textContent = preset.description;

      const metaRows = document.createElement('div');
      metaRows.className = 'tournament-meta-list';

      const scheduleRow = document.createElement('div');
      scheduleRow.className = 'tournament-meta-row';
      scheduleRow.innerHTML = '';
      const sLbl = document.createElement('span');
      sLbl.textContent = 'Orario';
      const sVal = document.createElement('strong');
      sVal.textContent = meta.schedule;
      scheduleRow.append(sLbl, sVal);

      const reqRow = document.createElement('div');
      reqRow.className = 'tournament-meta-row';
      const rLbl = document.createElement('span');
      rLbl.textContent = 'Requisito & Ingresso';
      const rVal = document.createElement('strong');
      rVal.textContent = `${preset.minMMR}+ MMR (${meetsMMR ? 'Idoneo' : `Tuo: ${myMMR}`}) · ${
        preset.entryFeeVCard === 0 ? 'Gratuito' : `${preset.entryFeeVCard} V-Card`
      }`;
      reqRow.append(rLbl, rVal);

      metaRows.append(scheduleRow, reqRow);

      const rewards = document.createElement('div');
      rewards.className = 'challenge-rewards';
      const creditsBadge = document.createElement('span');
      creditsBadge.className = 'challenge-reward challenge-reward--xp';
      creditsBadge.textContent = `${preset.prizePoolCredits} Crediti Torneo`;
      const vcardBadge = document.createElement('span');
      vcardBadge.className = 'challenge-reward challenge-reward--vcard';
      vcardBadge.textContent = `${preset.prizeFirstVCard} V-Card`;
      const crateBadge = document.createElement('span');
      crateBadge.className = 'shop-tag-pill shop-tag-pill--crate';
      crateBadge.textContent = meta.crateReward;
      rewards.append(creditsBadge, vcardBadge, crateBadge);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tournament-join-btn tournament-join-btn--${tier}`;
      btn.textContent = isBusy ? 'Iscrizione…' : 'Apri / Iscriviti';
      if (isBusy) {
        btn.setAttribute('aria-disabled', 'true');
      }
      btn.addEventListener('click', () => void enrollInTournament(preset));

      card.append(topRow, title, desc, metaRows, rewards, btn);
      scheduleGrid.appendChild(card);
    }
  };

  updateWalletPills();
  renderFilters();
  renderSchedule();

  void fetchBalances()
    .then((b) => {
      const cur = getEconomySnapshot();
      setEconomySnapshot({
        ...cur,
        vcard: b.vcard,
        tournamentCredits: b.tournamentCredits,
      });
      updateWalletPills();
    })
    .catch(() => {});

  void fetchTournaments()
    .then((res) => {
      const first = res.tournaments[0];
      const bracketData = first?.['bracket_data'] as { slots?: UiBracketSlot[] } | undefined;
      if (bracketData?.slots && bracketData.slots.length > 0) {
        bracketHost.innerHTML = '';
        bracketHost.appendChild(renderBracketView(bracketData.slots));
      }
    })
    .catch(() => {});

  root.append(
    hero,
    filterBar,
    feedback,
    scheduleGrid,
    bracketHead,
    bracketHost,
    shopHead,
    shopPanel
  );
  return root;
}
