// ============================================================
// UNO ULTRA Client — V-Card Currency Store (4 Escalating Packs)
// ============================================================

import { VCARD_PACKS, type VCardPackDefinition } from '@uno/shared';
import { announce } from '../../core/aria-live.js';
import { playEarcon } from '../../core/audio-earcons.js';
import {
  fetchBalances,
  fetchVCardPacks,
  grantDevVCardPack,
} from '../../net/tcp/rest-client.js';
import { getEconomySnapshot, setEconomySnapshot } from '../../state/inventory-store.js';
import { patchProfile } from '../../state/profile-store.js';
import {
  getVCardPackActionState,
  getVCardPackArtworkSvg,
} from './vcard-artworks.js';

export function createVCardView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section vcard-stage';
  root.setAttribute('aria-label', 'Store Valuta V-Card');

  let devGrantsEnabled = false;
  let busyPackId: string | null = null;
  let statusMessage = '';

  const headerStrip = document.createElement('header');
  headerStrip.className = 'vcard-header-strip';

  const titleBlock = document.createElement('div');
  titleBlock.className = 'vcard-title-block';
  const heading = document.createElement('h2');
  heading.className = 'vcard-heading';
  heading.textContent = 'STORE V-CARD';
  const sub = document.createElement('span');
  sub.className = 'vcard-subtitle';
  sub.textContent =
    'Pacchetti valuta per sbloccare cosmetici nel Negozio e la Battle Card Stagione 1.';
  titleBlock.append(heading, sub);

  const walletSide = document.createElement('div');
  walletSide.className = 'vcard-wallet-side';

  const balancePill = document.createElement('span');
  balancePill.className = 'shop-currency-badge shop-currency-badge--vcard vcard-balance-pill';
  const modePill = document.createElement('span');
  modePill.className = 'vcard-mode-pill';
  walletSide.append(balancePill, modePill);

  headerStrip.append(titleBlock, walletSide);

  const feedback = document.createElement('div');
  feedback.className = 'tab-feedback vcard-feedback';

  const packsGrid = document.createElement('div');
  packsGrid.className = 'vcard-packs-grid';

  const footerNote = document.createElement('p');
  footerNote.className = 'vcard-footer-note';
  footerNote.textContent =
    'Nota: i 7 tavoli Mini-Giochi (Blackjack 21, Scala 40, Ruba Mazzetto, Scopa, Poker Texas, Burraco, Mille Miglia) restano avviabili dal launcher nella scheda Gioca.';

  const updateHeader = (): void => {
    const snap = getEconomySnapshot();
    balancePill.textContent = `${snap.vcard.toLocaleString('it-IT')} V-Card`;
    modePill.textContent = devGrantsEnabled
      ? 'MODALITÀ TEST ATTIVA'
      : 'PAGAMENTI IN ARRIVO';
    modePill.classList.toggle('is-dev', devGrantsEnabled);
  };

  const handlePackClick = async (pack: VCardPackDefinition): Promise<void> => {
    if (busyPackId !== null) return;
    if (!devGrantsEnabled) {
      statusMessage =
        'Pagamenti reali non ancora attivi in questo ambiente. Guadagna V-Card giocando, completando Sfide o salendo nella Battle Card.';
      feedback.textContent = statusMessage;
      playEarcon('error');
      announce('Pagamenti non ancora attivi', 'assertive');
      return;
    }

    busyPackId = pack.id;
    renderPacks();
    try {
      const res = await grantDevVCardPack(pack.id);
      const cur = getEconomySnapshot();
      setEconomySnapshot({ ...cur, vcard: res.vcardAfter });
      patchProfile({ vcard: res.vcardAfter });
      statusMessage = `Accredito test completato: +${res.vcardAdded.toLocaleString('it-IT')} V-Card (saldo attuale: ${res.vcardAfter.toLocaleString('it-IT')} V-Card).`;
      playEarcon('win');
      announce(statusMessage, 'polite');
    } catch (err) {
      statusMessage =
        err instanceof Error ? err.message : 'Pagamenti non ancora attivi';
      playEarcon('error');
      announce(statusMessage, 'assertive');
    } finally {
      busyPackId = null;
      feedback.textContent = statusMessage;
      updateHeader();
      renderPacks();
    }
  };

  const renderPacks = (): void => {
    packsGrid.innerHTML = '';

    for (const pack of VCARD_PACKS) {
      const isBusy = busyPackId === pack.id;
      const actionState = getVCardPackActionState(devGrantsEnabled, pack.priceDisplay);

      const card = document.createElement('article');
      card.className = `vcard-pack-card shop-item-card shop-item-card--${pack.rarity}`;

      const topRow = document.createElement('div');
      topRow.className = 'shop-card-badges';
      const rarityPill = document.createElement('span');
      rarityPill.className = `shop-rarity-pill shop-rarity-pill--${pack.rarity}`;
      rarityPill.textContent = pack.rarity.toUpperCase();
      topRow.appendChild(rarityPill);

      if (pack.badge) {
        const promoPill = document.createElement('span');
        promoPill.className = 'shop-tag-pill shop-tag-pill--daily';
        promoPill.textContent = pack.badge;
        topRow.appendChild(promoPill);
      }

      const artStage = document.createElement('div');
      artStage.className = `vcard-pack-art shop-item-art shop-item-art--${pack.rarity}`;
      artStage.innerHTML = getVCardPackArtworkSvg(pack.id);

      const body = document.createElement('div');
      body.className = 'vcard-pack-body';

      const title = document.createElement('h3');
      title.className = 'shop-item-title';
      title.textContent = pack.title;

      const amountBox = document.createElement('div');
      amountBox.className = 'vcard-amount-row';
      const baseSpan = document.createElement('strong');
      baseSpan.className = 'vcard-base-amount';
      baseSpan.textContent = `${pack.baseVCard.toLocaleString('it-IT')} V-Card`;
      amountBox.appendChild(baseSpan);

      if (pack.bonusVCard > 0) {
        const bonusSpan = document.createElement('span');
        bonusSpan.className = 'vcard-bonus-pill';
        bonusSpan.textContent = `+${pack.bonusVCard.toLocaleString('it-IT')} BONUS`;
        amountBox.appendChild(bonusSpan);
      }

      const desc = document.createElement('p');
      desc.className = 'shop-item-desc';
      desc.textContent = pack.subtitle;

      const priceEl = document.createElement('div');
      priceEl.className = 'vcard-price-tag';
      priceEl.textContent = pack.priceDisplay;

      body.append(title, amountBox, desc, priceEl);

      const ctaBtn = document.createElement('button');
      ctaBtn.type = 'button';
      ctaBtn.className = `vcard-pack-btn shop-buy-btn shop-buy-btn--${pack.rarity}${
        !actionState.actionable || isBusy ? ' is-disabled' : ''
      }`;
      ctaBtn.textContent = isBusy ? 'Elaborazione…' : actionState.label;
      ctaBtn.setAttribute(
        'aria-label',
        `${pack.title}, ${pack.totalVCard} V-Card, ${pack.priceDisplay}: ${actionState.label}`,
      );
      if (!actionState.actionable || isBusy) {
        ctaBtn.setAttribute('aria-disabled', 'true');
      }
      ctaBtn.addEventListener('click', () => void handlePackClick(pack));

      card.append(topRow, artStage, body, ctaBtn);
      packsGrid.appendChild(card);
    }
  };

  updateHeader();
  renderPacks();

  void fetchBalances()
    .then((b) => {
      const cur = getEconomySnapshot();
      setEconomySnapshot({
        ...cur,
        vcard: b.vcard,
        tournamentCredits: b.tournamentCredits,
      });
      updateHeader();
    })
    .catch(() => {});

  void fetchVCardPacks()
    .then((res) => {
      devGrantsEnabled = res.devGrantsEnabled;
      updateHeader();
      renderPacks();
    })
    .catch(() => {});

  root.append(headerStrip, feedback, packsGrid, footerNote);
  return root;
}
