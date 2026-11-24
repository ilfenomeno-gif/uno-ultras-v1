// ============================================================
// UNO ULTRA Client — Battle Pass / Battle Card Pure Helpers
// ============================================================

import {
  BATTLE_CARD_MAX_LEVEL,
  BATTLE_CARD_UNLOCK_LEVEL_PRICE,
  BATTLE_CARD_XP_PER_LEVEL,
  CATALOG_BY_ID,
  type BattleCardRewardTier,
  type CosmeticCategory,
  type CosmeticRarity,
} from '@uno/shared';

export type BattlePassPhase = 'pre-season' | 'qualifiers' | 'championship';

export interface BattlePassPhaseDef {
  readonly id: BattlePassPhase;
  readonly label: string;
  readonly minLevel: number;
  readonly maxLevel: number;
}

export const BATTLE_PASS_PHASES: readonly BattlePassPhaseDef[] = [
  { id: 'pre-season', label: 'PRE-SEASON', minLevel: 1, maxLevel: 30 },
  { id: 'qualifiers', label: 'QUALIFIERS', minLevel: 31, maxLevel: 70 },
  { id: 'championship', label: 'CHAMPIONSHIP', minLevel: 71, maxLevel: 100 },
];

export interface BattleCardClientState {
  readonly tier: 'free' | 'base' | 'bundle20';
  readonly level: number;
  readonly xp: number;
  readonly claimedLevels: readonly string[];
}

export type BattlePassCardStatus = 'claimed' | 'available' | 'locked';

export interface BattlePassCardModel {
  readonly key: string;
  readonly level: number;
  readonly track: 'free' | 'premium';
  readonly label: string;
  readonly description: string;
  readonly kind: 'vcard' | 'cosmetic';
  readonly itemId: string | null;
  readonly category: CosmeticCategory | null;
  readonly rarity: CosmeticRarity;
  readonly vcardAmount: number | null;
  readonly status: BattlePassCardStatus;
  readonly requiresPremium: boolean;
  readonly phase: BattlePassPhase;
}

export interface BattlePassMetrics {
  readonly level: number;
  readonly maxLevel: number;
  readonly xp: number;
  readonly xpPerLevel: number;
  readonly xpPercent: number;
  readonly unlockedCards: number;
  readonly totalCards: number;
  readonly tierPercent: number;
  readonly claimedCards: number;
  readonly claimableCards: number;
  readonly premiumCardsCount: number;
  readonly unlockAllCostVCard: number;
}

export function resolveBattlePassPhase(level: number): BattlePassPhase {
  if (level <= 30) return 'pre-season';
  if (level <= 70) return 'qualifiers';
  return 'championship';
}

/**
 * Builds the flat ordered list of vertical reward cards from real BATTLE_CARD_REWARDS
 * without inventing any items, prices, or statuses.
 */
export function buildBattlePassCards(
  rewards: readonly BattleCardRewardTier[],
  state: BattleCardClientState,
  phase?: BattlePassPhase,
): BattlePassCardModel[] {
  const claimedSet = new Set(state.claimedLevels);
  const cards: BattlePassCardModel[] = [];

  for (const tier of rewards) {
    const cardPhase = resolveBattlePassPhase(tier.level);
    if (phase && cardPhase !== phase) continue;

    const tracks: ReadonlyArray<'free' | 'premium'> = ['free', 'premium'];
    for (const track of tracks) {
      const rw = tier[track];
      if (!rw) continue;

      const key = `${track}:${tier.level}`;
      const catalogItem = rw.itemId ? CATALOG_BY_ID[rw.itemId] : undefined;
      const isClaimed = claimedSet.has(key);
      const isLevelReached = state.level >= tier.level;
      const hasPassAccess = track === 'free' || state.tier !== 'free';

      const status: BattlePassCardStatus = isClaimed
        ? 'claimed'
        : isLevelReached && hasPassAccess
          ? 'available'
          : 'locked';

      const rarity: CosmeticRarity =
        catalogItem?.rarity ?? (track === 'premium' ? 'epic' : 'rare');

      cards.push({
        key,
        level: tier.level,
        track,
        label: catalogItem?.name ?? rw.label,
        description:
          catalogItem?.description ??
          (rw.kind === 'vcard'
            ? `Accredito diretto di ${rw.vcardAmount ?? 0} V-Card sul tuo saldo.`
            : rw.label),
        kind: rw.kind,
        itemId: rw.itemId ?? null,
        category: catalogItem?.category ?? null,
        rarity,
        vcardAmount: rw.vcardAmount ?? null,
        status,
        requiresPremium: track === 'premium',
        phase: cardPhase,
      });
    }
  }

  return cards;
}

/**
 * Computes Level/XP progression strictly separated from Tier/Reward card unlocks.
 */
export function computeBattlePassMetrics(
  rewards: readonly BattleCardRewardTier[],
  state: BattleCardClientState,
): BattlePassMetrics {
  const allCards = buildBattlePassCards(rewards, state);
  const clampedLevel = Math.max(1, Math.min(BATTLE_CARD_MAX_LEVEL, state.level));
  const clampedXp = Math.max(0, state.xp);
  const xpPercent = Math.min(100, Math.round((clampedXp / BATTLE_CARD_XP_PER_LEVEL) * 100));

  const unlockedCards = allCards.filter((c) => c.status !== 'locked').length;
  const claimedCards = allCards.filter((c) => c.status === 'claimed').length;
  const claimableCards = allCards.filter((c) => c.status === 'available').length;
  const premiumCardsCount = allCards.filter((c) => c.track === 'premium').length;
  const totalCards = allCards.length;
  const tierPercent = totalCards > 0 ? Math.round((unlockedCards / totalCards) * 100) : 0;

  return {
    level: clampedLevel,
    maxLevel: BATTLE_CARD_MAX_LEVEL,
    xp: clampedXp,
    xpPerLevel: BATTLE_CARD_XP_PER_LEVEL,
    xpPercent,
    unlockedCards,
    totalCards,
    tierPercent,
    claimedCards,
    claimableCards,
    premiumCardsCount,
    unlockAllCostVCard: Math.max(0, BATTLE_CARD_MAX_LEVEL - clampedLevel) * BATTLE_CARD_UNLOCK_LEVEL_PRICE,
  };
}

export function getVCardRewardArtworkSvg(amount: number, uniqueSeed: string): string {
  const safeId = uniqueSeed.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `
    <svg viewBox="0 0 140 120" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="bp_vc_glow_${safeId}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFD32A" stop-opacity="0.38"/>
          <stop offset="65%" stop-color="#25D9F2" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#07152E" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="bp_vc_coin_${safeId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF0A8"/>
          <stop offset="55%" stop-color="#FFD32A"/>
          <stop offset="100%" stop-color="#D97706"/>
        </linearGradient>
      </defs>
      <circle cx="70" cy="60" r="52" fill="url(#bp_vc_glow_${safeId})"/>
      <polygon points="70,18 106,38 106,82 70,102 34,82 34,38" fill="#10264A" stroke="url(#bp_vc_coin_${safeId})" stroke-width="2.5" stroke-linejoin="round"/>
      <polygon points="70,26 98,42 98,78 70,94 42,78 42,42" fill="none" stroke="#25D9F2" stroke-width="1.2" opacity="0.7"/>
      <text x="70" y="64" text-anchor="middle" fill="#FFD32A" font-family="Rajdhani, sans-serif" font-weight="900" font-size="24">+${amount}</text>
      <text x="70" y="81" text-anchor="middle" fill="#F4F8FF" font-family="Inter, sans-serif" font-weight="700" font-size="9" letter-spacing="1.4">V-CARD</text>
    </svg>
  `;
}

export function getStadiumHeroArtworkSvg(): string {
  return `
    <svg viewBox="0 0 1200 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="bp_hero_spot_l" cx="22%" cy="10%" r="55%">
          <stop offset="0%" stop-color="#25D9F2" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="#07152E" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="bp_hero_spot_r" cx="74%" cy="18%" r="52%">
          <stop offset="0%" stop-color="#985BFF" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="#07152E" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="bp_hero_card_cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#25D9F2"/>
          <stop offset="100%" stop-color="#10264A"/>
        </linearGradient>
        <linearGradient id="bp_hero_card_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFD32A"/>
          <stop offset="100%" stop-color="#985BFF"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="280" fill="#07152E"/>
      <rect width="1200" height="280" fill="url(#bp_hero_spot_l)"/>
      <rect width="1200" height="280" fill="url(#bp_hero_spot_r)"/>
      <!-- Stadium tiers & horizon beams -->
      <path d="M0,210 Q600,130 1200,210 L1200,280 L0,280 Z" fill="#10264A" opacity="0.85"/>
      <path d="M0,235 Q600,165 1200,235" fill="none" stroke="#25D9F2" stroke-width="1.6" opacity="0.45"/>
      <path d="M80,260 Q600,192 1120,260" fill="none" stroke="#28E6A0" stroke-width="1.2" opacity="0.35"/>
      <line x1="160" y1="0" x2="430" y2="230" stroke="#25D9F2" stroke-width="2" opacity="0.16"/>
      <line x1="1040" y1="0" x2="770" y2="230" stroke="#985BFF" stroke-width="2" opacity="0.18"/>
      <!-- Holographic UNO Centerpiece shifted slightly right -->
      <g transform="translate(765 36) rotate(-9)">
        <rect x="0" y="18" width="124" height="176" rx="16" fill="#0E2042" stroke="url(#bp_hero_card_cyan)" stroke-width="3"/>
        <ellipse cx="62" cy="106" rx="46" ry="66" transform="rotate(-18 62 106)" fill="none" stroke="#28E6A0" stroke-width="2.4" opacity="0.82"/>
        <text x="62" y="114" text-anchor="middle" fill="#25D9F2" font-family="Rajdhani, sans-serif" font-weight="900" font-size="34" letter-spacing="2">UNO</text>
      </g>
      <g transform="translate(868 24) rotate(8)">
        <rect x="0" y="12" width="132" height="186" rx="18" fill="#132B56" stroke="url(#bp_hero_card_gold)" stroke-width="3.2"/>
        <ellipse cx="66" cy="105" rx="48" ry="68" transform="rotate(-16 66 105)" fill="none" stroke="#FFD32A" stroke-width="2.6" opacity="0.9"/>
        <text x="66" y="108" text-anchor="middle" fill="#FFD32A" font-family="Rajdhani, sans-serif" font-weight="900" font-size="38" letter-spacing="2">ULTRA</text>
        <text x="66" y="132" text-anchor="middle" fill="#F4F8FF" font-family="Inter, sans-serif" font-weight="800" font-size="11" letter-spacing="2">PASS S1</text>
      </g>
    </svg>
  `;
}
