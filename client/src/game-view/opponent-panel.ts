// ============================================================
// UNO ULTRA Client — Opponents Panel
// ============================================================

import { CATALOG_BY_ID, getRankInfo, LEGACY_TITLES_BY_ID } from '@uno/shared';
import { resolveCareerFrameClass } from '../ui/navigation/career-helpers.js';
import { getShopItemArtworkSvg } from '../ui/navigation/shop-artworks.js';

export interface OpponentSummary {
  id: string;
  username: string;
  cardCount: number;
  isBot: boolean;
  isCurrent: boolean;
  hasCalledUno: boolean;
  isConnected: boolean;
  avatarId?: string;
  frameId?: string;
  titleId?: string;
  titleText?: string;
  titleColor?: string;
  rankTier?: string;
  mmr?: number;
}

export interface LocalPlayerPlate {
  username: string;
  avatarId: string;
  frameId: string;
  titleId: string;
  titleText: string;
  titleColor: string;
  rankTier: string;
  mmr: number;
}

function resolveTitleVisual(
  titleId?: string,
  titleText?: string,
  titleColor?: string
): { text: string; color: string } {
  if (titleId) {
    const legacy = LEGACY_TITLES_BY_ID[titleId];
    if (legacy) return { text: legacy.name, color: legacy.color };
    const cat = CATALOG_BY_ID[titleId];
    if (cat) {
      const color =
        cat.rarity === 'mythic'
          ? '#ff5ef7'
          : cat.rarity === 'legendary'
            ? '#ffd166'
            : cat.rarity === 'epic'
              ? '#c084fc'
              : '#38bdf8';
      return { text: cat.name, color };
    }
  }
  if (titleText) return { text: titleText, color: titleColor || '#94a3b8' };
  return { text: '', color: '' };
}

function buildIdentityPlate(opts: {
  username: string;
  isBot: boolean;
  avatarId?: string;
  frameId?: string;
  titleId?: string;
  titleText?: string;
  titleColor?: string;
  rankTier?: string;
  mmr?: number;
}): HTMLElement {
  const plate = document.createElement('div');
  plate.className = 'uno-identity-plate';

  const avatarWrap = document.createElement('div');
  const frameClass = resolveCareerFrameClass(opts.frameId ?? 'frame_default');
  avatarWrap.className = `uno-avatar-badge ${frameClass}`;
  avatarWrap.innerHTML = getShopItemArtworkSvg(opts.avatarId || 'avatar_default', 'avatar');

  const meta = document.createElement('div');
  meta.className = 'uno-identity-meta';

  const nameEl = document.createElement('div');
  nameEl.className = 'opponent__name';
  nameEl.textContent = opts.username;
  if (opts.isBot) {
    const botTag = document.createElement('span');
    botTag.className = 'opponent__tag';
    botTag.textContent = 'BOT';
    nameEl.appendChild(botTag);
  }

  const badges = document.createElement('div');
  badges.className = 'uno-identity-badges';

  const rankInfo = getRankInfo(opts.mmr ?? 1000);
  const rankBadge = document.createElement('span');
  rankBadge.className = 'uno-rank-pill';
  rankBadge.style.color = rankInfo.colorHex;
  rankBadge.textContent = opts.rankTier || rankInfo.tier;
  badges.appendChild(rankBadge);

  const title = resolveTitleVisual(opts.titleId, opts.titleText, opts.titleColor);
  if (title.text) {
    const titleBadge = document.createElement('span');
    titleBadge.className = 'uno-title-pill';
    titleBadge.style.color = title.color;
    titleBadge.textContent = title.text;
    badges.appendChild(titleBadge);
  }

  meta.append(nameEl, badges);
  plate.append(avatarWrap, meta);
  return plate;
}

export function renderOpponents(
  container: HTMLElement,
  players: readonly OpponentSummary[],
  myId: string
): void {
  container.innerHTML = '';

  const opponents = players.filter((p) => p.id !== myId);
  for (const p of opponents) {
    const el = document.createElement('div');
    el.className = 'opponent';
    if (p.isCurrent) el.classList.add('is-current');
    if (!p.isConnected && !p.isBot) el.classList.add('is-offline');

    const plate = buildIdentityPlate({
      username: p.username,
      isBot: p.isBot,
      ...(p.avatarId !== undefined ? { avatarId: p.avatarId } : {}),
      ...(p.frameId !== undefined ? { frameId: p.frameId } : {}),
      ...(p.titleId !== undefined ? { titleId: p.titleId } : {}),
      ...(p.titleText !== undefined ? { titleText: p.titleText } : {}),
      ...(p.titleColor !== undefined ? { titleColor: p.titleColor } : {}),
      ...(p.rankTier !== undefined ? { rankTier: p.rankTier } : {}),
      ...(p.mmr !== undefined ? { mmr: p.mmr } : {}),
    });

    const countEl = document.createElement('div');
    countEl.className = 'opponent__count';
    countEl.textContent = `🂠 ${p.cardCount} ${p.cardCount === 1 ? 'carta' : 'carte'}`;

    el.append(plate, countEl);

    if (p.hasCalledUno) {
      const unoTag = document.createElement('div');
      unoTag.className = 'opponent__uno';
      unoTag.textContent = 'UNO!';
      el.appendChild(unoTag);
    }

    container.appendChild(el);
  }
}

export function renderMyPlate(container: HTMLElement | null, self: LocalPlayerPlate): void {
  if (!container) return;
  container.innerHTML = '';
  container.appendChild(
    buildIdentityPlate({
      username: self.username,
      isBot: false,
      avatarId: self.avatarId,
      frameId: self.frameId,
      titleId: self.titleId,
      titleText: self.titleText,
      titleColor: self.titleColor,
      rankTier: self.rankTier,
      mmr: self.mmr,
    })
  );
}
