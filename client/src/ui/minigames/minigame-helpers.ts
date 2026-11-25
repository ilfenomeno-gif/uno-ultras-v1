// ============================================================
// UNO ULTRA Client — 7 Mini-Games Pure Display & Action Helpers
// ============================================================

import {
  CATALOG_BY_ID,
  getRankInfo,
  LEGACY_TITLES_BY_ID,
  pickPrestigiousTitleForMMR,
  REALISTIC_BOT_PROFILES,
  type AnyMiniGameMode,
} from '@uno/shared';

export interface MiniGameActionLike {
  readonly type: string;
  readonly cardId?: string;
  readonly amount?: number;
  readonly targetPlayerId?: string;
  readonly [key: string]: unknown;
}

export interface StandardCardLabel {
  readonly id: string;
  readonly rank: string;
  readonly suitGlyph: string;
  readonly suit: string;
  readonly isRed: boolean;
  readonly isItalian: boolean;
}

export interface MilleCardMeta {
  readonly title: string;
  readonly badge: string;
  readonly category: 'distance' | 'hazard' | 'remedy' | 'safety';
  readonly icon: string;
}

const FRENCH_SUIT_GLYPHS: Readonly<Record<string, string>> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const ITALIAN_SUIT_GLYPHS: Readonly<Record<string, string>> = {
  coppe: '🏆',
  denari: '🪙',
  spade: '⚔',
  bastoni: '🪵',
};

const HAZARD_LABELS: Readonly<Record<string, string>> = {
  stop: 'Semaforo Rosso',
  out_of_gas: 'Senza Benzina',
  flat_tire: 'Gomma a Terra',
};

const REMEDY_LABELS: Readonly<Record<string, string>> = {
  roll: 'Semaforo Verde',
  gasoline: 'Benzina',
  spare_tire: 'Ruota di Scorta',
};

const SAFETY_LABELS: Readonly<Record<string, string>> = {
  driving_ace: 'Asso del Volante',
  extra_tank: 'Cisterna Extra',
  puncture_proof: 'Gomme Antiforatura',
};

/**
 * Maps internal engine action IDs into natural Italian labels
 * for full-screen mini-game controls without exposing raw tokens.
 */
export function formatMiniGameActionLabel(
  mode: AnyMiniGameMode,
  action: MiniGameActionLike,
): string {
  switch (action.type) {
    case 'hit':
      return 'Carta (Hit)';
    case 'stand':
      return 'Stai (Stand)';
    case 'double':
      return 'Raddoppia (Double)';
    case 'draw_stock':
      return 'Pesca dal mazzo';
    case 'draw_discard':
      return 'Pesca dagli scarti';
    case 'draw_discard_pile':
      return 'Raccogli scarti';
    case 'fold':
      return 'Lascia (Fold)';
    case 'check_call':
      return 'Vedi / Chiama';
    case 'raise':
      return typeof action.amount === 'number'
        ? `Rilancia +${action.amount}`
        : 'Rilancia (Raise)';
    case 'meld':
      return mode === 'burraco' ? 'Cala / Burraco' : 'Cala combinazione';
    case 'play_card':
      return 'Gioca carta';
    case 'play_distance':
      return 'Avanza';
    case 'play_remedy':
      return 'Risolvi imprevisto';
    case 'play_safety':
      return 'Attiva sicurezza';
    case 'play_hazard':
      return typeof action.targetPlayerId === 'string'
        ? `Attacca ${action.targetPlayerId}`
        : 'Lancia imprevisto';
    case 'discard':
      return 'Scarta';
    default: {
      const cleaned = action.type.replace(/_/g, ' ').trim();
      if (!cleaned) return 'Azione';
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
}

/**
 * Groups legal actions referencing a specific card into primary play vs discard actions.
 */
export function findCardActions(
  legalActions: readonly MiniGameActionLike[],
  cardId: string,
): { playAction: MiniGameActionLike | null; discardAction: MiniGameActionLike | null } {
  let playAction: MiniGameActionLike | null = null;
  let discardAction: MiniGameActionLike | null = null;

  for (const act of legalActions) {
    if (act.cardId !== cardId) continue;
    if (act.type === 'discard') {
      discardAction = act;
    } else if (!playAction) {
      playAction = act;
    }
  }

  return { playAction, discardAction };
}

/**
 * Formats standard 52-card and Italian 40-card views with corner rank and suit metadata.
 */
export function formatStandardCardLabel(raw: Record<string, unknown>): StandardCardLabel {
  const id = String(raw['id'] ?? '');
  const suit = String(raw['suit'] ?? '');
  const isItalian = suit in ITALIAN_SUIT_GLYPHS;
  const rankNum = Number(raw['rank'] ?? 0);

  let rank: string;
  if (rankNum === 1) {
    rank = 'A';
  } else if (!isItalian && rankNum === 11) {
    rank = 'J';
  } else if (!isItalian && rankNum === 12) {
    rank = 'Q';
  } else if (!isItalian && rankNum === 13) {
    rank = 'K';
  } else {
    rank = String(rankNum || '?');
  }

  const suitGlyph =
    FRENCH_SUIT_GLYPHS[suit] ??
    ITALIAN_SUIT_GLYPHS[suit] ??
    suit.slice(0, 2).toUpperCase();

  const isRed =
    suit === 'hearts' ||
    suit === 'diamonds' ||
    suit === 'coppe' ||
    suit === 'denari';

  return { id, rank, suitGlyph, suit, isRed, isItalian };
}

/**
 * Converts a Mille Miglia card spec into localized title, badge, category, and icon.
 */
export function formatMilleCardMeta(spec: Record<string, unknown>): MilleCardMeta {
  const rawCat = String(spec['category'] ?? 'distance');

  if (rawCat === 'hazard') {
    const hazardKey = String(spec['hazard'] ?? '');
    return {
      title: HAZARD_LABELS[hazardKey] ?? 'Imprevisto',
      badge: 'HAZARD',
      category: 'hazard',
      icon: '⚠️',
    };
  }

  if (rawCat === 'remedy') {
    const remedyKey = String(spec['remedy'] ?? '');
    return {
      title: REMEDY_LABELS[remedyKey] ?? 'Rimedio',
      badge: 'REMEDY',
      category: 'remedy',
      icon: '🔧',
    };
  }

  if (rawCat === 'safety') {
    const safetyKey = String(spec['safety'] ?? '');
    return {
      title: SAFETY_LABELS[safetyKey] ?? 'Sicurezza',
      badge: 'SAFETY',
      category: 'safety',
      icon: '🛡️',
    };
  }

  const km = Number(spec['km'] ?? 0);
  return {
    title: `${km} km`,
    badge: 'DISTANCE',
    category: 'distance',
    icon: '🛣️',
  };
}

/**
 * Returns readable Italian status text for active Mille Miglia hazards.
 */
export function formatMilleHazardLabel(hazard: string | null | undefined): string {
  if (!hazard) return 'Via Libera';
  return HAZARD_LABELS[hazard] ?? hazard.replace(/_/g, ' ');
}

/**
 * Computes optimal Blackjack hand total treating Aces as 11 or 1 to stay <= 21.
 */
export function computeBlackjackTotal(cards: readonly Record<string, unknown>[]): number {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    const rank = Number(card['rank'] ?? 0);
    if (rank === 1) {
      aces += 1;
      total += 11;
    } else if (rank >= 10) {
      total += 10;
    } else if (rank > 0) {
      total += rank;
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

/**
 * Formats player score/distance/chips summary cleanly for the top HUD bar.
 */
export function formatScoreSummary(view: Record<string, unknown>): string {
  const candidate = view['scores'] ?? view['distances'] ?? view['chips'];
  if (!candidate || typeof candidate !== 'object') return 'Tu: 0 · Avversario: 0';
  const entries = Object.entries(candidate as Record<string, unknown>);
  if (entries.length === 0) return 'Tu: 0 · Avversario: 0';
  return entries.map(([pid, val]) => `${pid}: ${String(val ?? 0)}`).join(' · ');
}

export interface MiniGameBotProfile {
  readonly botId?: string;
  readonly ladderRank?: number;
  readonly name: string;
  readonly avatar: string;
  readonly avatarId: string;
  readonly frameId: string;
  readonly baseMmr: number;
  readonly rankTier: string;
  readonly rankColor: string;
  readonly titleText: string;
  readonly titleColor: string;
}

export function mapMatchedRivalsToMiniGameBots(
  rivals: readonly {
    botId: string;
    rank: number;
    username: string;
    mmr: number;
    rankTier: string;
    title: string;
    titleColor: string;
    avatarId: string;
    frameId: string;
  }[],
): MiniGameBotProfile[] {
  return rivals.map((r) => ({
    botId: r.botId,
    ladderRank: r.rank,
    name: r.username,
    avatar: '🤖',
    avatarId: r.avatarId,
    frameId: r.frameId,
    baseMmr: r.mmr,
    rankTier: r.rankTier,
    rankColor: getRankInfo(r.mmr).colorHex,
    titleText: r.title,
    titleColor: r.titleColor,
  }));
}

const MINI_GAME_AVATARS = [
  'avatar_default',
  'avatar_neon_fox',
  'avatar_cyber_dragon',
  'avatar_chrono_ace',
] as const;

export function resolveMiniGameTitleDisplay(titleId: string): { text: string; color: string } {
  if (!titleId) return { text: '', color: '' };
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
  return { text: titleId, color: '#94a3b8' };
}

/**
 * Builds distinct realistic opponent profiles (name, rank, title, avatar, frame) for mini-games.
 */
export function pickMiniGameBotProfiles(
  botCount: number,
  seed = Date.now(),
  mode = 'uno',
): MiniGameBotProfile[] {
  const count = Math.max(1, Math.min(3, botCount));
  const total = REALISTIC_BOT_PROFILES.length;
  const start = Math.abs(seed) % total;
  const picked: MiniGameBotProfile[] = [];
  for (let i = 0; i < total && picked.length < count; i++) {
    const candidate = REALISTIC_BOT_PROFILES[(start + i * 7) % total];
    if (
      candidate &&
      candidate.name !== 'Tu' &&
      !picked.some((b) => b.name === candidate.name)
    ) {
      const rank = getRankInfo(candidate.baseMmr);
      const titleDef = pickPrestigiousTitleForMMR(candidate.baseMmr, mode, Math.abs(seed) + i);
      const avatarId =
        MINI_GAME_AVATARS[(Math.abs(seed) + i) % MINI_GAME_AVATARS.length] ?? 'avatar_default';
      const frameId =
        candidate.baseMmr >= 1950
          ? 'frame_ssl_prism'
          : candidate.baseMmr >= 1400
            ? 'frame_gold_pulse'
            : 'frame_default';
      picked.push({
        name: candidate.name,
        avatar: candidate.avatar,
        avatarId,
        frameId,
        baseMmr: candidate.baseMmr,
        rankTier: rank.tier,
        rankColor: rank.colorHex,
        titleText: titleDef.name,
        titleColor: titleDef.color,
      });
    }
  }
  if (picked.length > 0) return picked;
  const fallbackRank = getRankInfo(1200);
  const fallbackTitle = pickPrestigiousTitleForMMR(1200, mode, 0);
  return [
    {
      name: '🗡️ DreadForce',
      avatar: '🗡️',
      avatarId: 'avatar_cyber_dragon',
      frameId: 'frame_gold_pulse',
      baseMmr: 1200,
      rankTier: fallbackRank.tier,
      rankColor: fallbackRank.colorHex,
      titleText: fallbackTitle.name,
      titleColor: fallbackTitle.color,
    },
  ];
}

/**
 * Builds distinct realistic opponent names for mini-game tables (excluding 'Tu').
 */
export function pickMiniGameBotNames(botCount: number, seed = Date.now()): string[] {
  return pickMiniGameBotProfiles(botCount, seed).map((b) => b.name);
}
