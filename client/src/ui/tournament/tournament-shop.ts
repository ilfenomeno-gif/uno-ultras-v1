// ============================================================
// UNO ULTRA Client — Tournament Reward Crates Shop (100/500/1000)
// ============================================================

import { openTournamentCrate } from '../../net/tcp/rest-client.js';
import { getEconomySnapshot, setEconomySnapshot } from '../../state/inventory-store.js';

const CRATE_CARDS = [
  { id: 'crate_bronze_100', title: 'Cassa Bronzo', price: 100, desc: 'Comune / Raro garantito' },
  { id: 'crate_silver_500', title: 'Cassa Argento', price: 500, desc: 'Epico / Leggendario garantito' },
  { id: 'crate_ssl_1000', title: 'Cassa SSL', price: 1000, desc: 'Leggendario / Mitico garantito' },
] as const;

export function createTournamentShopPanel(onStatus: (msg: string) => void): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'tournament-shop-grid';

  for (const crate of CRATE_CARDS) {
    const card = document.createElement('div');
    card.className = 'ultra-card glass-panel';
    card.innerHTML = `
      <h4>${crate.title}</h4>
      <p>${crate.desc}</p>
      <div class="price-pill">${crate.price} V-Card</div>
    `;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ultra-btn ultra-btn--primary';
    btn.textContent = 'Apri Cassa';
    btn.addEventListener('click', async () => {
      try {
        const res = await openTournamentCrate(crate.id);
        const eco = getEconomySnapshot();
        setEconomySnapshot({ ...eco, vcard: res.vcardAfter });
        onStatus(
          `Estratto: ${res.droppedItem.name} (${res.droppedItem.rarity})${
            res.duplicate ? ` — Doppione rimborsato +${res.refundVCard} V-Card` : ''
          }`,
        );
      } catch (err) {
        onStatus(err instanceof Error ? err.message : 'Apertura cassa in modalita offline non disponibile');
      }
    });
    card.appendChild(btn);
    grid.appendChild(card);
  }
  return grid;
}
