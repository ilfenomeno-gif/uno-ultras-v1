// ============================================================
// UNO ULTRA Client — Arcade Cosmetic Shop View (ASTRALIS v3)
// ============================================================

import { CATALOG_ITEMS, type CatalogItem } from '@uno/shared';
import { announce } from '../../core/aria-live.js';
import { playEarcon } from '../../core/audio-earcons.js';
import {
  computeSafeLoopIndex,
  hasBlockedModifier,
} from '../../core/keyboard-nav.js';
import { fetchBalances, purchaseShopItem } from '../../net/tcp/rest-client.js';
import { getEconomySnapshot, setEconomySnapshot } from '../../state/inventory-store.js';
import { patchProfile } from '../../state/profile-store.js';
import { getShopItemArtworkSvg } from './shop-artworks.js';

type ShopFilter = 'all' | 'daily' | 'cosmetics' | 'crates';

const FILTER_OPTIONS: ReadonlyArray<{ id: ShopFilter; label: string }> = [
  { id: 'all', label: 'Tutti' },
  { id: 'daily', label: 'Rotazione Oggi' },
  { id: 'cosmetics', label: 'Cosmetici' },
  { id: 'crates', label: 'Casse' },
];

function filterCatalogItems(filter: ShopFilter): readonly CatalogItem[] {
  switch (filter) {
    case 'daily':
      return CATALOG_ITEMS.filter((item) => Boolean(item.isDailyRotation));
    case 'cosmetics':
      return CATALOG_ITEMS.filter((item) => item.category !== 'crate');
    case 'crates':
      return CATALOG_ITEMS.filter((item) => item.category === 'crate');
    case 'all':
      return CATALOG_ITEMS;
  }
}

export function createShopView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section shop-stage';
  root.setAttribute('aria-label', 'Negozio Cosmetico Arcade');

  let activeFilter: ShopFilter = 'all';

  const headerStrip = document.createElement('div');
  headerStrip.className = 'shop-header-strip';

  const titleBlock = document.createElement('div');
  titleBlock.className = 'shop-title-block';
  const heading = document.createElement('h2');
  heading.className = 'shop-heading';
  heading.textContent = 'NEGOZIO COSMETICO';
  const subtitle = document.createElement('span');
  subtitle.className = 'shop-subtitle';
  subtitle.textContent = 'Rotazione Giornaliera & Casse';
  titleBlock.append(heading, subtitle);

  const walletHud = document.createElement('div');
  walletHud.className = 'shop-wallet-hud';

  const vcardPill = document.createElement('span');
  vcardPill.className = 'shop-currency-badge shop-currency-badge--vcard';
  const tournamentPill = document.createElement('span');
  tournamentPill.className = 'shop-currency-badge shop-currency-badge--tournament';
  const cratesPill = document.createElement('span');
  cratesPill.className = 'shop-currency-badge shop-currency-badge--crates';

  walletHud.append(vcardPill, tournamentPill, cratesPill);
  headerStrip.append(titleBlock, walletHud);

  const filterBar = document.createElement('div');
  filterBar.className = 'shop-filter-bar';
  filterBar.setAttribute('role', 'tablist');
  filterBar.setAttribute('aria-label', 'Filtri negozio');

  const feedback = document.createElement('div');
  feedback.className = 'tab-feedback shop-feedback';

  const grid = document.createElement('div');
  grid.className = 'shop-showcase-grid';

  const updateWalletHeader = (): void => {
    const snap = getEconomySnapshot();
    const specialCrates = CATALOG_ITEMS.filter((i) => i.category === 'crate').length;
    vcardPill.textContent = `${snap.vcard} V-Card`;
    tournamentPill.textContent = `${snap.tournamentCredits} Crediti Torneo`;
    cratesPill.textContent = `${specialCrates} Casse Speciali`;
  };

  const renderCard = (item: CatalogItem): HTMLElement => {
    const snap = getEconomySnapshot();
    const owned = snap.items.find((i) => i.itemId === item.id);

    const card = document.createElement('article');
    card.className = `shop-item-card shop-item-card--${item.rarity}`;
    card.dataset['rarity'] = item.rarity;

    const badgesRow = document.createElement('div');
    badgesRow.className = 'shop-card-badges';

    const rarityPill = document.createElement('span');
    rarityPill.className = `shop-rarity-pill shop-rarity-pill--${item.rarity}`;
    rarityPill.textContent = item.rarity.toUpperCase();
    badgesRow.appendChild(rarityPill);

    if (item.isDailyRotation) {
      const todayPill = document.createElement('span');
      todayPill.className = 'shop-tag-pill shop-tag-pill--daily';
      todayPill.textContent = 'OGGI';
      badgesRow.appendChild(todayPill);
    } else if (owned && owned.quantity > 0) {
      const ownedPill = document.createElement('span');
      ownedPill.className = 'shop-tag-pill shop-tag-pill--owned';
      ownedPill.textContent = `×${owned.quantity}`;
      badgesRow.appendChild(ownedPill);
    } else if (item.category === 'crate') {
      const cratePill = document.createElement('span');
      cratePill.className = 'shop-tag-pill shop-tag-pill--crate';
      cratePill.textContent = 'CASSA';
      badgesRow.appendChild(cratePill);
    }

    const artStage = document.createElement('div');
    artStage.className = `shop-item-art shop-item-art--${item.rarity}`;
    artStage.innerHTML = getShopItemArtworkSvg(item.id, item.category);

    const body = document.createElement('div');
    body.className = 'shop-item-body';

    const title = document.createElement('h3');
    title.className = 'shop-item-title';
    title.textContent = item.name;

    const desc = document.createElement('p');
    desc.className = 'shop-item-desc';
    desc.textContent = item.description;

    const price = document.createElement('div');
    price.className = 'shop-item-price';
    price.textContent = `${item.priceVCard} V-Card`;

    body.append(title, desc, price);

    const buyBtn = document.createElement('button');
    buyBtn.type = 'button';
    buyBtn.className = `shop-buy-btn shop-buy-btn--${item.rarity}`;
    buyBtn.textContent = 'Acquista';
    buyBtn.setAttribute(
      'aria-label',
      `Acquista ${item.name}, rarità ${item.rarity}, ${item.priceVCard} V-Card`
    );

    let pendingPurchase = false;
    buyBtn.addEventListener('click', async () => {
      if (pendingPurchase) return;
      pendingPurchase = true;
      buyBtn.setAttribute('aria-disabled', 'true');
      buyBtn.classList.add('is-disabled');
      buyBtn.textContent = 'Acquisto…';
      try {
        const res = await purchaseShopItem(item.id);
        const cur = getEconomySnapshot();
        const existing = cur.items.find((i) => i.itemId === item.id);
        const nextItems = existing
          ? cur.items.map((i) =>
              i.itemId === item.id ? { ...i, quantity: res.quantityAfter } : i
            )
          : [
              ...cur.items,
              { itemId: item.id, category: item.category, quantity: res.quantityAfter },
            ];
        setEconomySnapshot({ ...cur, vcard: res.vcardAfter, items: nextItems });
        patchProfile({ vcard: res.vcardAfter });
        const msg = res.duplicate
          ? `${item.name} acquisito (×${res.quantityAfter}) — Rimborso doppione +${res.refundVCard} V-Card!`
          : `${item.name} sbloccato nell'Armadietto!`;
        feedback.textContent = msg;
        playEarcon('confirm');
        announce(msg, 'polite');
        renderGrid();
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : 'Acquisto non riuscito (server non raggiungibile).';
        feedback.textContent = errMsg;
        playEarcon('error');
        announce(errMsg, 'assertive');
      } finally {
        pendingPurchase = false;
        buyBtn.removeAttribute('aria-disabled');
        buyBtn.classList.remove('is-disabled');
        buyBtn.textContent = 'Acquista';
        updateWalletHeader();
      }
    });

    card.append(badgesRow, artStage, body, buyBtn);
    return card;
  };

  const renderGrid = (): void => {
    grid.innerHTML = '';
    for (const item of filterCatalogItems(activeFilter)) {
      grid.appendChild(renderCard(item));
    }
  };

  const renderFilters = (focusActive = false): void => {
    filterBar.innerHTML = '';
    for (const opt of FILTER_OPTIONS) {
      const selected = opt.id === activeFilter;
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `shop-filter-pill${selected ? ' active' : ''}`;
      pill.textContent = opt.label;
      pill.setAttribute('role', 'tab');
      pill.setAttribute('aria-selected', String(selected));
      pill.tabIndex = selected ? 0 : -1;
      pill.addEventListener('click', () => {
        if (activeFilter === opt.id) return;
        activeFilter = opt.id;
        playEarcon('nav');
        announce(`Filtro negozio: ${opt.label}`, 'polite');
        renderFilters(true);
        renderGrid();
      });
      filterBar.appendChild(pill);
      if (focusActive && selected) {
        pill.focus();
      }
    }
  };

  filterBar.addEventListener('keydown', (ev) => {
    if (hasBlockedModifier(ev)) return;
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    ev.preventDefault();
    const curIdx = FILTER_OPTIONS.findIndex((o) => o.id === activeFilter);
    const delta = ev.key === 'ArrowRight' ? 1 : -1;
    const { index, wrapped } = computeSafeLoopIndex(curIdx, delta, FILTER_OPTIONS.length);
    const next = FILTER_OPTIONS[index];
    if (next) {
      activeFilter = next.id;
      playEarcon(wrapped ? 'boundary' : 'nav');
      announce(`Filtro negozio: ${next.label}`, 'polite');
      renderFilters(true);
      renderGrid();
    }
  });

  updateWalletHeader();
  renderFilters();
  renderGrid();

  void fetchBalances()
    .then((b) => {
      const cur = getEconomySnapshot();
      setEconomySnapshot({
        ...cur,
        vcard: b.vcard,
        tournamentCredits: b.tournamentCredits,
      });
      updateWalletHeader();
    })
    .catch(() => {});

  root.append(headerStrip, filterBar, feedback, grid);
  return root;
}
