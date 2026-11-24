// ============================================================
// UNO ULTRA — Economy, Battle Card, Challenges & Tournaments contracts
// ============================================================

export type CosmeticCategory =
  | 'avatar'
  | 'frame'
  | 'card_back'
  | 'title'
  | 'theme'
  | 'crate';

export type CosmeticRarity =
  | 'common'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export interface CatalogItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: CosmeticCategory;
  readonly rarity: CosmeticRarity;
  readonly priceVCard: number;
  readonly duplicateRefundVCard: number;
  readonly isDailyRotation?: boolean;
  readonly accentHex?: string;
}

export const CATALOG_ITEMS: readonly CatalogItem[] = [
  // Avatars
  {
    id: 'avatar_neon_fox',
    name: 'Neon Fox',
    description: 'Volpe cibernetica della Street League.',
    category: 'avatar',
    rarity: 'rare',
    priceVCard: 300,
    duplicateRefundVCard: 100,
    accentHex: '#FF2D95',
  },
  {
    id: 'avatar_cyber_dragon',
    name: 'Cyber Dragon',
    description: 'Drago al neon forgiato nell Arena SSL.',
    category: 'avatar',
    rarity: 'legendary',
    priceVCard: 800,
    duplicateRefundVCard: 250,
    isDailyRotation: true,
    accentHex: '#00F0FF',
  },
  {
    id: 'avatar_chrono_ace',
    name: 'Chrono Ace',
    description: 'Giocatore leggendario delle finali UT32.',
    category: 'avatar',
    rarity: 'epic',
    priceVCard: 550,
    duplicateRefundVCard: 175,
    accentHex: '#FFD500',
  },
  // Frames
  {
    id: 'frame_gold_pulse',
    name: 'Cornice Oro Pulsante',
    description: 'Bordatura dorata animata per il tuo profilo.',
    category: 'frame',
    rarity: 'epic',
    priceVCard: 450,
    duplicateRefundVCard: 150,
    isDailyRotation: true,
    accentHex: '#D39940',
  },
  {
    id: 'frame_ssl_prism',
    name: 'Cornice Prisma SSL',
    description: 'Riflesso olografico riservato ai migliori contendenti.',
    category: 'frame',
    rarity: 'mythic',
    priceVCard: 1200,
    duplicateRefundVCard: 400,
    accentHex: '#FFFFFF',
  },
  // Card Backs
  {
    id: 'back_arcade_grid',
    name: 'Retro Grid 1984',
    description: 'Dorso synthwave con griglia laser violacea.',
    category: 'card_back',
    rarity: 'rare',
    priceVCard: 250,
    duplicateRefundVCard: 80,
    accentHex: '#9D4EDD',
  },
  {
    id: 'back_obsidian_holo',
    name: 'Ossidiana Olografica',
    description: 'Finitura nera opaca con riflessi ciano.',
    category: 'card_back',
    rarity: 'legendary',
    priceVCard: 900,
    duplicateRefundVCard: 300,
    isDailyRotation: true,
    accentHex: '#00F0FF',
  },
  // Titles
  {
    id: 'title_combo_king',
    name: 'Re dello Stacking',
    description: 'Titolo equipaggiabile nella lobby e in partita.',
    category: 'title',
    rarity: 'rare',
    priceVCard: 200,
    duplicateRefundVCard: 60,
  },
  {
    id: 'title_grand_architect',
    name: 'Architetto del Mazzo',
    description: 'Titolo iconico della Stagione 1.',
    category: 'title',
    rarity: 'epic',
    priceVCard: 500,
    duplicateRefundVCard: 160,
  },
  // Arena Themes
  {
    id: 'theme_tokyo_rain',
    name: 'Arena Tokyo Pioggia',
    description: 'Tavolo 3D riflesso su asfalto bagnato.',
    category: 'theme',
    rarity: 'legendary',
    priceVCard: 1000,
    duplicateRefundVCard: 350,
  },
  // Crates (anche nello Shop Tornei)
  {
    id: 'crate_bronze_100',
    name: 'Cassa Bronzo Torneo',
    description: 'Garantisce 1 cosmetico comune o raro + chance V-Card.',
    category: 'crate',
    rarity: 'common',
    priceVCard: 100,
    duplicateRefundVCard: 40,
  },
  {
    id: 'crate_silver_500',
    name: 'Cassa Argento Torneo',
    description: 'Garantisce almeno 1 cosmetico epico o superiore.',
    category: 'crate',
    rarity: 'epic',
    priceVCard: 500,
    duplicateRefundVCard: 180,
  },
  {
    id: 'crate_ssl_1000',
    name: 'Cassa Leggenda SSL',
    description: 'Drop garantito Leggendario/Mitico + bonus doppione elevato.',
    category: 'crate',
    rarity: 'mythic',
    priceVCard: 1000,
    duplicateRefundVCard: 400,
  },
] as const;

export const CATALOG_BY_ID: Readonly<Record<string, CatalogItem>> = Object.fromEntries(
  CATALOG_ITEMS.map((item) => [item.id, item]),
);

// ── Battle Card (1..100 livelli) ──────────────────────────────

export const BATTLE_CARD_MAX_LEVEL = 100;
export const BATTLE_CARD_XP_PER_LEVEL = 1000;
export const BATTLE_CARD_PRICE_BASE = 1000;
export const BATTLE_CARD_PRICE_BUNDLE_20 = 1500;
export const BATTLE_CARD_UNLOCK_LEVEL_PRICE = 150;

export interface BattleCardReward {
  readonly kind: 'vcard' | 'cosmetic';
  readonly vcardAmount?: number;
  readonly itemId?: string;
  readonly label: string;
}

export interface BattleCardRewardTier {
  readonly level: number;
  readonly free: BattleCardReward | null;
  readonly premium: BattleCardReward | null;
}

/**
 * 100 livelli: il track gratuito eroga esattamente 500 V-Card (50 per ogni multiplo di 10)
 * e il track premium eroga esattamente 500 V-Card (50 ogni 10 livelli sfalsati di 5) + cosmetici.
 * Totale: 1000 V-Card (ripagamento completo del Battle Card Base).
 */
export const BATTLE_CARD_REWARDS: readonly BattleCardRewardTier[] = Array.from(
  { length: BATTLE_CARD_MAX_LEVEL },
  (_, idx): BattleCardRewardTier => {
    const level = idx + 1;
    const free: BattleCardReward | null =
      level % 10 === 0
        ? { kind: 'vcard', vcardAmount: 50, label: '+50 V-Card (Free)' }
        : level === 1
          ? { kind: 'cosmetic', itemId: 'title_combo_king', label: 'Titolo: Re dello Stacking' }
          : level === 25
            ? { kind: 'cosmetic', itemId: 'back_arcade_grid', label: 'Dorso: Retro Grid 1984' }
            : null;

    let premium: BattleCardReward | null = null;
    if (level % 10 === 5) {
      premium = { kind: 'vcard', vcardAmount: 50, label: '+50 V-Card (Premium)' };
    } else if (level === 10) {
      premium = { kind: 'cosmetic', itemId: 'avatar_neon_fox', label: 'Avatar: Neon Fox' };
    } else if (level === 30) {
      premium = { kind: 'cosmetic', itemId: 'frame_gold_pulse', label: 'Cornice Oro Pulsante' };
    } else if (level === 50) {
      premium = { kind: 'cosmetic', itemId: 'avatar_chrono_ace', label: 'Avatar: Chrono Ace' };
    } else if (level === 70) {
      premium = { kind: 'cosmetic', itemId: 'back_obsidian_holo', label: 'Dorso: Ossidiana Olografica' };
    } else if (level === 90) {
      premium = { kind: 'cosmetic', itemId: 'avatar_cyber_dragon', label: 'Avatar: Cyber Dragon' };
    } else if (level === 100) {
      premium = { kind: 'cosmetic', itemId: 'frame_ssl_prism', label: 'Cornice Prisma SSL' };
    }
    return { level, free, premium };
  },
);

// ── Challenges ────────────────────────────────────────────────

export type ChallengePeriod = 'daily' | 'weekly' | 'seasonal';

export interface ChallengeDefinition {
  readonly id: string;
  readonly period: ChallengePeriod;
  readonly title: string;
  readonly description: string;
  readonly metric: 'matches_played' | 'matches_won' | 'cards_played' | 'uno_calls' | 'draw_stacks';
  readonly target: number;
  readonly rewardXp: number;
  readonly rewardVCard: number;
}

export const DAILY_CHALLENGES_POOL: readonly ChallengeDefinition[] = [
  {
    id: 'daily_play_3',
    period: 'daily',
    title: 'Riscaldamento Rapido',
    description: 'Completa 3 partite in qualsiasi modalita.',
    metric: 'matches_played',
    target: 3,
    rewardXp: 400,
    rewardVCard: 40,
  },
  {
    id: 'daily_win_1',
    period: 'daily',
    title: 'Prima Vittoria',
    description: 'Vinci almeno 1 partita oggi.',
    metric: 'matches_won',
    target: 1,
    rewardXp: 500,
    rewardVCard: 50,
  },
  {
    id: 'daily_uno_2',
    period: 'daily',
    title: 'Urlo UNO!',
    description: 'Dichiara UNO! 2 volte prima degli avversari.',
    metric: 'uno_calls',
    target: 2,
    rewardXp: 350,
    rewardVCard: 30,
  },
];

export const WEEKLY_CHALLENGES_POOL: readonly ChallengeDefinition[] = [
  {
    id: 'weekly_win_10',
    period: 'weekly',
    title: 'Campione Settimanale',
    description: 'Vinci 10 partite questa settimana.',
    metric: 'matches_won',
    target: 10,
    rewardXp: 2000,
    rewardVCard: 200,
  },
  {
    id: 'weekly_cards_150',
    period: 'weekly',
    title: 'Maestro del Ritmo',
    description: 'Gioca 150 carte in partite valide.',
    metric: 'cards_played',
    target: 150,
    rewardXp: 1500,
    rewardVCard: 150,
  },
  {
    id: 'weekly_stacks_8',
    period: 'weekly',
    title: 'Catena Infernale',
    description: 'Concatena almeno 8 carte +2/+4 in stacking.',
    metric: 'draw_stacks',
    target: 8,
    rewardXp: 1800,
    rewardVCard: 175,
  },
];

export const SEASONAL_CHALLENGES_POOL: readonly ChallengeDefinition[] = [
  {
    id: 'seasonal_win_50',
    period: 'seasonal',
    title: 'Leggenda della Stagione',
    description: 'Vinci 50 partite classificate o standard durante la Stagione 1.',
    metric: 'matches_won',
    target: 50,
    rewardXp: 5000,
    rewardVCard: 500,
  },
  {
    id: 'seasonal_cards_1000',
    period: 'seasonal',
    title: 'Dominatore del Tavolo',
    description: 'Gioca 1.000 carte complessive nella Stagione 1.',
    metric: 'cards_played',
    target: 1000,
    rewardXp: 4000,
    rewardVCard: 400,
  },
  {
    id: 'seasonal_stacks_35',
    period: 'seasonal',
    title: 'Maestro dello Stacking',
    description: 'Concatena 35 carte +2/+4 contro gli avversari in Stagione 1.',
    metric: 'draw_stacks',
    target: 35,
    rewardXp: 3500,
    rewardVCard: 350,
  },
];

// ── Tournaments ───────────────────────────────────────────────

export type TournamentKind =
  | 'ut32'
  | 'grand-prix'
  | 'classico'
  | 'pentathlon'
  | 'ucs-ssl';

export interface TournamentPreset {
  readonly kind: TournamentKind;
  readonly title: string;
  readonly maxPlayers: number;
  readonly entryFeeVCard: number;
  readonly prizePoolCredits: number;
  readonly prizeFirstVCard: number;
  readonly minMMR: number;
  readonly description: string;
}

export const TOURNAMENT_PRESETS: readonly TournamentPreset[] = [
  {
    kind: 'ut32',
    title: 'UT32 Eliminazione Diretta',
    maxPlayers: 32,
    entryFeeVCard: 0,
    prizePoolCredits: 2500,
    prizeFirstVCard: 300,
    minMMR: 0,
    description: 'Tabellone 32 contendenti a 2 ali simmetriche fino alla finalissima.',
  },
  {
    kind: 'grand-prix',
    title: 'Grand Prix Weekend',
    maxPlayers: 16,
    entryFeeVCard: 50,
    prizePoolCredits: 4000,
    prizeFirstVCard: 500,
    minMMR: 400,
    description: '4 manches con punteggio F1 (25/18/15/12) e finale a 4 giocatori.',
  },
  {
    kind: 'classico',
    title: 'Torneo Classico Giornaliero',
    maxPlayers: 8,
    entryFeeVCard: 0,
    prizePoolCredits: 1000,
    prizeFirstVCard: 150,
    minMMR: 0,
    description: 'Bracket rapido da 8 giocatori con regole ufficiali UNO.',
  },
  {
    kind: 'pentathlon',
    title: 'Pentathlon Multigioco',
    maxPlayers: 8,
    entryFeeVCard: 100,
    prizePoolCredits: 6000,
    prizeFirstVCard: 750,
    minMMR: 600,
    description: '5 prove consecutive: UNO, Blackjack, Scala 40, Scopa e Poker Texas.',
  },
  {
    kind: 'ucs-ssl',
    title: 'UCS SSL Invitational',
    maxPlayers: 16,
    entryFeeVCard: 0,
    prizePoolCredits: 10000,
    prizeFirstVCard: 1200,
    minMMR: 1600,
    description: 'Torneo Apex riservato ai giocatori Supersonic Legend (1600+ MMR).',
  },
] as const;

// ── Offline Sync Queue Contract ───────────────────────────────

export interface OfflineSyncEvent {
  readonly id: string;
  readonly kind: 'match_completed' | 'challenge_progress' | 'bot_xp';
  readonly mode: string;
  readonly won: boolean;
  readonly cardsPlayed: number;
  readonly xpDelta: number;
  readonly vcardDelta: number;
  readonly playedAt: string;
}
