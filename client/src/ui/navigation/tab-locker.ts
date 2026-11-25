// ============================================================
// UNO ULTRA Client — 3-Column Holographic Armadietto (Locker)
// ============================================================

import {
  CATALOG_BY_ID,
  LEGACY_TITLES,
  LEGACY_TITLES_BY_ID,
  type CosmeticRarity,
  type LegacyTitleCategory,
} from '@uno/shared';
import { announce } from '../../core/aria-live.js';
import { playEarcon } from '../../core/audio-earcons.js';
import { computeSafeLoopIndex, hasBlockedModifier } from '../../core/keyboard-nav.js';
import {
  equipInventoryItem,
  fetchInventory,
  openTournamentCrate,
} from '../../net/tcp/rest-client.js';
import {
  getEconomySnapshot,
  setEconomySnapshot,
  type ClientInventoryEntry,
  type ClientLoadout,
} from '../../state/inventory-store.js';
import { patchProfile } from '../../state/profile-store.js';
import { getShopItemArtworkSvg } from './shop-artworks.js';
import {
  filterOwnedByCategory,
  getPedestalActionState,
  isItemEquippedInLoadout,
  LOCKER_CATEGORIES,
  type LockerCategoryId,
} from './locker-helpers.js';

type CrateId = 'crate_bronze_100' | 'crate_silver_500' | 'crate_ssl_1000';

function isCrateId(id: string): id is CrateId {
  return id === 'crate_bronze_100' || id === 'crate_silver_500' || id === 'crate_ssl_1000';
}

const TITLE_FILTER_CHIPS: ReadonlyArray<{ id: 'all' | LegacyTitleCategory; label: string }> = [
  { id: 'all', label: 'Tutte (334)' },
  { id: 'rank', label: 'Rank' },
  { id: 'ucs', label: 'UCS' },
  { id: 'uno', label: 'UNO' },
  { id: 'scala40', label: 'Scala 40' },
  { id: 'ruba', label: 'Ruba Mazzetto' },
  { id: 'blackjack', label: 'Blackjack' },
  { id: 'club', label: 'Club' },
  { id: 'multi', label: 'Multi-Modalità' },
  { id: 'battlepass', label: 'Battle Pass' },
  { id: 'special', label: 'Speciali' },
];

function resolveItemRarity(itemId: string): CosmeticRarity {
  return CATALOG_BY_ID[itemId]?.rarity ?? LEGACY_TITLES_BY_ID[itemId]?.rarity ?? 'common';
}

function resolveDisplayName(itemId: string | undefined): string {
  if (!itemId) return 'Predefinito';
  return CATALOG_BY_ID[itemId]?.name ?? LEGACY_TITLES_BY_ID[itemId]?.name ?? 'Predefinito';
}

function resolveDisplayDesc(itemId: string): string {
  return (
    CATALOG_BY_ID[itemId]?.description ??
    LEGACY_TITLES_BY_ID[itemId]?.description ??
    'Cosmetico sbloccato nel tuo profilo.'
  );
}

export function createLockerView(): HTMLElement {
  const root = document.createElement('section');
  root.className = 'tab-section locker-stage';
  root.setAttribute('aria-label', 'Armadietto Cosmetici');

  let activeCategory: LockerCategoryId = 'avatar';
  let activeTitleGroup: 'all' | LegacyTitleCategory = 'all';
  let selectedItemId: string | null = null;
  let busyAction = false;
  let statusMessage = '';

  const layout = document.createElement('div');
  layout.className = 'locker-layout';

  const sidebar = document.createElement('aside');
  sidebar.className = 'locker-sidebar';

  const pedestalCol = document.createElement('div');
  pedestalCol.className = 'locker-pedestal-col';

  const gridCol = document.createElement('div');
  gridCol.className = 'locker-grid-col';

  layout.append(sidebar, pedestalCol, gridCol);
  root.appendChild(layout);

  const pickDefaultSelection = (
    category: LockerCategoryId,
    items: readonly ClientInventoryEntry[],
    loadout: ClientLoadout
  ): string | null => {
    if (items.length === 0) return null;
    const equippedEntry = items.find((entry) =>
      isItemEquippedInLoadout(entry.itemId, category, loadout)
    );
    return (equippedEntry ?? items[0])?.itemId ?? null;
  };

  const applyEquippedItem = async (
    category: Exclude<LockerCategoryId, 'crate'>,
    itemId: string
  ): Promise<void> => {
    if (busyAction) return;
    busyAction = true;
    const displayName = CATALOG_BY_ID[itemId]?.name ?? itemId;
    paint();

    try {
      if (category === 'theme') {
        const cur = getEconomySnapshot();
        setEconomySnapshot({
          ...cur,
          loadout: { ...cur.loadout, theme: itemId },
        });
        if (typeof document !== 'undefined' && document.body) {
          document.body.dataset['arenaTheme'] = itemId;
        }
      } else {
        try {
          const res = await equipInventoryItem(category, itemId);
          const cur = getEconomySnapshot();
          setEconomySnapshot({
            ...cur,
            loadout: {
              ...res.loadout,
              ...(cur.loadout.theme ? { theme: cur.loadout.theme } : {}),
            },
          });
        } catch {
          const cur = getEconomySnapshot();
          const nextLoadout: ClientLoadout = { ...cur.loadout };
          if (category === 'avatar') nextLoadout.avatar = itemId;
          if (category === 'frame') nextLoadout.frame = itemId;
          if (category === 'card_back') nextLoadout.cardStyle = itemId;
          if (category === 'title') nextLoadout.title = itemId;
          setEconomySnapshot({ ...cur, loadout: nextLoadout });
        }
      }
      statusMessage = `Equipaggiato ${displayName}!`;
      playEarcon('confirm');
      announce(statusMessage, 'polite');
    } finally {
      busyAction = false;
      paint();
    }
  };

  const redeemCrate = async (crateId: string): Promise<void> => {
    if (busyAction || !isCrateId(crateId)) return;
    busyAction = true;
    statusMessage = 'Apertura cassa in corso…';
    paint();

    try {
      const res = await openTournamentCrate(crateId);
      const cur = getEconomySnapshot();
      setEconomySnapshot({ ...cur, vcard: res.vcardAfter });
      patchProfile({ vcard: res.vcardAfter });

      try {
        const inv = await fetchInventory();
        const latest = getEconomySnapshot();
        setEconomySnapshot({
          ...latest,
          loadout: {
            ...inv.loadout,
            theme: latest.loadout.theme ?? 'theme_default',
          },
          items: inv.items.map((r) => ({
            itemId: r.item_id,
            category: r.category,
            quantity: r.quantity,
          })),
        });
      } catch {
        // non-fatal if refresh fails
      }

      statusMessage = `Estratto: ${res.droppedItem.name} (${res.droppedItem.rarity.toUpperCase()})${
        res.duplicate ? ` — Doppione rimborsato +${res.refundVCard} V-Card` : ''
      }`;
      playEarcon('win');
      announce(statusMessage, 'assertive');
    } catch (err) {
      statusMessage =
        err instanceof Error ? err.message : 'Apertura cassa non riuscita.';
      playEarcon('error');
      announce(statusMessage, 'assertive');
    } finally {
      busyAction = false;
      paint();
    }
  };

  const getEntriesForCategory = (
    items: readonly ClientInventoryEntry[],
    category: LockerCategoryId,
  ): ClientInventoryEntry[] => {
    const owned = filterOwnedByCategory(items, category);
    if (category !== 'title') return owned;
    const seen = new Set(owned.map((e) => e.itemId));
    const merged: ClientInventoryEntry[] = [...owned];
    for (const t of LEGACY_TITLES) {
      if (seen.has(t.id)) continue;
      if (activeTitleGroup !== 'all' && t.category !== activeTitleGroup) continue;
      merged.push({ itemId: t.id, category: 'title', quantity: 1 });
    }
    return merged;
  };

  const paint = (focusActiveCategory = false): void => {
    const snap = getEconomySnapshot();
    const categoryItems = getEntriesForCategory(snap.items, activeCategory);
    if (
      !selectedItemId ||
      !categoryItems.some((entry) => entry.itemId === selectedItemId)
    ) {
      selectedItemId = pickDefaultSelection(
        activeCategory,
        categoryItems,
        snap.loadout
      );
    }

    const selectedEntry =
      categoryItems.find((entry) => entry.itemId === selectedItemId) ?? null;

    // ── Left Column: Categories & Active Loadout ─────────────────
    sidebar.innerHTML = '';

    const sideHead = document.createElement('div');
    sideHead.className = 'locker-sidebar-head';
    const sideTitle = document.createElement('h2');
    sideTitle.className = 'locker-sidebar-title';
    sideTitle.textContent = 'ARMADIETTO';
    const sideSub = document.createElement('span');
    sideSub.className = 'locker-sidebar-sub';
    sideSub.textContent = 'Personalizza Profilo & Tavolo';
    sideHead.append(sideTitle, sideSub);

    const catList = document.createElement('div');
    catList.className = 'locker-cat-list';
    catList.setAttribute('role', 'tablist');
    catList.setAttribute('aria-orientation', 'vertical');
    catList.setAttribute('aria-label', 'Categorie Armadietto');

    catList.addEventListener('keydown', (ev) => {
      if (hasBlockedModifier(ev)) return;
      if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
      ev.preventDefault();
      const curIdx = LOCKER_CATEGORIES.findIndex((c) => c.id === activeCategory);
      const delta = ev.key === 'ArrowDown' ? 1 : -1;
      const { index, wrapped } = computeSafeLoopIndex(
        curIdx,
        delta,
        LOCKER_CATEGORIES.length
      );
      const next = LOCKER_CATEGORIES[index];
      if (next) {
        activeCategory = next.id;
        selectedItemId = null;
        statusMessage = '';
        playEarcon(wrapped ? 'boundary' : 'nav');
        announce(`Categoria ${next.label}`, 'polite');
        paint(true);
      }
    });

    for (const cat of LOCKER_CATEGORIES) {
      const count =
        cat.id === 'title'
          ? LEGACY_TITLES.length + filterOwnedByCategory(snap.items, 'title').length
          : filterOwnedByCategory(snap.items, cat.id).length;
      const isSelected = cat.id === activeCategory;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `locker-cat-btn${isSelected ? ' active' : ''}`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(isSelected));
      btn.tabIndex = isSelected ? 0 : -1;

      const labelWrap = document.createElement('span');
      labelWrap.className = 'locker-cat-label';
      const iconSpan = document.createElement('span');
      iconSpan.className = 'locker-cat-icon';
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.textContent = cat.shortIcon;
      const textSpan = document.createElement('span');
      textSpan.textContent = cat.label;
      labelWrap.append(iconSpan, textSpan);

      const countBadge = document.createElement('span');
      countBadge.className = 'locker-cat-count';
      countBadge.textContent = String(count);

      btn.append(labelWrap, countBadge);
      btn.addEventListener('click', () => {
        if (activeCategory === cat.id) return;
        activeCategory = cat.id;
        selectedItemId = null;
        statusMessage = '';
        playEarcon('nav');
        announce(`Categoria ${cat.label}`, 'polite');
        paint(true);
      });

      catList.appendChild(btn);
      if (focusActiveCategory && isSelected) {
        btn.focus();
      }
    }

    const loadoutBox = document.createElement('div');
    loadoutBox.className = 'locker-loadout-summary';
    const loadoutHead = document.createElement('div');
    loadoutHead.className = 'locker-loadout-heading';
    loadoutHead.textContent = 'LOADOUT ATTIVO';
    loadoutBox.appendChild(loadoutHead);

    const summarySlots: Array<[string, string]> = [
      ['Avatar', resolveDisplayName(snap.loadout.avatar)],
      ['Dorso', resolveDisplayName(snap.loadout.cardStyle)],
      ['Cornice', resolveDisplayName(snap.loadout.frame)],
      ['Tavolo', resolveDisplayName(snap.loadout.theme)],
      ['Titolo', resolveDisplayName(snap.loadout.title)],
    ];
    for (const [slotName, slotValue] of summarySlots) {
      const row = document.createElement('div');
      row.className = 'locker-loadout-row';
      const k = document.createElement('span');
      k.textContent = slotName;
      const v = document.createElement('strong');
      v.textContent = slotValue;
      row.append(k, v);
      loadoutBox.appendChild(row);
    }

    sidebar.append(sideHead, catList, loadoutBox);

    // ── Center Column: Holographic Showcase Pedestal ───────────────
    pedestalCol.innerHTML = '';

    const stage = document.createElement('div');
    const selectedLegacyTitle = selectedEntry ? LEGACY_TITLES_BY_ID[selectedEntry.itemId] : undefined;
    const selectedRarity: CosmeticRarity = selectedEntry
      ? resolveItemRarity(selectedEntry.itemId)
      : 'rare';

    stage.className = `locker-pedestal-stage locker-pedestal-stage--${selectedRarity}`;

    if (selectedEntry) {
      const topBadges = document.createElement('div');
      topBadges.className = 'locker-pedestal-badges';
      const rarityPill = document.createElement('span');
      rarityPill.className = `shop-rarity-pill shop-rarity-pill--${selectedRarity}`;
      rarityPill.textContent = selectedRarity.toUpperCase();
      topBadges.appendChild(rarityPill);

      const qtyPill = document.createElement('span');
      qtyPill.className = 'shop-tag-pill shop-tag-pill--owned';
      qtyPill.textContent =
        activeCategory === 'crate'
          ? `DISPONIBILI ×${selectedEntry.quantity}`
          : `POSSEDUTO ×${selectedEntry.quantity}`;
      topBadges.appendChild(qtyPill);

      const holoBeam = document.createElement('div');
      holoBeam.className = 'locker-holo-beam';
      holoBeam.setAttribute('aria-hidden', 'true');

      const artHost = document.createElement('div');
      artHost.className = 'locker-pedestal-art';
      artHost.innerHTML = getShopItemArtworkSvg(
        selectedEntry.itemId,
        activeCategory
      );

      const rings = document.createElement('div');
      rings.className = 'locker-pedestal-rings';
      rings.setAttribute('aria-hidden', 'true');

      const info = document.createElement('div');
      info.className = 'locker-pedestal-info';
      const title = document.createElement('h2');
      title.className = 'locker-pedestal-title';
      title.textContent = resolveDisplayName(selectedEntry.itemId);
      if (selectedLegacyTitle?.color) {
        title.style.color = selectedLegacyTitle.color;
      }
      const desc = document.createElement('p');
      desc.className = 'locker-pedestal-desc';
      desc.textContent = resolveDisplayDesc(selectedEntry.itemId);
      info.append(title, desc);

      const equipped = isItemEquippedInLoadout(
        selectedEntry.itemId,
        activeCategory,
        snap.loadout
      );
      const actionState = getPedestalActionState(activeCategory, equipped);

      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = `locker-action-btn ${
        activeCategory === 'crate'
          ? 'locker-action-btn--crate'
          : actionState.actionable
            ? 'locker-action-btn--equip'
            : 'locker-action-btn--equipped'
      }`;
      actionBtn.textContent = busyAction ? 'ELABORAZIONE…' : actionState.label;

      if (!actionState.actionable || busyAction) {
        actionBtn.setAttribute('aria-disabled', 'true');
      }

      actionBtn.addEventListener('click', () => {
        if (busyAction) return;
        if (!actionState.actionable) {
          playEarcon('nav');
          announce(`${title.textContent} è già equipaggiato`, 'polite');
          return;
        }
        if (activeCategory === 'crate') {
          void redeemCrate(selectedEntry.itemId);
        } else {
          void applyEquippedItem(activeCategory, selectedEntry.itemId);
        }
      });

      stage.append(topBadges, holoBeam, artHost, rings, info, actionBtn);
    } else {
      const catLabel =
        LOCKER_CATEGORIES.find((c) => c.id === activeCategory)?.label ??
        activeCategory;
      const emptyWrap = document.createElement('div');
      emptyWrap.className = 'locker-pedestal-empty';

      const holoBeam = document.createElement('div');
      holoBeam.className = 'locker-holo-beam';
      holoBeam.setAttribute('aria-hidden', 'true');

      const emptyArt = document.createElement('div');
      emptyArt.className = 'locker-pedestal-art is-empty';
      emptyArt.innerHTML = getShopItemArtworkSvg('unknown', activeCategory);

      const rings = document.createElement('div');
      rings.className = 'locker-pedestal-rings';
      rings.setAttribute('aria-hidden', 'true');

      const emptyTitle = document.createElement('h2');
      emptyTitle.className = 'locker-pedestal-title';
      emptyTitle.textContent = `Nessun elemento in ${catLabel}`;

      const emptyDesc = document.createElement('p');
      emptyDesc.className = 'locker-pedestal-desc';
      emptyDesc.textContent =
        'Sblocca nuovi cosmetici nel Negozio Cosmetico o avanzando nella Battle Card.';

      const goShopBtn = document.createElement('button');
      goShopBtn.type = 'button';
      goShopBtn.className = 'locker-action-btn locker-action-btn--equip';
      goShopBtn.textContent = 'VAI AL NEGOZIO';
      goShopBtn.addEventListener('click', () => {
        playEarcon('nav');
        window.location.hash = '#negozio';
      });

      emptyWrap.append(holoBeam, emptyArt, rings, emptyTitle, emptyDesc, goShopBtn);
      stage.appendChild(emptyWrap);
    }

    const feedbackBar = document.createElement('div');
    feedbackBar.className = 'tab-feedback locker-feedback';
    feedbackBar.textContent = statusMessage;
    pedestalCol.append(stage, feedbackBar);

    // ── Right Column: Rarity-Bordered Inventory Grid ───────────────
    gridCol.innerHTML = '';

    const activeCatLabel =
      LOCKER_CATEGORIES.find((c) => c.id === activeCategory)?.label ??
      activeCategory;

    const gridHeader = document.createElement('div');
    gridHeader.className = 'locker-grid-header';
    const gridTitle = document.createElement('span');
    gridTitle.className = 'locker-grid-title';
    gridTitle.textContent = activeCatLabel.toUpperCase();
    const gridCount = document.createElement('span');
    gridCount.className = 'locker-grid-count';
    gridCount.textContent =
      activeCategory === 'crate'
        ? `${categoryItems.length} casse disponibili`
        : `${categoryItems.length} sbloccati`;
    gridHeader.append(gridTitle, gridCount);

    let titleFilterRow: HTMLElement | null = null;
    if (activeCategory === 'title') {
      titleFilterRow = document.createElement('div');
      titleFilterRow.className = 'locker-title-filters';
      for (const chip of TITLE_FILTER_CHIPS) {
        const chipBtn = document.createElement('button');
        chipBtn.type = 'button';
        chipBtn.className = `tournaments-filter-btn${
          activeTitleGroup === chip.id ? ' active' : ''
        }`;
        chipBtn.textContent = chip.label;
        chipBtn.addEventListener('click', () => {
          activeTitleGroup = chip.id;
          selectedItemId = null;
          playEarcon('nav');
          paint();
        });
        titleFilterRow.appendChild(chipBtn);
      }
    }

    const invGrid = document.createElement('div');
    invGrid.className = 'locker-inv-grid';

    if (categoryItems.length === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'locker-inv-empty';
      emptyCard.textContent = `Nessun oggetto sbloccato nella categoria ${activeCatLabel}.`;
      invGrid.appendChild(emptyCard);
    } else {
      for (const entry of categoryItems) {
        const legacyTitle = LEGACY_TITLES_BY_ID[entry.itemId];
        const meta = CATALOG_BY_ID[entry.itemId];
        const displayName = meta?.name ?? legacyTitle?.name ?? entry.itemId;
        const rarity = resolveItemRarity(entry.itemId);
        const equipped = isItemEquippedInLoadout(
          entry.itemId,
          activeCategory,
          snap.loadout
        );
        const isSelected = entry.itemId === selectedItemId;

        const card = document.createElement('button');
        card.type = 'button';
        card.className = `locker-inv-card locker-inv-card--${rarity}${
          isSelected ? ' is-selected' : ''
        }${equipped ? ' is-equipped' : ''}`;
        card.setAttribute(
          'aria-label',
          `${displayName}, rarità ${rarity}${
            equipped ? ', equipaggiato' : ''
          }`
        );

        const topRow = document.createElement('div');
        topRow.className = 'shop-card-badges';
        const rarityBadge = document.createElement('span');
        rarityBadge.className = `shop-rarity-pill shop-rarity-pill--${rarity}`;
        rarityBadge.textContent = rarity.toUpperCase();
        topRow.appendChild(rarityBadge);

        if (equipped) {
          const activeBadge = document.createElement('span');
          activeBadge.className = 'shop-tag-pill shop-tag-pill--owned';
          activeBadge.textContent = 'ATTIVO';
          topRow.appendChild(activeBadge);
        } else if (entry.quantity > 1 || activeCategory === 'crate') {
          const qtyBadge = document.createElement('span');
          qtyBadge.className = 'shop-tag-pill shop-tag-pill--crate';
          qtyBadge.textContent = `×${entry.quantity}`;
          topRow.appendChild(qtyBadge);
        }

        const artThumb = document.createElement('div');
        artThumb.className = `locker-inv-art shop-item-art--${rarity}`;
        artThumb.innerHTML = getShopItemArtworkSvg(entry.itemId, activeCategory);

        const nameEl = document.createElement('div');
        nameEl.className = 'locker-inv-name';
        nameEl.textContent = displayName;
        if (legacyTitle?.color) {
          nameEl.style.color = legacyTitle.color;
        }

        card.append(topRow, artThumb, nameEl);

        card.addEventListener('click', () => {
          selectedItemId = entry.itemId;
          playEarcon('nav');
          announce(
            `Selezionato ${displayName}, ${rarity}`,
            'polite'
          );
          paint();
        });

        card.addEventListener('dblclick', () => {
          if (activeCategory !== 'crate' && !equipped) {
            void applyEquippedItem(activeCategory, entry.itemId);
          }
        });

        invGrid.appendChild(card);
      }
    }

    if (titleFilterRow) {
      gridCol.append(gridHeader, titleFilterRow, invGrid);
    } else {
      gridCol.append(gridHeader, invGrid);
    }
  };

  paint();

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
      paint();
    })
    .catch(() => {});

  return root;
}
