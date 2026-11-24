// ============================================================
// UNO ULTRA Client — Battle Pass / Battle Card (Neon Stadium Season Pass)
// ============================================================

import {
  BATTLE_CARD_PRICE_BASE,
  BATTLE_CARD_PRICE_BUNDLE_20,
  BATTLE_CARD_REWARDS,
} from '@uno/shared';
import { announce } from '../../core/aria-live.js';
import { playEarcon } from '../../core/audio-earcons.js';
import { computeSafeLoopIndex, hasBlockedModifier } from '../../core/keyboard-nav.js';
import {
  buyBattleCard,
  claimBattleCardTier,
  fetchBattleCard,
  unlockAllBattleCard,
} from '../../net/tcp/rest-client.js';
import { patchProfile } from '../../state/profile-store.js';
import { getShopItemArtworkSvg } from './shop-artworks.js';
import {
  BATTLE_PASS_PHASES,
  buildBattlePassCards,
  computeBattlePassMetrics,
  getStadiumHeroArtworkSvg,
  getVCardRewardArtworkSvg,
  type BattleCardClientState,
  type BattlePassCardModel,
  type BattlePassPhase,
} from './battle-card-helpers.js';

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createBattleCardView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section bp-page';
  root.setAttribute('aria-label', 'Battle Card Stagione 1');

  let state: BattleCardClientState = {
    tier: 'free',
    level: 1,
    xp: 0,
    claimedLevels: [],
  };
  let activePhase: BattlePassPhase = 'pre-season';
  let selectedKey: string | null = null;
  let feedbackText = '';
  let busyAction = false;

  const subnav = document.createElement('nav');
  subnav.className = 'bp-subnav';
  subnav.setAttribute('aria-label', 'Fasi stagionali Battle Pass');

  const hero = document.createElement('section');
  hero.className = 'bp-hero';

  const progressGrid = document.createElement('section');
  progressGrid.className = 'bp-progression-grid';

  const feedbackEl = el('div', 'bp-feedback is-empty');
  feedbackEl.setAttribute('role', 'status');

  const mainGrid = document.createElement('div');
  mainGrid.className = 'bp-main-grid';

  const commandBar = document.createElement('footer');
  commandBar.className = 'bp-command-bar';

  const setFeedback = (msg: string): void => {
    feedbackText = msg;
    feedbackEl.textContent = msg;
    feedbackEl.classList.toggle('is-empty', msg.length === 0);
  };

  const refreshFromServer = async (): Promise<void> => {
    const res = await fetchBattleCard();
    state = res.state;
    patchProfile({ battleCardLevel: state.level });
  };

  const handleClaimCard = async (card: BattlePassCardModel): Promise<void> => {
    if (busyAction || card.status !== 'available') {
      if (card.status === 'locked') {
        playEarcon('boundary');
        setFeedback(
          card.requiresPremium && state.tier === 'free'
            ? `Ricompensa Premium al livello ${card.level}: attiva il Pass Premium per riscattarla.`
            : `Raggiungi il livello ${card.level} per sbloccare "${card.label}".`,
        );
      }
      return;
    }

    busyAction = true;
    try {
      await claimBattleCardTier(card.level, card.track);
      await refreshFromServer();
      playEarcon('win');
      const okMsg = `Ricompensa riscattata: ${card.label}!`;
      setFeedback(okMsg);
      announce(okMsg, 'polite');
      render();
    } catch (err) {
      playEarcon('error');
      const errMsg = err instanceof Error ? err.message : 'Riscatto non riuscito';
      setFeedback(errMsg);
      announce(errMsg, 'assertive');
    } finally {
      busyAction = false;
    }
  };

  const handleBuyPass = async (plan: 'base' | 'bundle20'): Promise<void> => {
    if (busyAction || state.tier !== 'free') return;
    busyAction = true;
    try {
      await buyBattleCard(plan);
      await refreshFromServer();
      playEarcon('win');
      const okMsg =
        plan === 'bundle20'
          ? 'Pass Premium +20 Livelli attivato!'
          : 'Battle Card Premium attivata!';
      setFeedback(okMsg);
      announce(okMsg, 'polite');
      render();
    } catch (err) {
      playEarcon('error');
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Acquisto disponibile online con saldo V-Card sufficiente';
      setFeedback(errMsg);
      announce(errMsg, 'assertive');
    } finally {
      busyAction = false;
    }
  };

  const handleUnlockAll = async (): Promise<void> => {
    if (busyAction || state.level >= 100) return;
    busyAction = true;
    try {
      await unlockAllBattleCard();
      await refreshFromServer();
      playEarcon('win');
      const okMsg = 'Tutti i livelli rimanenti del Battle Pass sono stati sbloccati!';
      setFeedback(okMsg);
      announce(okMsg, 'polite');
      render();
    } catch (err) {
      playEarcon('error');
      const errMsg = err instanceof Error ? err.message : 'Saldo V-Card insufficiente';
      setFeedback(errMsg);
      announce(errMsg, 'assertive');
    } finally {
      busyAction = false;
    }
  };

  const render = (focusKey?: string): void => {
    const metrics = computeBattlePassMetrics(BATTLE_CARD_REWARDS, state);
    const phaseCards = buildBattlePassCards(BATTLE_CARD_REWARDS, state, activePhase);

    if (!selectedKey || !phaseCards.some((c) => c.key === selectedKey)) {
      selectedKey = phaseCards[0]?.key ?? null;
    }
    const selectedCard = phaseCards.find((c) => c.key === selectedKey) ?? phaseCards[0] ?? null;

    // B. Sotto-navigazione stagionale
    subnav.replaceChildren();
    subnav.appendChild(el('span', 'bp-bumper-badge', 'LB / Q'));
    const tabsWrap = el('div', 'bp-phase-tabs');
    tabsWrap.setAttribute('role', 'tablist');
    BATTLE_PASS_PHASES.forEach((ph, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.role = 'tab';
      const isAct = ph.id === activePhase;
      btn.className = isAct ? 'bp-phase-tab is-active' : 'bp-phase-tab';
      btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
      btn.textContent = `${ph.label} (${ph.minLevel}–${ph.maxLevel})`;
      btn.addEventListener('click', () => {
        activePhase = ph.id;
        selectedKey = null;
        playEarcon('nav');
        render();
      });
      btn.addEventListener('keydown', (ev) => {
        if (hasBlockedModifier(ev)) return;
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
          ev.preventDefault();
          const delta = ev.key === 'ArrowRight' ? 1 : -1;
          const { index, wrapped } = computeSafeLoopIndex(idx, delta, BATTLE_PASS_PHASES.length);
          const nextPh = BATTLE_PASS_PHASES[index];
          if (nextPh) {
            activePhase = nextPh.id;
            selectedKey = null;
            playEarcon(wrapped ? 'boundary' : 'nav');
            render();
            tabsWrap.querySelectorAll<HTMLButtonElement>('.bp-phase-tab')[index]?.focus();
          }
        }
      });
      tabsWrap.appendChild(btn);
    });
    subnav.append(tabsWrap, el('span', 'bp-bumper-badge', 'RB / E'));

    // C. Hero / Intestazione Battle Pass
    hero.replaceChildren();
    const bgLayer = el('div', 'bp-hero-bg');
    bgLayer.innerHTML = getStadiumHeroArtworkSvg();
    const scrim = el('div', 'bp-hero-scrim');

    const copy = el('div', 'bp-hero-copy');
    const kicker = el('span', 'bp-hero-kicker', 'NEON STADIUM SEASON 1');
    const title = el('h1', 'bp-hero-title', 'BATTLE PASS');
    const sub = el(
      'p',
      'bp-hero-sub',
      'Completa le sfide, guadagna XP e sblocca nuove ricompense!',
    );
    copy.append(kicker, title, sub);

    const xpBadge = el('div', 'bp-xp-badge');
    xpBadge.append(
      el('span', 'bp-xp-badge-label', state.tier === 'free' ? 'TRACK GRATUITO' : 'PASS PREMIUM ATTIVO'),
      el('strong', 'bp-xp-badge-val', `${metrics.xp} / ${metrics.xpPerLevel} XP`),
    );

    hero.append(bgLayer, scrim, copy, xpBadge);

    // D & E. Progressione giocatore (Livello/XP) separata dalla Barra dei Tier
    progressGrid.replaceChildren();

    const levelPanel = el('div', 'bp-progress-panel');
    const levelHead = el('div', 'bp-progress-head');
    const emblem = el('div', 'bp-level-emblem');
    emblem.append(
      el('span', 'bp-level-pill', `LIVELLO ${metrics.level} / ${metrics.maxLevel}`),
      el('span', undefined, 'Progressione XP Stagione'),
    );
    levelHead.append(emblem, el('span', 'bp-progress-num', `${metrics.xp} / ${metrics.xpPerLevel} XP`));
    const xpTrack = el('div', 'bp-bar-track');
    xpTrack.setAttribute('role', 'progressbar');
    xpTrack.setAttribute('aria-label', 'Avanzamento XP livello corrente');
    xpTrack.setAttribute('aria-valuemin', '0');
    xpTrack.setAttribute('aria-valuemax', String(metrics.xpPerLevel));
    xpTrack.setAttribute('aria-valuenow', String(metrics.xp));
    const xpFill = el('div', 'bp-bar-fill');
    xpFill.style.width = `${metrics.xpPercent}%`;
    xpTrack.appendChild(xpFill);
    levelPanel.append(levelHead, xpTrack);

    const tierPanel = el('div', 'bp-tier-panel');
    const tierHead = el('div', 'bp-progress-head');
    tierHead.append(
      el('strong', undefined, 'Tier sbloccati'),
      el('span', 'bp-progress-num', `${metrics.unlockedCards} / ${metrics.totalCards}`),
    );
    const tierBar = el('div', 'bp-bar-track');
    tierBar.setAttribute('role', 'progressbar');
    tierBar.setAttribute('aria-label', 'Tier ricompense sbloccati');
    tierBar.setAttribute('aria-valuemin', '0');
    tierBar.setAttribute('aria-valuemax', String(metrics.totalCards));
    tierBar.setAttribute('aria-valuenow', String(metrics.unlockedCards));
    const tierFill = el('div', 'bp-bar-fill bp-bar-fill--tier');
    tierFill.style.width = `${metrics.tierPercent}%`;
    tierBar.appendChild(tierFill);
    tierPanel.append(tierHead, tierBar);

    progressGrid.append(levelPanel, tierPanel);

    // Feedback region
    feedbackEl.textContent = feedbackText;
    feedbackEl.classList.toggle('is-empty', feedbackText.length === 0);

    // F & G. Tracciato ricompense orizzontale
    mainGrid.replaceChildren();
    const trackPanel = el('section', 'bp-track-panel');
    const toolbar = el('div', 'bp-track-toolbar');
    toolbar.appendChild(
      el(
        'h2',
        'bp-track-title',
        `Tracciato Ricompense · ${BATTLE_PASS_PHASES.find((p) => p.id === activePhase)?.label ?? 'PRE-SEASON'}`,
      ),
    );

    const arrowsWrap = el('div', 'bp-track-arrows');
    const leftBtn = document.createElement('button');
    leftBtn.type = 'button';
    leftBtn.className = 'bp-arrow-btn';
    leftBtn.textContent = '◀';
    leftBtn.setAttribute('aria-label', 'Scorri ricompense precedenti');

    const rightBtn = document.createElement('button');
    rightBtn.type = 'button';
    rightBtn.className = 'bp-arrow-btn';
    rightBtn.textContent = '▶';
    rightBtn.setAttribute('aria-label', 'Scorri ricompense successive');

    arrowsWrap.append(leftBtn, rightBtn);
    toolbar.appendChild(arrowsWrap);

    const scroller = el('div', 'bp-track-scroller');
    scroller.setAttribute('role', 'listbox');
    scroller.setAttribute('aria-label', 'Ricompense Battle Pass');

    const moveSelection = (delta: number): void => {
      if (phaseCards.length === 0) return;
      const curIdx = phaseCards.findIndex((c) => c.key === selectedKey);
      const { index, wrapped } = computeSafeLoopIndex(curIdx, delta, phaseCards.length);
      const nextCard = phaseCards[index];
      if (!nextCard) return;
      selectedKey = nextCard.key;
      playEarcon(wrapped ? 'boundary' : 'nav');
      render(nextCard.key);
    };

    leftBtn.addEventListener('click', () => {
      scroller.scrollBy({ left: -240, behavior: 'smooth' });
      moveSelection(-1);
    });
    rightBtn.addEventListener('click', () => {
      scroller.scrollBy({ left: 240, behavior: 'smooth' });
      moveSelection(1);
    });

    phaseCards.forEach((card, idx) => {
      const cardBtn = document.createElement('button');
      cardBtn.type = 'button';
      cardBtn.dataset['cardKey'] = card.key;
      cardBtn.setAttribute('role', 'option');
      const isSelected = card.key === selectedCard?.key;
      cardBtn.setAttribute('aria-selected', isSelected ? 'true' : 'false');

      const cls = ['bp-reward-card'];
      if (card.requiresPremium) cls.push('is-premium');
      if (card.status === 'available') cls.push('is-available');
      else if (card.status === 'claimed') cls.push('is-claimed');
      else cls.push('is-locked');
      if (isSelected) cls.push('is-selected');
      cardBtn.className = cls.join(' ');

      const topRow = el('div', 'bp-card-top');
      topRow.append(
        el('span', 'bp-card-tier', `TIER ${card.level}`),
        el(
          'span',
          card.requiresPremium ? 'bp-track-tag bp-track-tag--premium' : 'bp-track-tag bp-track-tag--free',
          card.requiresPremium ? 'PREMIUM' : 'FREE',
        ),
      );

      const artBox = el('div', 'bp-card-art');
      artBox.innerHTML =
        card.kind === 'vcard'
          ? getVCardRewardArtworkSvg(card.vcardAmount ?? 50, card.key)
          : getShopItemArtworkSvg(card.itemId ?? 'title_combo_king', card.category ?? 'cosmetic' as never);

      const nameEl = el('div', 'bp-card-name', card.label);

      const statusText =
        card.status === 'claimed'
          ? '✓ Riscattata'
          : card.status === 'available'
            ? '★ Disponibile'
            : '🔒 Bloccata';
      const statusBadge = el('span', `bp-card-status is-${card.status}`, statusText);

      cardBtn.setAttribute(
        'aria-label',
        `Tier ${card.level}, ${card.requiresPremium ? 'Premium' : 'Free'}, ${card.label}, ${statusText}`,
      );

      cardBtn.append(topRow, artBox, nameEl, statusBadge);

      cardBtn.addEventListener('click', () => {
        selectedKey = card.key;
        playEarcon('nav');
        render(card.key);
      });

      cardBtn.addEventListener('keydown', (ev) => {
        if (hasBlockedModifier(ev)) return;
        if (ev.key === 'ArrowRight') {
          ev.preventDefault();
          const { index, wrapped } = computeSafeLoopIndex(idx, 1, phaseCards.length);
          const next = phaseCards[index];
          if (next) {
            selectedKey = next.key;
            playEarcon(wrapped ? 'boundary' : 'nav');
            render(next.key);
          }
        } else if (ev.key === 'ArrowLeft') {
          ev.preventDefault();
          const { index, wrapped } = computeSafeLoopIndex(idx, -1, phaseCards.length);
          const prev = phaseCards[index];
          if (prev) {
            selectedKey = prev.key;
            playEarcon(wrapped ? 'boundary' : 'nav');
            render(prev.key);
          }
        }
      });

      scroller.appendChild(cardBtn);
    });

    trackPanel.append(toolbar, scroller);

    // H. Invito al Pass Premium & Dettaglio Carta Selezionata
    const sidePanel = el('aside', 'bp-premium-panel');

    const topSide = el('div', 'bp-progress-head');
    topSide.style.flexDirection = 'column';
    topSide.style.alignItems = 'flex-start';

    topSide.append(
      el('span', 'bp-premium-kicker', state.tier === 'free' ? 'PASS STAGIONALE' : `PASS ATTIVO: ${state.tier.toUpperCase()}`),
      el(
        'h2',
        'bp-premium-title',
        state.tier === 'free'
          ? 'Sblocca il Track Premium'
          : 'Pass Premium Attivo',
      ),
      el(
        'p',
        'bp-premium-desc',
        state.tier === 'free'
          ? `Accedi a tutte le ${metrics.premiumCardsCount} ricompense Premium della Stagione 1 (Avatar esclusivi, Cornici SSL e 500 V-Card extra).`
          : 'Tutte le ricompense Premium raggiunte sono pronte per il riscatto lungo il tracciato.',
      ),
    );

    if (selectedCard) {
      const detail = el('div', 'bp-selected-detail');
      detail.append(
        el('strong', undefined, `Tier ${selectedCard.level} · ${selectedCard.label}`),
        el('span', undefined, selectedCard.description),
      );
      const claimBtn = document.createElement('button');
      claimBtn.type = 'button';
      claimBtn.className = 'bp-card-claim-btn';
      claimBtn.textContent =
        selectedCard.status === 'claimed'
          ? '✓ Già Riscattata'
          : selectedCard.status === 'available'
            ? 'Riscatta Ricompensa'
            : selectedCard.requiresPremium && state.tier === 'free'
              ? 'Richiede Pass Premium'
              : `Richiede Livello ${selectedCard.level}`;
      if (selectedCard.status !== 'available') {
        claimBtn.setAttribute('aria-disabled', 'true');
      } else {
        claimBtn.addEventListener('click', () => void handleClaimCard(selectedCard));
      }
      detail.appendChild(claimBtn);
      topSide.appendChild(detail);
    }

    const ctasWrap = el('div', 'bp-cmd-group');
    ctasWrap.style.flexDirection = 'column';

    if (state.tier === 'free') {
      const baseBtn = document.createElement('button');
      baseBtn.type = 'button';
      baseBtn.className = 'bp-premium-cta';
      baseBtn.textContent = `Ottieni Battle Pass (${BATTLE_CARD_PRICE_BASE} V-Card)`;
      baseBtn.addEventListener('click', () => void handleBuyPass('base'));

      const bundleBtn = document.createElement('button');
      bundleBtn.type = 'button';
      bundleBtn.className = 'bp-premium-secondary';
      bundleBtn.textContent = `Bundle +20 Livelli (${BATTLE_CARD_PRICE_BUNDLE_20} V-Card)`;
      bundleBtn.addEventListener('click', () => void handleBuyPass('bundle20'));
      ctasWrap.append(baseBtn, bundleBtn);
    }

    if (metrics.level < metrics.maxLevel) {
      const unlockBtn = document.createElement('button');
      unlockBtn.type = 'button';
      unlockBtn.className = 'bp-premium-secondary';
      unlockBtn.textContent = `Sblocca Tutti i Livelli (${metrics.unlockAllCostVCard} V-Card)`;
      unlockBtn.addEventListener('click', () => void handleUnlockAll());
      ctasWrap.appendChild(unlockBtn);
    }

    sidePanel.append(topSide, ctasWrap);
    mainGrid.append(trackPanel, sidePanel);

    // I. Barra comandi inferiore contestuale (Mouse + Tastiera + Controller)
    commandBar.replaceChildren();
    const leftCmds = el('div', 'bp-cmd-group');

    const cmdClaim = document.createElement('button');
    cmdClaim.type = 'button';
    cmdClaim.className = 'bp-cmd-btn';
    cmdClaim.append(el('span', 'bp-cmd-key', 'A / INVIO'), document.createTextNode(' Riscatta Tier'));
    if (!selectedCard || selectedCard.status !== 'available') {
      cmdClaim.setAttribute('aria-disabled', 'true');
    } else {
      cmdClaim.addEventListener('click', () => void handleClaimCard(selectedCard));
    }

    const cmdUnlock = document.createElement('button');
    cmdUnlock.type = 'button';
    cmdUnlock.className = 'bp-cmd-btn';
    cmdUnlock.append(
      el('span', 'bp-cmd-key', 'X'),
      document.createTextNode(state.tier === 'free' ? ' Pass Premium' : ' Sblocca Tutto'),
    );
    if (state.tier === 'free') {
      cmdUnlock.addEventListener('click', () => void handleBuyPass('base'));
    } else if (metrics.level < metrics.maxLevel) {
      cmdUnlock.addEventListener('click', () => void handleUnlockAll());
    } else {
      cmdUnlock.setAttribute('aria-disabled', 'true');
    }

    const cmdDetail = document.createElement('button');
    cmdDetail.type = 'button';
    cmdDetail.className = 'bp-cmd-btn';
    cmdDetail.append(el('span', 'bp-cmd-key', 'Y'), document.createTextNode(' Dettagli Ricompensa'));
    cmdDetail.addEventListener('click', () => {
      if (selectedCard) {
        setFeedback(`Tier ${selectedCard.level} (${selectedCard.track.toUpperCase()}): ${selectedCard.label} — ${selectedCard.description}`);
      }
    });

    leftCmds.append(cmdClaim, cmdUnlock, cmdDetail);

    const rightCmds = el('div', 'bp-cmd-group');
    const cmdBack = document.createElement('button');
    cmdBack.type = 'button';
    cmdBack.className = 'bp-cmd-btn';
    cmdBack.append(el('span', 'bp-cmd-key', 'B / ESC'), document.createTextNode(' Indietro'));
    cmdBack.addEventListener('click', () => {
      window.location.hash = '#gioca';
    });
    rightCmds.appendChild(cmdBack);

    commandBar.append(leftCmds, rightCmds);

    if (focusKey) {
      const target = scroller.querySelector<HTMLElement>(`[data-card-key="${focusKey}"]`);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    } else if (selectedCard) {
      const selectedEl = scroller.querySelector<HTMLElement>(`[data-card-key="${selectedCard.key}"]`);
      selectedEl?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    }
  };

  root.addEventListener('keydown', (ev) => {
    if (hasBlockedModifier(ev)) return;
    const lower = ev.key.toLowerCase();
    if (lower === 'q') {
      ev.preventDefault();
      const idx = BATTLE_PASS_PHASES.findIndex((p) => p.id === activePhase);
      const { index } = computeSafeLoopIndex(idx, -1, BATTLE_PASS_PHASES.length);
      activePhase = BATTLE_PASS_PHASES[index]?.id ?? 'pre-season';
      selectedKey = null;
      playEarcon('nav');
      render();
    } else if (lower === 'e') {
      ev.preventDefault();
      const idx = BATTLE_PASS_PHASES.findIndex((p) => p.id === activePhase);
      const { index } = computeSafeLoopIndex(idx, 1, BATTLE_PASS_PHASES.length);
      activePhase = BATTLE_PASS_PHASES[index]?.id ?? 'pre-season';
      selectedKey = null;
      playEarcon('nav');
      render();
    }
  });

  render();
  void refreshFromServer()
    .then(() => render())
    .catch(() => {});

  root.append(subnav, hero, progressGrid, feedbackEl, mainGrid, commandBar);
  return root;
}
