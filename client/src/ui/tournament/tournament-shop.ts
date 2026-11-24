// ============================================================
// UNO ULTRA Client — Tournament Reward Crates Shop (Crediti Torneo)
// ============================================================

import type { CosmeticRarity } from '@uno/shared';
import { announce } from '../../core/aria-live.js';
import { playEarcon } from '../../core/audio-earcons.js';
import { openTournamentCrate } from '../../net/tcp/rest-client.js';
import { getEconomySnapshot, setEconomySnapshot } from '../../state/inventory-store.js';
import { getProfile, patchProfile } from '../../state/profile-store.js';
import { getShopItemArtworkSvg } from '../navigation/shop-artworks.js';
import { getRankAdaptiveCrateName } from './tournament-helpers.js';

interface CrateCardDef {
  readonly id: 'crate_bronze_100' | 'crate_silver_500' | 'crate_ssl_1000';
  readonly rarity: CosmeticRarity;
  readonly priceCredits: number;
  readonly desc: string;
}

const CRATE_CARDS: readonly CrateCardDef[] = [
  {
    id: 'crate_bronze_100',
    rarity: 'common',
    priceCredits: 100,
    desc: 'Comune / Raro garantito calibrato sul tuo grado attuale.',
  },
  {
    id: 'crate_silver_500',
    rarity: 'epic',
    priceCredits: 500,
    desc: 'Almeno 1 cosmetico Epico o Leggendario garantito.',
  },
  {
    id: 'crate_ssl_1000',
    rarity: 'mythic',
    priceCredits: 1000,
    desc: 'Drop garantito Leggendario / Mitico SSL + bonus doppione elevato.',
  },
];

export function createTournamentShopPanel(
  onStatus: (msg: string) => void,
  onWalletChange?: () => void
): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'tournament-shop-grid';

  const rankTier = getProfile()?.rankTier;

  for (const crate of CRATE_CARDS) {
    const titleText =
      crate.id === 'crate_bronze_100'
        ? getRankAdaptiveCrateName(rankTier)
        : crate.id === 'crate_silver_500'
          ? 'Cassa Argento Torneo'
          : 'Cassa Leggenda SSL';

    const card = document.createElement('article');
    card.className = `shop-item-card shop-item-card--${crate.rarity}`;

    const badges = document.createElement('div');
    badges.className = 'shop-card-badges';
    const rarityBadge = document.createElement('span');
    rarityBadge.className = `shop-rarity-pill shop-rarity-pill--${crate.rarity}`;
    rarityBadge.textContent = crate.rarity.toUpperCase();
    const crateTag = document.createElement('span');
    crateTag.className = 'shop-tag-pill shop-tag-pill--crate';
    crateTag.textContent = 'CASSA TORNEO';
    badges.append(rarityBadge, crateTag);

    const art = document.createElement('div');
    art.className = `shop-item-art shop-item-art--${crate.rarity}`;
    art.innerHTML = getShopItemArtworkSvg(crate.id, 'crate');

    const body = document.createElement('div');
    body.className = 'shop-item-body';
    const title = document.createElement('h4');
    title.className = 'shop-item-title';
    title.textContent = titleText;
    const desc = document.createElement('p');
    desc.className = 'shop-item-desc';
    desc.textContent = crate.desc;
    const price = document.createElement('div');
    price.className = 'shop-item-price tournament-crate-price';
    price.textContent = `${crate.priceCredits} Crediti Torneo`;
    body.append(title, desc, price);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `shop-buy-btn shop-buy-btn--${crate.rarity}`;
    btn.textContent = 'Riscatta Cassa';
    btn.setAttribute(
      'aria-label',
      `Riscatta ${titleText} per ${crate.priceCredits} Crediti Torneo`
    );

    let pending = false;
    btn.addEventListener('click', async () => {
      if (pending) return;
      pending = true;
      btn.setAttribute('aria-disabled', 'true');
      btn.classList.add('is-disabled');
      btn.textContent = 'Apertura…';
      try {
        const res = await openTournamentCrate(crate.id, 'tournament_credits');
        const eco = getEconomySnapshot();
        setEconomySnapshot({
          ...eco,
          vcard: res.vcardAfter,
          tournamentCredits: res.tournamentCreditsAfter ?? eco.tournamentCredits,
        });
        patchProfile({ vcard: res.vcardAfter });
        const msg = `Estratto: ${res.droppedItem.name} (${res.droppedItem.rarity.toUpperCase()})${
          res.duplicate ? ` — Doppione rimborsato +${res.refundVCard} V-Card` : ''
        }`;
        onStatus(msg);
        onWalletChange?.();
        playEarcon('win');
        announce(msg, 'assertive');
      } catch (err) {
        const errMsg =
          err instanceof Error
            ? err.message
            : 'Crediti Torneo insufficienti o modalità offline';
        onStatus(errMsg);
        playEarcon('error');
        announce(errMsg, 'assertive');
      } finally {
        pending = false;
        btn.removeAttribute('aria-disabled');
        btn.classList.remove('is-disabled');
        btn.textContent = 'Riscatta Cassa';
      }
    });

    card.append(badges, art, body, btn);
    grid.appendChild(card);
  }
  return grid;
}
