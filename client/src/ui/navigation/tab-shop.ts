// ============================================================
// UNO ULTRA Client — Negozio Tab (Shop + Daily Rotation + Crates)
// ============================================================

import { CATALOG_ITEMS, type CatalogItem } from '@uno/shared';
import { fetchBalances, purchaseShopItem } from '../../net/tcp/rest-client.js';
import { getEconomySnapshot, setEconomySnapshot } from '../../state/inventory-store.js';
import { patchProfile } from '../../state/profile-store.js';

export function createShopView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section';

  const statusBar = document.createElement('div');
  statusBar.className = 'tab-status-bar glass-panel';
  statusBar.setAttribute('aria-live', 'polite');

  const updateWalletHeader = (): void => {
    const snap = getEconomySnapshot();
    statusBar.innerHTML = `
      <div><strong>NEGOZIO COSMETICO</strong> — Rotazione Giornaliera & Casse</div>
      <div class="wallet-pills">
        <span class="ultra-badge ultra-badge--gold">${snap.vcard} V-Card</span>
        <span class="ultra-badge ultra-badge--info">${snap.tournamentCredits} Crediti Torneo</span>
      </div>
    `;
  };
  updateWalletHeader();

  const feedback = document.createElement('div');
  feedback.className = 'tab-feedback';

  const grid = document.createElement('div');
  grid.className = 'shop-grid';

  const renderCard = (item: CatalogItem): HTMLElement => {
    const card = document.createElement('article');
    card.className = `ultra-card glass-panel rarity-${item.rarity}`;
    card.innerHTML = `
      <div class="card-top-row">
        <span class="ultra-badge">${item.rarity.toUpperCase()}</span>
        ${item.isDailyRotation ? '<span class="ultra-badge ultra-badge--gold">OGGI</span>' : ''}
      </div>
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <div class="price-pill">${item.priceVCard} V-Card</div>
    `;

    const buyBtn = document.createElement('button');
    buyBtn.type = 'button';
    buyBtn.className = 'ultra-btn ultra-btn--primary';
    buyBtn.textContent = 'Acquista';
    buyBtn.addEventListener('click', async () => {
      buyBtn.disabled = true;
      try {
        const res = await purchaseShopItem(item.id);
        const cur = getEconomySnapshot();
        const existing = cur.items.find((i) => i.itemId === item.id);
        const nextItems = existing
          ? cur.items.map((i) => (i.itemId === item.id ? { ...i, quantity: res.quantityAfter } : i))
          : [...cur.items, { itemId: item.id, category: item.category, quantity: res.quantityAfter }];
        setEconomySnapshot({ ...cur, vcard: res.vcardAfter, items: nextItems });
        patchProfile({ vcard: res.vcardAfter });
        feedback.textContent = res.duplicate
          ? `${item.name} acquisito (×${res.quantityAfter}) — Rimborso doppione +${res.refundVCard} V-Card!`
          : `${item.name} sbloccato nell'Armadietto!`;
      } catch (err) {
        feedback.textContent =
          err instanceof Error ? err.message : 'Acquisto non riuscito (server non raggiungibile).';
      } finally {
        updateWalletHeader();
        buyBtn.disabled = false;
      }
    });
    card.appendChild(buyBtn);
    return card;
  };

  for (const item of CATALOG_ITEMS) {
    grid.appendChild(renderCard(item));
  }

  void fetchBalances()
    .then((b) => {
      const cur = getEconomySnapshot();
      setEconomySnapshot({ ...cur, vcard: b.vcard, tournamentCredits: b.tournamentCredits });
      updateWalletHeader();
    })
    .catch(() => {});

  root.append(statusBar, feedback, grid);
  return root;
}
