// ============================================================
// UNO ULTRA Client — Armadietto Tab (Loadout & ×N Duplicates)
// ============================================================

import { CATALOG_BY_ID } from '@uno/shared';
import { equipInventoryItem, fetchInventory } from '../../net/tcp/rest-client.js';
import {
  getEconomySnapshot,
  setEconomySnapshot,
  type ClientLoadout,
} from '../../state/inventory-store.js';

export function createLockerView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section';

  const header = document.createElement('div');
  header.className = 'tab-status-bar glass-panel';
  const grid = document.createElement('div');
  grid.className = 'shop-grid';
  const feedback = document.createElement('div');
  feedback.className = 'tab-feedback';

  const paint = (): void => {
    const snap = getEconomySnapshot();
    header.innerHTML = '';
    const titleWrap = document.createElement('div');
    const titleStrong = document.createElement('strong');
    titleStrong.textContent = 'ARMADIETTO COSMETICI';
    titleWrap.appendChild(titleStrong);

    const pillsWrap = document.createElement('div');
    pillsWrap.className = 'wallet-pills';
    const slotsMeta: Array<[string, string]> = [
      ['Avatar', snap.loadout.avatar],
      ['Cornice', snap.loadout.frame],
      ['Dorso', snap.loadout.cardStyle],
      ['Titolo', snap.loadout.title],
    ];
    for (const [label, value] of slotsMeta) {
      const span = document.createElement('span');
      span.textContent = `${label}: `;
      const bold = document.createElement('b');
      bold.textContent = value;
      span.appendChild(bold);
      pillsWrap.appendChild(span);
    }
    header.append(titleWrap, pillsWrap);
    grid.innerHTML = '';

    for (const entry of snap.items) {
      if (entry.category === 'crate') continue;
      const meta = CATALOG_BY_ID[entry.itemId];
      const slot =
        entry.category === 'avatar'
          ? 'avatar'
          : entry.category === 'frame'
            ? 'frame'
            : entry.category === 'card_back'
              ? 'card_back'
              : 'title';

      const card = document.createElement('article');
      card.className = 'ultra-card glass-panel';
      const topRow = document.createElement('div');
      topRow.className = 'card-top-row';
      const catBadge = document.createElement('span');
      catBadge.className = 'ultra-badge';
      catBadge.textContent = entry.category.toUpperCase();
      const qtyBadge = document.createElement('span');
      qtyBadge.className = 'ultra-badge ultra-badge--gold';
      qtyBadge.textContent = `×${entry.quantity}`;
      topRow.append(catBadge, qtyBadge);

      const h3 = document.createElement('h3');
      h3.textContent = meta?.name ?? entry.itemId;
      const pDesc = document.createElement('p');
      pDesc.textContent = meta?.description ?? 'Cosmetico sbloccato';
      card.append(topRow, h3, pDesc);

      const isEquipped =
        snap.loadout.avatar === entry.itemId ||
        snap.loadout.frame === entry.itemId ||
        snap.loadout.cardStyle === entry.itemId ||
        snap.loadout.title === entry.itemId;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ultra-btn ${isEquipped ? 'ultra-btn--ghost' : 'ultra-btn--primary'}`;
      btn.textContent = isEquipped ? 'Equipaggiato' : 'Equipaggia';
      btn.disabled = isEquipped;
      btn.addEventListener('click', async () => {
        try {
          const res = await equipInventoryItem(slot, entry.itemId);
          setEconomySnapshot({ ...getEconomySnapshot(), loadout: res.loadout });
        } catch {
          const cur = getEconomySnapshot();
          const nextLoadout: ClientLoadout = { ...cur.loadout };
          if (slot === 'avatar') nextLoadout.avatar = entry.itemId;
          if (slot === 'frame') nextLoadout.frame = entry.itemId;
          if (slot === 'card_back') nextLoadout.cardStyle = entry.itemId;
          if (slot === 'title') nextLoadout.title = entry.itemId;
          setEconomySnapshot({ ...cur, loadout: nextLoadout });
        }
        feedback.textContent = `Equipaggiato ${meta?.name ?? entry.itemId}!`;
        paint();
      });

      card.appendChild(btn);
      grid.appendChild(card);
    }
  };

  paint();
  void fetchInventory()
    .then((res) => {
      const cur = getEconomySnapshot();
      setEconomySnapshot({
        ...cur,
        loadout: res.loadout,
        items: res.items.map((r) => ({
          itemId: r.item_id,
          category: r.category,
          quantity: r.quantity,
        })),
      });
      paint();
    })
    .catch(() => {});

  root.append(header, feedback, grid);
  return root;
}
