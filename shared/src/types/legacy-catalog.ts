// ============================================================
// UNO ULTRA — Complete 15-Category Targhette, Missions, Realistic Bots & Sfide
// ============================================================

import type { ChallengeDefinition, CosmeticRarity } from "./economy.js";

export type LegacyTitleCategory =
  | "uno"
  | "scala40"
  | "ruba"
  | "blackjack"
  | "rank"
  | "scopa"
  | "burraco"
  | "poker"
  | "millemiglia"
  | "extra"
  | "club"
  | "multi"
  | "ucs"
  | "season1"
  | "season2";

export interface LegacyTitleCategoryMeta {
  readonly id: LegacyTitleCategory;
  readonly icon: string;
  readonly label: string;
}

export const LEGACY_TITLE_CATEGORIES: readonly LegacyTitleCategoryMeta[] = [
  {
    "id": "uno",
    "icon": "🎴",
    "label": "UNO"
  },
  {
    "id": "scala40",
    "icon": "♠️",
    "label": "Scala 40"
  },
  {
    "id": "ruba",
    "icon": "🃏",
    "label": "Ruba Mazzetto"
  },
  {
    "id": "blackjack",
    "icon": "🂡",
    "label": "Black Jack"
  },
  {
    "id": "rank",
    "icon": "🏅",
    "label": "Titoli Rank"
  },
  {
    "id": "scopa",
    "icon": "🧹",
    "label": "Scopa — Zero Residuo"
  },
  {
    "id": "burraco",
    "icon": "🃏",
    "label": "Burraco — Sincronia Perfetta"
  },
  {
    "id": "poker",
    "icon": "♠️",
    "label": "Poker Texas — Oltre il Bluff"
  },
  {
    "id": "millemiglia",
    "icon": "🚗",
    "label": "Millemiglia — Velocità Terminale"
  },
  {
    "id": "extra",
    "icon": "⭐",
    "label": "Titoli Extra"
  },
  {
    "id": "club",
    "icon": "👥",
    "label": "Club"
  },
  {
    "id": "multi",
    "icon": "🎖️",
    "label": "Multi-Modalità"
  },
  {
    "id": "ucs",
    "icon": "🌌",
    "label": "UCS — Ultra Champions Series"
  },
  {
    "id": "season1",
    "icon": "🏆",
    "label": "Stagione 1 — Trofei Legacy"
  },
  {
    "id": "season2",
    "icon": "🏆",
    "label": "Stagione 2 — Trofei Legacy"
  }
] as const;

export interface LegacyTitleDefinition {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly description: string;
  readonly category: LegacyTitleCategory;
  readonly rarity: CosmeticRarity;
  readonly prestigeTier: 1 | 2 | 3 | 4 | 5;
  readonly missionTarget?: number;
  readonly legacyUnavailable?: boolean;
  readonly mmrReq?: number;
  readonly feat?: string;
  readonly anim?: string;
}

export const LEGACY_TITLES: readonly LegacyTitleDefinition[] = [
  {
    "id": "t1",
    "name": "Principiante",
    "color": "#aaa",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "uno",
    "rarity": "common",
    "prestigeTier": 1,
    "mmrReq": 0
  },
  {
    "id": "uno10",
    "name": "⚡ Scarto Rapido",
    "color": "#fbbf24",
    "description": "Vinci 50 partite di UNO",
    "category": "uno",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 50,
    "feat": "uno_rank_10"
  },
  {
    "id": "uno11",
    "name": "➕ Maestro del +2",
    "color": "#f97316",
    "description": "Gioca 100 carte +2 in totale",
    "category": "uno",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 100,
    "feat": "uno_rank_11"
  },
  {
    "id": "uno12",
    "name": "💀 Incubo del +4",
    "color": "#ef4444",
    "description": "Gioca 50 carte +4 in totale",
    "category": "uno",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 50,
    "feat": "uno_rank_12"
  },
  {
    "id": "uno13",
    "name": "🎨 Muro di Colore",
    "color": "#8b5cf6",
    "description": "Vinci 100 partite di UNO",
    "category": "uno",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 100,
    "feat": "uno_rank_13"
  },
  {
    "id": "uno14",
    "name": "💡 Riflessi di Luce",
    "color": "#06b6d4",
    "description": "Vinci 150 partite di UNO",
    "category": "uno",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 150,
    "feat": "uno_rank_14"
  },
  {
    "id": "uno15",
    "name": "🎯 Tattico dell'Ultima Carta",
    "color": "#10b981",
    "description": "Dì UNO e vinci 30 volte",
    "category": "uno",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 30,
    "feat": "uno_rank_15"
  },
  {
    "id": "uno16",
    "name": "🛡️ Sentinella del Mazzo",
    "color": "#3b82f6",
    "description": "Vinci 200 partite di UNO",
    "category": "uno",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 200,
    "feat": "uno_rank_16"
  },
  {
    "id": "uno17",
    "name": "🦅 Predatore di Turni",
    "color": "#f59e0b",
    "description": "Vinci 300 partite di UNO",
    "category": "uno",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 300,
    "feat": "uno_rank_17"
  },
  {
    "id": "uno18",
    "name": "👻 Ombra del Salto",
    "color": "#6366f1",
    "description": "Usa 200 carte Skip in totale",
    "category": "uno",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 200,
    "feat": "uno_rank_18"
  },
  {
    "id": "uno19",
    "name": "🔄 Tiranno del Cambio Giro",
    "color": "#ec4899",
    "description": "Usa 200 carte Reverse in totale",
    "category": "uno",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 200,
    "feat": "uno_rank_19"
  },
  {
    "id": "uno20",
    "name": "🏗️ Architetto dello Scarto",
    "color": "#14b8a6",
    "description": "Vinci 500 partite di UNO",
    "category": "uno",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 500,
    "feat": "uno_rank_20"
  },
  {
    "id": "uno21",
    "name": "🌟 Leggenda dell'Uno",
    "color": "#f43f5e",
    "description": "Vinci 750 partite di UNO",
    "category": "uno",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 750,
    "feat": "uno_rank_21"
  },
  {
    "id": "uno22",
    "name": "🎭 Dominatore Cromatico",
    "color": "#a855f7",
    "description": "Vinci 1000 partite di UNO",
    "category": "uno",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 1000,
    "feat": "uno_rank_22"
  },
  {
    "id": "uno23",
    "name": "🌑 Eclissi di Carte",
    "color": "#1e293b",
    "description": "Vinci 1500 partite di UNO",
    "category": "uno",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 1500,
    "feat": "uno_rank_23"
  },
  {
    "id": "uno24",
    "name": "👑 Sovrano del Tavolo",
    "color": "#FFD700",
    "description": "Vinci 2000 partite di UNO",
    "category": "uno",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 2000,
    "feat": "uno_rank_24"
  },
  {
    "id": "uno25",
    "name": "🃏 DIVINITÀ DI UNO",
    "color": "#ffffff",
    "description": "Raggiungi l'apice assoluto di UNO — 2000 vittorie",
    "category": "uno",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 2000,
    "feat": "uno_rank_25"
  },
  {
    "id": "t2",
    "name": "S1 – Bronzo",
    "color": "#9E9E9E",
    "description": "Raggiungi 200 MMR in partita classificata.",
    "category": "season1",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 200,
    "mmrReq": 200
  },
  {
    "id": "t3",
    "name": "S1 – Argento",
    "color": "#C0C0C0",
    "description": "Raggiungi 400 MMR in partita classificata.",
    "category": "season1",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 400,
    "mmrReq": 400
  },
  {
    "id": "t4",
    "name": "S1 – Oro",
    "color": "#D39940",
    "description": "Raggiungi 600 MMR in partita classificata.",
    "category": "season1",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 600,
    "mmrReq": 600
  },
  {
    "id": "t5",
    "name": "S1 – Platino",
    "color": "#D2E4E3",
    "description": "Raggiungi 800 MMR in partita classificata.",
    "category": "season1",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 800,
    "mmrReq": 800
  },
  {
    "id": "t6",
    "name": "S1 – Diamante",
    "color": "#7EE4F8",
    "description": "Raggiungi 1000 MMR in partita classificata.",
    "category": "season1",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 1000,
    "mmrReq": 1000
  },
  {
    "id": "t7",
    "name": "S1 – Campione",
    "color": "#4A9CE1",
    "description": "Raggiungi 1200 MMR in partita classificata.",
    "category": "season1",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 1200,
    "mmrReq": 1200
  },
  {
    "id": "t8",
    "name": "S1 – Grande Campione",
    "color": "#FF4081",
    "description": "Raggiungi 1400 MMR in partita classificata.",
    "category": "season1",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 1400,
    "mmrReq": 1400
  },
  {
    "id": "t9",
    "name": "S1 – Leggenda Supersonica",
    "color": "#FFFFFF",
    "description": "Raggiungi 1600 MMR in partita classificata.",
    "category": "season1",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 1600,
    "mmrReq": 1600
  },
  {
    "id": "s1_leg_1",
    "name": "S1 – Bronzo",
    "color": "#9E9E9E",
    "description": "Hai raggiunto Bronzo nella Stagione 1 · Non più ottenibile",
    "category": "season1",
    "rarity": "rare",
    "prestigeTier": 2,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_2",
    "name": "S1 – Argento",
    "color": "#CBD5E1",
    "description": "Hai raggiunto Argento nella Stagione 1 · Non più ottenibile",
    "category": "season1",
    "rarity": "epic",
    "prestigeTier": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_3",
    "name": "S1 – Oro",
    "color": "#FFD500",
    "description": "Hai raggiunto Oro nella Stagione 1 · Non più ottenibile",
    "category": "season1",
    "rarity": "epic",
    "prestigeTier": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_4",
    "name": "S1 – Platino",
    "color": "#38BDF8",
    "description": "Hai raggiunto Platino nella Stagione 1 · Non più ottenibile",
    "category": "season1",
    "rarity": "epic",
    "prestigeTier": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_5",
    "name": "S1 – Diamante",
    "color": "#A855F7",
    "description": "Hai raggiunto Diamante nella Stagione 1 · Non più ottenibile",
    "category": "season1",
    "rarity": "epic",
    "prestigeTier": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_6",
    "name": "S1 – Campione",
    "color": "#EC4899",
    "description": "Hai raggiunto Campione nella Stagione 1 · Non più ottenibile",
    "category": "season1",
    "rarity": "epic",
    "prestigeTier": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_7",
    "name": "S1 – Grande Campione",
    "color": "#F43F5E",
    "description": "Hai raggiunto Grande Campione nella Stagione 1 · Non più ottenibile",
    "category": "season1",
    "rarity": "legendary",
    "prestigeTier": 4,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_8",
    "name": "S1 – Leggenda Supersonica",
    "color": "#FFFFFF",
    "description": "Hai raggiunto Leggenda Supersonica nella Stagione 1 · Non più ottenibile",
    "category": "season1",
    "rarity": "legendary",
    "prestigeTier": 4,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_9",
    "name": "S1 – Eredità Settebello",
    "color": "#FB923C",
    "description": "Top 3 Scopa nella stagione (S1) · Non più ottenibile",
    "category": "season1",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_10",
    "name": "S1 – Orizzonte Mille",
    "color": "#22D3EE",
    "description": "Top 3 Millemiglia nella stagione (S1) · Non più ottenibile",
    "category": "season1",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_11",
    "name": "S1 – Predatore del Piatto",
    "color": "#34D399",
    "description": "Top 3 Poker nella stagione (S1) · Non più ottenibile",
    "category": "season1",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_12",
    "name": "S1 – Sincronia Eterna",
    "color": "#C084FC",
    "description": "Top 3 Burraco nella stagione (S1) · Non più ottenibile",
    "category": "season1",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_13",
    "name": "S1 – Fastest Hand",
    "color": "#FBBF24",
    "description": "Vincitore modalità Blitz stagionale (S1) · Non più ottenibile",
    "category": "season1",
    "rarity": "mythic",
    "prestigeTier": 5,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_14",
    "name": "S1 – World Champion",
    "color": "#FFD32A",
    "description": "Campione UCS della stagione (S1) · Non più ottenibile",
    "category": "season1",
    "rarity": "mythic",
    "prestigeTier": 5,
    "legacyUnavailable": true
  },
  {
    "id": "s1_leg_15",
    "name": "S1 – Leggenda Senza Tempo",
    "color": "#FFFFFF",
    "description": "SSL confermato in 2 stagioni consecutive (S1) · Non più ottenibile",
    "category": "season1",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 2,
    "legacyUnavailable": true
  },
  {
    "id": "t10",
    "name": "Fastest Hand S1",
    "color": "var(--teal)",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "blitz_speed"
  },
  {
    "id": "t11",
    "name": "No Mercy",
    "color": "#ff6b35",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "overload_win"
  },
  {
    "id": "t12",
    "name": "Senza Pietà",
    "color": "var(--crimson)",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "stack8"
  },
  {
    "id": "tg1",
    "name": "Instancabile",
    "color": "#00E5FF",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "games_100"
  },
  {
    "id": "tg2",
    "name": "Veterano di Ultra",
    "color": "#7EE4F8",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "games_500"
  },
  {
    "id": "tg3",
    "name": "Leggenda Vivente",
    "color": "#FF4081",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "season_champ_2x"
  },
  {
    "id": "ts1",
    "name": "Il Terrore dei +4",
    "color": "#ff6b35",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "w4_triple"
  },
  {
    "id": "ts2",
    "name": "Ultima Parola",
    "color": "#00ff88",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "win_action"
  },
  {
    "id": "ts3",
    "name": "Fantasma",
    "color": "rgba(200,200,255,.8)",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "win_no_uno"
  },
  {
    "id": "ts4",
    "name": "Il Mago del +4",
    "color": "#FF4081",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "w4_100"
  },
  {
    "id": "ti1",
    "name": "Pescato dal Destino",
    "color": "#aaa",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "hand_20_loss"
  },
  {
    "id": "ti2",
    "name": "Quasi SSL",
    "color": "rgba(255,255,255,.6)",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "hardstuck_20"
  },
  {
    "id": "tm1",
    "name": "Creatura del Vuoto",
    "color": "#6c2fa0",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "win_dark"
  },
  {
    "id": "tm2",
    "name": "Anomalia",
    "color": "#ff00ff",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "chaos_5win"
  },
  {
    "id": "tm3",
    "name": "010101",
    "color": "#00ff88",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "beat_ultra_bot"
  },
  {
    "id": "tc1",
    "name": "Fortunato",
    "color": "#FFD700",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "crate_win"
  },
  {
    "id": "tc2",
    "name": "Collezionista",
    "color": "#c084fc",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "crates_5"
  },
  {
    "id": "tc3",
    "name": "Jolly del Mazzo",
    "color": "#00E5FF",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "extra",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "crate_legendary_win"
  },
  {
    "id": "mx1",
    "name": "🎖️ Giocatore Totale",
    "color": "#F5C842",
    "description": "Vinci in tutte le 6 modalità",
    "category": "extra",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 6,
    "feat": "all_modes_win"
  },
  {
    "id": "tx1",
    "name": "🎖️ Il Veterano",
    "color": "#CD7F32",
    "description": "Vinci 500 partite",
    "category": "extra",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 500,
    "feat": "veteran"
  },
  {
    "id": "tx2",
    "name": "💀 Terrore dei Bot",
    "color": "#ff4466",
    "description": "Batti l'IA SSL 10 volte",
    "category": "extra",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 10,
    "feat": "bot_slayer"
  },
  {
    "id": "tx4",
    "name": "🔥 10 Vittorie di Fila",
    "color": "#ff6b35",
    "description": "10 vittorie consecutive",
    "category": "extra",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 10,
    "feat": "win_streak_10"
  },
  {
    "id": "tx5",
    "name": "🌑 Oscurità Totale",
    "color": "#8b5cf6",
    "description": "Vinci senza carte speciali",
    "category": "extra",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "win_no_wild"
  },
  {
    "id": "tx6",
    "name": "👑 Dio di UNO",
    "color": "#ffffff",
    "description": "Raggiungi SSL e diventa il Dio",
    "category": "extra",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "god_of_uno"
  },
  {
    "id": "tx7",
    "name": "⚡ Velocista",
    "color": "#00E5FF",
    "description": "Vinci in Speed Blitz",
    "category": "extra",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "speed_demon"
  },
  {
    "id": "tx8",
    "name": "🌪️ Caos Totale",
    "color": "#FF4081",
    "description": "Vinci in modalità Chaos",
    "category": "extra",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "chaos_winner"
  },
  {
    "id": "bp_lv5",
    "name": "⚡ Iniziato del Pass",
    "color": "#9ca3af",
    "description": "Raggiungi Livello 5 del Battle Pass",
    "category": "extra",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 5,
    "feat": "bp_lv5"
  },
  {
    "id": "bp_lv10",
    "name": "🔥 Percorso Acceso",
    "color": "#fb923c",
    "description": "Raggiungi Livello 10 del Battle Pass",
    "category": "extra",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 10,
    "feat": "bp_lv10"
  },
  {
    "id": "bp_lv15",
    "name": "💎 Portatore del Pass",
    "color": "#7EE4F8",
    "description": "Raggiungi Livello 15 del Battle Pass",
    "category": "extra",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 15,
    "feat": "bp_lv15"
  },
  {
    "id": "bp_lv20",
    "name": "🌟 Veterano della Stagione",
    "color": "#F5C842",
    "description": "Raggiungi Livello 20 del Battle Pass",
    "category": "extra",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 20,
    "feat": "bp_lv20"
  },
  {
    "id": "bp_lv25",
    "name": "👑 SIGNORE DEL PASS",
    "color": "#ffffff",
    "description": "Raggiungi Livello 25 del Battle Pass",
    "category": "extra",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 25,
    "feat": "bp_lv25"
  },
  {
    "id": "tt1",
    "name": "🥉 Campione Bronzo I",
    "color": "#CD7F32",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "tourney_bronze1"
  },
  {
    "id": "tt2",
    "name": "🥉 Campione Bronzo II",
    "color": "#CD7F32",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "tourney_bronze2"
  },
  {
    "id": "tt3",
    "name": "🥉 Campione Bronzo III",
    "color": "#CD7F32",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "tourney_bronze3"
  },
  {
    "id": "tt4",
    "name": "🥈 Campione Argento I",
    "color": "#C0C0C0",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "tourney_silver1"
  },
  {
    "id": "tt5",
    "name": "🥈 Campione Argento II",
    "color": "#C0C0C0",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "tourney_silver2"
  },
  {
    "id": "tt6",
    "name": "🥈 Campione Argento III",
    "color": "#C0C0C0",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "tourney_silver3"
  },
  {
    "id": "tt7",
    "name": "🥇 Campione Oro I",
    "color": "#D39940",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "tourney_gold1"
  },
  {
    "id": "tt8",
    "name": "🥇 Campione Oro II",
    "color": "#D39940",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "tourney_gold2"
  },
  {
    "id": "tt9",
    "name": "🥇 Campione Oro III",
    "color": "#D39940",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "tourney_gold3"
  },
  {
    "id": "tt10",
    "name": "💠 Campione Platino I",
    "color": "#D2E4E3",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "tourney_plat1"
  },
  {
    "id": "tt11",
    "name": "💠 Campione Platino II",
    "color": "#D2E4E3",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "tourney_plat2"
  },
  {
    "id": "tt12",
    "name": "💠 Campione Platino III",
    "color": "#D2E4E3",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "tourney_plat3"
  },
  {
    "id": "tt13",
    "name": "💎 Campione Diamante I",
    "color": "#7EE4F8",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "tourney_diamond1"
  },
  {
    "id": "tt14",
    "name": "💎 Campione Diamante II",
    "color": "#7EE4F8",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "tourney_diamond2"
  },
  {
    "id": "tt15",
    "name": "💎 Campione Diamante III",
    "color": "#7EE4F8",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "tourney_diamond3"
  },
  {
    "id": "tt16",
    "name": "🏅 Campione Champion I",
    "color": "#4A9CE1",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "tourney_champ1"
  },
  {
    "id": "tt17",
    "name": "🏅 Campione Champion II",
    "color": "#4A9CE1",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "tourney_champ2"
  },
  {
    "id": "tt18",
    "name": "🏅 Campione Champion III",
    "color": "#4A9CE1",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "tourney_champ3"
  },
  {
    "id": "tt19",
    "name": "🔥 Grande Campione I",
    "color": "#FF4081",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "tourney_gchamp1"
  },
  {
    "id": "tt20",
    "name": "🔥 Grande Campione II",
    "color": "#FF4081",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "tourney_gchamp2"
  },
  {
    "id": "tt21",
    "name": "🔥 Grande Campione III",
    "color": "#FF4081",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "mythic",
    "prestigeTier": 5,
    "feat": "tourney_gchamp3"
  },
  {
    "id": "tt22",
    "name": "⚡ Leggenda Supersonica",
    "color": "#FFFFFF",
    "description": "Impresa speciale UNO ULTRA.",
    "category": "rank",
    "rarity": "mythic",
    "prestigeTier": 5,
    "feat": "tourney_ssl"
  },
  {
    "id": "rank24",
    "name": "⚡ Semidio dell'Olimpo",
    "color": "#c084fc",
    "description": "Vinci 500 partite ranked e raggiungi Grande Campione",
    "category": "rank",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 500,
    "feat": "rank_prog_24"
  },
  {
    "id": "rank25",
    "name": "🌌 ENTITÀ SUPREMA",
    "color": "#ffffff",
    "description": "Raggiungi SSL (1600+ MMR) e vinci 1000 partite ranked",
    "category": "rank",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 1600,
    "feat": "rank_prog_25"
  },
  {
    "id": "sc01",
    "name": "Protocollo S",
    "color": "#fb923c",
    "description": "Vinci 1 partita a Scopa",
    "category": "scopa",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "scopa_win1"
  },
  {
    "id": "sc02",
    "name": "Impulso Primario",
    "color": "#f97316",
    "description": "Cattura il Settebello (7 di denari)",
    "category": "scopa",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 7,
    "feat": "scopa_sett1"
  },
  {
    "id": "sc03",
    "name": "Tabula Rasa",
    "color": "#ea580c",
    "description": "Fai 1 scopa in una partita",
    "category": "scopa",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "scopa_scopa1"
  },
  {
    "id": "sc04",
    "name": "Dominio Assoluto",
    "color": "#fb923c",
    "description": "Vinci la primiera in una partita",
    "category": "scopa",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "scopa_prim1"
  },
  {
    "id": "sc05",
    "name": "Sovraccarico",
    "color": "#fbbf24",
    "description": "Cattura 5+ denari in una manche",
    "category": "scopa",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 5,
    "feat": "scopa_den5"
  },
  {
    "id": "sc06",
    "name": "Collisione Finale",
    "color": "#f59e0b",
    "description": "Fai 3 scope in una partita",
    "category": "scopa",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 3,
    "feat": "scopa_scopa3g"
  },
  {
    "id": "sc07",
    "name": "Catena d'Oro",
    "color": "#d97706",
    "description": "Cattura A+2+3 di denari (Napola) in una partita",
    "category": "scopa",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 2,
    "feat": "scopa_napola1"
  },
  {
    "id": "sc08",
    "name": "Impulso Cinetico",
    "color": "#fb923c",
    "description": "Fai 5 scope in una partita",
    "category": "scopa",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 5,
    "feat": "scopa_scopa5g"
  },
  {
    "id": "sc09",
    "name": "Nucleo Attivo",
    "color": "#fcd34d",
    "description": "Cattura 7+ denari in una manche",
    "category": "scopa",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 7,
    "feat": "scopa_den7"
  },
  {
    "id": "sc10",
    "name": "Settore Zero",
    "color": "#fb923c",
    "description": "Fai 10 scope totali (cumulativi)",
    "category": "scopa",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 10,
    "feat": "scopa_scopa10t"
  },
  {
    "id": "sc11",
    "name": "Impulso Secco",
    "color": "#f97316",
    "description": "Vinci una partita con 1 solo punto di scarto",
    "category": "scopa",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "scopa_win1pt"
  },
  {
    "id": "sc12",
    "name": "Eclissi Totale",
    "color": "#ea580c",
    "description": "Fai 2 scope in una singola manche",
    "category": "scopa",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 2,
    "feat": "scopa_scopa2r"
  },
  {
    "id": "sc13",
    "name": "Carica d'Urto",
    "color": "#fbbf24",
    "description": "Cattura tutti e 4 gli assi in una partita",
    "category": "scopa",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 4,
    "feat": "scopa_aces4"
  },
  {
    "id": "sc14",
    "name": "Oltre il Limite",
    "color": "#f59e0b",
    "description": "Fai 3 scope in una singola manche",
    "category": "scopa",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 3,
    "feat": "scopa_scopa3r"
  },
  {
    "id": "sc15",
    "name": "Zenith",
    "color": "#d97706",
    "description": "Cattura il Settebello in 3 partite diverse",
    "category": "scopa",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 3,
    "feat": "scopa_sett3t"
  },
  {
    "id": "sc16",
    "name": "Reazione a Catena",
    "color": "#fb923c",
    "description": "Fai 7 scope in una partita",
    "category": "scopa",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 7,
    "feat": "scopa_scopa7g"
  },
  {
    "id": "sc17",
    "name": "Flusso Costante",
    "color": "#f97316",
    "description": "Vinci la primiera in 3 partite diverse",
    "category": "scopa",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 3,
    "feat": "scopa_prim3t"
  },
  {
    "id": "sc18",
    "name": "Divisione Elite",
    "color": "#ea580c",
    "description": "Vinci 10 partite a Scopa",
    "category": "scopa",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 10,
    "feat": "scopa_win10"
  },
  {
    "id": "sc19",
    "name": "Incursione",
    "color": "#fbbf24",
    "description": "Vinci Denari+Settebello+Napola in una sola partita",
    "category": "scopa",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "scopa_rebello"
  },
  {
    "id": "sc20",
    "name": "Titanio",
    "color": "#f59e0b",
    "description": "Vinci 20 partite a Scopa",
    "category": "scopa",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 20,
    "feat": "scopa_win20"
  },
  {
    "id": "sc21",
    "name": "Frequenza Alta",
    "color": "#d97706",
    "description": "Completa la Napola in 3 partite diverse",
    "category": "scopa",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 3,
    "feat": "scopa_napola3t"
  },
  {
    "id": "sc22",
    "name": "Punto di Rottura",
    "color": "#fb923c",
    "description": "Fai 10 scope in una sola partita",
    "category": "scopa",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 10,
    "feat": "scopa_scopa10g"
  },
  {
    "id": "sc23",
    "name": "Eredità Settebello",
    "color": "#fcd34d",
    "description": "Cattura il Settebello in 5 partite diverse",
    "category": "scopa",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 5,
    "feat": "scopa_sett5t"
  },
  {
    "id": "sc24",
    "name": "Orizzonte Eventi",
    "color": "#fb923c",
    "description": "Vinci 30 partite a Scopa",
    "category": "scopa",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 30,
    "feat": "scopa_win30"
  },
  {
    "id": "sc25",
    "name": "Architetti del Vuoto",
    "color": "#fef08a",
    "description": "Vinci Carte+Denari+Settebello+Primiera+Napola in una partita",
    "category": "scopa",
    "rarity": "mythic",
    "prestigeTier": 5,
    "feat": "scopa_grandslam"
  },
  {
    "id": "sc1",
    "name": "🎴 Scalatore",
    "color": "#c084fc",
    "description": "Vinci 1 partita di Scala 40",
    "category": "scopa",
    "rarity": "mythic",
    "prestigeTier": 5,
    "feat": "scala_win1"
  },
  {
    "id": "sc2",
    "name": "🎴 Re della Scala",
    "color": "#c084fc",
    "description": "Vinci 10 partite di Scala 40",
    "category": "scopa",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 10,
    "feat": "scala_win10"
  },
  {
    "id": "sc3",
    "name": "🎴 Maestro Scala 40",
    "color": "#a855f7",
    "description": "Vinci 50 partite di Scala 40",
    "category": "scopa",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 50,
    "feat": "scala_win50"
  },
  {
    "id": "br01",
    "name": "Flusso Sequenziale",
    "color": "#c084fc",
    "description": "Fai 1 burraco in una partita",
    "category": "burraco",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "burraco_brr1"
  },
  {
    "id": "br02",
    "name": "Nucleo Energetico",
    "color": "#a855f7",
    "description": "Prendi il pozzetto in una partita",
    "category": "burraco",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "burraco_pozz1"
  },
  {
    "id": "br03",
    "name": "Sintesi Pura",
    "color": "#9333ea",
    "description": "Vinci 1 partita a Burraco",
    "category": "burraco",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "burraco_win1"
  },
  {
    "id": "br04",
    "name": "Moltiplicatore",
    "color": "#c084fc",
    "description": "Cala un gruppo di 4 stessa carta (pinella)",
    "category": "burraco",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 4,
    "feat": "burraco_pin1"
  },
  {
    "id": "br05",
    "name": "Architettura Zero",
    "color": "#d8b4fe",
    "description": "Vinci la partita con almeno 1 burraco puro (senza matte)",
    "category": "burraco",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "burraco_cleanwin"
  },
  {
    "id": "br06",
    "name": "Frequenza Critica",
    "color": "#a855f7",
    "description": "Vinci la prima manche (round 1)",
    "category": "burraco",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "burraco_smaz1"
  },
  {
    "id": "br07",
    "name": "Algoritmo Perfetto",
    "color": "#9333ea",
    "description": "Fai 2 burracos in una partita",
    "category": "burraco",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 2,
    "feat": "burraco_brr2g"
  },
  {
    "id": "br08",
    "name": "Fase di Carica",
    "color": "#c084fc",
    "description": "Prendi il pozzetto e fai burraco nella stessa partita",
    "category": "burraco",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "burraco_pozzbrr"
  },
  {
    "id": "br09",
    "name": "Integrazione Totale",
    "color": "#d8b4fe",
    "description": "Vinci 5 partite a Burraco",
    "category": "burraco",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 5,
    "feat": "burraco_win5"
  },
  {
    "id": "br10",
    "name": "Punto d'Iniezione",
    "color": "#a855f7",
    "description": "Cala 2 pinelle in una stessa partita",
    "category": "burraco",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 2,
    "feat": "burraco_pin2g"
  },
  {
    "id": "br11",
    "name": "Evoluzione",
    "color": "#9333ea",
    "description": "Vinci 10 partite a Burraco",
    "category": "burraco",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 10,
    "feat": "burraco_win10"
  },
  {
    "id": "br12",
    "name": "Cristallo Liquido",
    "color": "#c084fc",
    "description": "Fai 3 burracos puri totali (cumulativi)",
    "category": "burraco",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 3,
    "feat": "burraco_clean3t"
  },
  {
    "id": "br13",
    "name": "Risonanza",
    "color": "#d8b4fe",
    "description": "Segna 500+ punti in una singola manche",
    "category": "burraco",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 500,
    "feat": "burraco_500pts"
  },
  {
    "id": "br14",
    "name": "Switch Finale",
    "color": "#a855f7",
    "description": "Prendi il pozzetto e chiudi la partita",
    "category": "burraco",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "burraco_pozzclose"
  },
  {
    "id": "br15",
    "name": "Matrice Punti",
    "color": "#9333ea",
    "description": "Raggiungi 1000 punti totali in una partita",
    "category": "burraco",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 1000,
    "feat": "burraco_1000pts"
  },
  {
    "id": "br16",
    "name": "Sovratensione",
    "color": "#c084fc",
    "description": "Cala 5 pinelle totali (cumulativi)",
    "category": "burraco",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 5,
    "feat": "burraco_pin5t"
  },
  {
    "id": "br17",
    "name": "Progetto Infinito",
    "color": "#d8b4fe",
    "description": "Vinci 20 partite a Burraco",
    "category": "burraco",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 20,
    "feat": "burraco_win20"
  },
  {
    "id": "br18",
    "name": "Rientro Orbitale",
    "color": "#a855f7",
    "description": "Prendi il pozzetto in 10 partite diverse",
    "category": "burraco",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 10,
    "feat": "burraco_pozz10t"
  },
  {
    "id": "br19",
    "name": "Connessione Neurale",
    "color": "#9333ea",
    "description": "Vinci 25 partite a Burraco",
    "category": "burraco",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 25,
    "feat": "burraco_win25"
  },
  {
    "id": "br20",
    "name": "Frammentazione Zero",
    "color": "#c084fc",
    "description": "Fai burraco puro + pinella nella stessa partita",
    "category": "burraco",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "burraco_cleanpin"
  },
  {
    "id": "br21",
    "name": "Nucleo Magnetico",
    "color": "#d8b4fe",
    "description": "Vinci 30 partite a Burraco",
    "category": "burraco",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 30,
    "feat": "burraco_win30"
  },
  {
    "id": "br22",
    "name": "Punto di Estrazione",
    "color": "#a855f7",
    "description": "Fai 10 burracos totali (cumulativi)",
    "category": "burraco",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 10,
    "feat": "burraco_brr10t"
  },
  {
    "id": "br23",
    "name": "Flusso Cobalto",
    "color": "#9333ea",
    "description": "Cala 10 pinelle totali (cumulativi)",
    "category": "burraco",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 10,
    "feat": "burraco_pin10t"
  },
  {
    "id": "br24",
    "name": "Sovrapposizione",
    "color": "#c084fc",
    "description": "Prendi il pozzetto in 20 partite diverse",
    "category": "burraco",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 20,
    "feat": "burraco_pozz20t"
  },
  {
    "id": "br25",
    "name": "Codice d'Onore",
    "color": "#f3e8ff",
    "description": "Vinci 50 partite a Burraco",
    "category": "burraco",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 50,
    "feat": "burraco_win50"
  },
  {
    "id": "pk01",
    "name": "Punto di Non Ritorno",
    "color": "#34d399",
    "description": "Vinci un all-in",
    "category": "poker",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "poker_allin1"
  },
  {
    "id": "pk02",
    "name": "Oltre il Buio",
    "color": "#10b981",
    "description": "Vinci 1 partita a Poker",
    "category": "poker",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "poker_win1"
  },
  {
    "id": "pk03",
    "name": "Corrente Letale",
    "color": "#059669",
    "description": "Vinci una mano al river (showdown)",
    "category": "poker",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "poker_river1"
  },
  {
    "id": "pk04",
    "name": "Architetto d'Ombre",
    "color": "#34d399",
    "description": "Vinci quando l'avversario folda",
    "category": "poker",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "poker_bluff1"
  },
  {
    "id": "pk05",
    "name": "Calcolo a Freddo",
    "color": "#6ee7b7",
    "description": "Vinci 3 partite a Poker",
    "category": "poker",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 3,
    "feat": "poker_win3"
  },
  {
    "id": "pk06",
    "name": "Impatto Iniziale",
    "color": "#10b981",
    "description": "Vinci una mano al flop (tutti foldano prima del turn)",
    "category": "poker",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "poker_flop1"
  },
  {
    "id": "pk07",
    "name": "Terrore Psicologico",
    "color": "#059669",
    "description": "Vinci 5 partite a Poker",
    "category": "poker",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 5,
    "feat": "poker_win5"
  },
  {
    "id": "pk08",
    "name": "Sangue Freddo",
    "color": "#34d399",
    "description": "Vinci uno showdown (carte scoperte)",
    "category": "poker",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "poker_showdown1"
  },
  {
    "id": "pk09",
    "name": "Verità d'Acciaio",
    "color": "#6ee7b7",
    "description": "Vinci con Full House o mano superiore",
    "category": "poker",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "poker_fh1"
  },
  {
    "id": "pk10",
    "name": "Predatore del Piatto",
    "color": "#10b981",
    "description": "Vinci 10 partite a Poker",
    "category": "poker",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 10,
    "feat": "poker_win10"
  },
  {
    "id": "pk11",
    "name": "Scacco Matto",
    "color": "#059669",
    "description": "Vinci 3 partite consecutive a Poker",
    "category": "poker",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 3,
    "feat": "poker_streak3"
  },
  {
    "id": "pk12",
    "name": "Rotazione Critica",
    "color": "#34d399",
    "description": "Vinci una mano che si decide al turn",
    "category": "poker",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "poker_turn1"
  },
  {
    "id": "pk13",
    "name": "Impulso Finale",
    "color": "#6ee7b7",
    "description": "Vinci 15 partite a Poker",
    "category": "poker",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 15,
    "feat": "poker_win15"
  },
  {
    "id": "pk14",
    "name": "Visione X",
    "color": "#10b981",
    "description": "Vinci la partita dopo essere sceso sotto 200 chips",
    "category": "poker",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 200,
    "feat": "poker_comeback1"
  },
  {
    "id": "pk15",
    "name": "Dominio Totale",
    "color": "#059669",
    "description": "Vinci 20 partite a Poker",
    "category": "poker",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 20,
    "feat": "poker_win20"
  },
  {
    "id": "pk16",
    "name": "Ultima Speranza",
    "color": "#34d399",
    "description": "Vinci 3 mani al river (cumulativo)",
    "category": "poker",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 3,
    "feat": "poker_river3t"
  },
  {
    "id": "pk17",
    "name": "Cyber-Bluff",
    "color": "#6ee7b7",
    "description": "Fai foldare l'avversario 5 volte (cumulativo)",
    "category": "poker",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 5,
    "feat": "poker_bluff5t"
  },
  {
    "id": "pk18",
    "name": "Muro Indistruttibile",
    "color": "#10b981",
    "description": "Vinci con Full House in 3 partite diverse",
    "category": "poker",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 3,
    "feat": "poker_fh3t"
  },
  {
    "id": "pk19",
    "name": "Protocollo Ombra",
    "color": "#059669",
    "description": "Vinci 30 partite a Poker",
    "category": "poker",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 30,
    "feat": "poker_win30"
  },
  {
    "id": "pk20",
    "name": "Fuoco Incrociato",
    "color": "#34d399",
    "description": "Vinci 5 all-in totali (cumulativo)",
    "category": "poker",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 5,
    "feat": "poker_allin5t"
  },
  {
    "id": "pk21",
    "name": "Punto Cieco",
    "color": "#6ee7b7",
    "description": "Vinci 40 partite a Poker",
    "category": "poker",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 40,
    "feat": "poker_win40"
  },
  {
    "id": "pk22",
    "name": "Detonazione",
    "color": "#10b981",
    "description": "Vinci 10 all-in totali (cumulativo)",
    "category": "poker",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 10,
    "feat": "poker_allin10t"
  },
  {
    "id": "pk23",
    "name": "Mente Alveare",
    "color": "#059669",
    "description": "Vinci 50 partite a Poker",
    "category": "poker",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 50,
    "feat": "poker_win50"
  },
  {
    "id": "pk24",
    "name": "Eredità dei Re",
    "color": "#34d399",
    "description": "Vinci con Scala Reale o Scala a Colore",
    "category": "poker",
    "rarity": "mythic",
    "prestigeTier": 5,
    "feat": "poker_royalflush"
  },
  {
    "id": "pk25",
    "name": "Vuoto d'Aria",
    "color": "#d1fae5",
    "description": "Vinci 100 partite a Poker",
    "category": "poker",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 100,
    "feat": "poker_win100"
  },
  {
    "id": "mm01",
    "name": "Oltre la Barriera",
    "color": "#22d3ee",
    "description": "Vinci 1 partita a Millemiglia",
    "category": "millemiglia",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "mille_win1"
  },
  {
    "id": "mm02",
    "name": "Accensione",
    "color": "#06b6d4",
    "description": "Gioca il primo Semaforo Verde",
    "category": "millemiglia",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "mille_green1"
  },
  {
    "id": "mm03",
    "name": "Resistenza Estrema",
    "color": "#0891b2",
    "description": "Vinci 3 partite a Millemiglia",
    "category": "millemiglia",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 3,
    "feat": "mille_win3"
  },
  {
    "id": "mm04",
    "name": "Intervento Rapido",
    "color": "#22d3ee",
    "description": "Recupera da un guasto (gioca una carta rimedio)",
    "category": "millemiglia",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "mille_remedy1"
  },
  {
    "id": "mm05",
    "name": "Protocollo 1000",
    "color": "#67e8f9",
    "description": "Vinci 5 partite a Millemiglia",
    "category": "millemiglia",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 5,
    "feat": "mille_win5"
  },
  {
    "id": "mm06",
    "name": "Blocco Totale",
    "color": "#06b6d4",
    "description": "Blocca un avversario con Semaforo Rosso",
    "category": "millemiglia",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "mille_redlight1"
  },
  {
    "id": "mm07",
    "name": "Corsa Infinita",
    "color": "#0891b2",
    "description": "Vinci 10 partite a Millemiglia",
    "category": "millemiglia",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 10,
    "feat": "mille_win10"
  },
  {
    "id": "mm08",
    "name": "Conto alla Rovescia",
    "color": "#22d3ee",
    "description": "Raggiungi 500 miglia in una partita",
    "category": "millemiglia",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 500,
    "feat": "mille_500mi"
  },
  {
    "id": "mm09",
    "name": "Asfalto Liquido",
    "color": "#67e8f9",
    "description": "Vinci 15 partite a Millemiglia",
    "category": "millemiglia",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 15,
    "feat": "mille_win15"
  },
  {
    "id": "mm10",
    "name": "Spinta Idraulica",
    "color": "#06b6d4",
    "description": "Gioca una carta immunità (sicurezza)",
    "category": "millemiglia",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "mille_safety1"
  },
  {
    "id": "mm11",
    "name": "Traiettoria Ideale",
    "color": "#0891b2",
    "description": "Vinci 20 partite a Millemiglia",
    "category": "millemiglia",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 20,
    "feat": "mille_win20"
  },
  {
    "id": "mm12",
    "name": "Backup Energetico",
    "color": "#22d3ee",
    "description": "Usa la Ruota di Scorta o Serbatoio Extra (immunity)",
    "category": "millemiglia",
    "rarity": "epic",
    "prestigeTier": 3,
    "feat": "mille_spare1"
  },
  {
    "id": "mm13",
    "name": "Orizzonte Mille",
    "color": "#67e8f9",
    "description": "Vinci 25 partite a Millemiglia",
    "category": "millemiglia",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 25,
    "feat": "mille_win25"
  },
  {
    "id": "mm14",
    "name": "Iniezione Diretta",
    "color": "#06b6d4",
    "description": "Gioca 3 carte da 200 miglia in una partita",
    "category": "millemiglia",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 3,
    "feat": "mille_200x3"
  },
  {
    "id": "mm15",
    "name": "Vento di Fuoco",
    "color": "#0891b2",
    "description": "Vinci 30 partite a Millemiglia",
    "category": "millemiglia",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 30,
    "feat": "mille_win30"
  },
  {
    "id": "mm16",
    "name": "Codice Colore",
    "color": "#22d3ee",
    "description": "Blocca e poi sblocca un avversario nella stessa partita",
    "category": "millemiglia",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "mille_blockfix"
  },
  {
    "id": "mm17",
    "name": "Meccanica Quantistica",
    "color": "#67e8f9",
    "description": "Vinci 40 partite a Millemiglia",
    "category": "millemiglia",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 40,
    "feat": "mille_win40"
  },
  {
    "id": "mm18",
    "name": "Oltre il Traguardo",
    "color": "#06b6d4",
    "description": "Vinci una partita giocando una carta da 200 miglia",
    "category": "millemiglia",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 200,
    "feat": "mille_200win"
  },
  {
    "id": "mm19",
    "name": "Impulso Stradale",
    "color": "#0891b2",
    "description": "Vinci 50 partite a Millemiglia",
    "category": "millemiglia",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 50,
    "feat": "mille_win50"
  },
  {
    "id": "mm20",
    "name": "Vuoto Aerodinamico",
    "color": "#22d3ee",
    "description": "Vinci la gara essendo stato in svantaggio di 200+ miglia",
    "category": "millemiglia",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 200,
    "feat": "mille_overtake"
  },
  {
    "id": "mm21",
    "name": "Titanio e Cromo",
    "color": "#67e8f9",
    "description": "Vinci 60 partite a Millemiglia",
    "category": "millemiglia",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 60,
    "feat": "mille_win60"
  },
  {
    "id": "mm22",
    "name": "Reazione Zero",
    "color": "#06b6d4",
    "description": "Vinci una partita avendo giocato almeno 1 immunità",
    "category": "millemiglia",
    "rarity": "mythic",
    "prestigeTier": 5,
    "feat": "mille_safetywin"
  },
  {
    "id": "mm23",
    "name": "Evoluzione Corsa",
    "color": "#0891b2",
    "description": "Vinci 75 partite a Millemiglia",
    "category": "millemiglia",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 75,
    "feat": "mille_win75"
  },
  {
    "id": "mm24",
    "name": "Rigenerazione",
    "color": "#22d3ee",
    "description": "Recupera da Semaforo Rosso, Guasto, Foratura e Carburante esaurito in partite diverse",
    "category": "millemiglia",
    "rarity": "mythic",
    "prestigeTier": 5,
    "feat": "mille_allhazards"
  },
  {
    "id": "mm25",
    "name": "Ultimo Chilometro",
    "color": "#e0f2fe",
    "description": "Vinci 100 partite a Millemiglia",
    "category": "millemiglia",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 100,
    "feat": "mille_win100"
  },
  {
    "id": "scala6",
    "name": "🃏 Primo Trittico",
    "color": "#c084fc",
    "description": "Vinci 5 partite di Scala 40",
    "category": "scala40",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 5,
    "feat": "scala_rank_6"
  },
  {
    "id": "scala7",
    "name": "🎯 Esperto di Sequenze",
    "color": "#a855f7",
    "description": "Vinci 15 partite di Scala 40",
    "category": "scala40",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 15,
    "feat": "scala_rank_7"
  },
  {
    "id": "scala8",
    "name": "🃏 Collezionista di Jolly",
    "color": "#8b5cf6",
    "description": "Completa 20 sequenze con Jolly",
    "category": "scala40",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 20,
    "feat": "scala_rank_8"
  },
  {
    "id": "scala9",
    "name": "🧩 Stratega del Pozzo",
    "color": "#7c3aed",
    "description": "Vinci 30 partite di Scala 40",
    "category": "scala40",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 30,
    "feat": "scala_rank_9"
  },
  {
    "id": "scala10",
    "name": "🧊 Calcolatore Freddo",
    "color": "#6d28d9",
    "description": "Vinci 50 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 50,
    "feat": "scala_rank_10"
  },
  {
    "id": "scala11",
    "name": "🏁 Maestro della Chiusura",
    "color": "#ddd6fe",
    "description": "Chiudi il mazzo senza pescare 20 volte",
    "category": "scala40",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 20,
    "feat": "scala_rank_11"
  },
  {
    "id": "scala12",
    "name": "👑 Re dei Giochi Aperti",
    "color": "#e9d5ff",
    "description": "Vinci 80 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 80,
    "feat": "scala_rank_12"
  },
  {
    "id": "scala13",
    "name": "⚗️ Alchimista di Carte",
    "color": "#f5d0fe",
    "description": "Vinci 120 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 120,
    "feat": "scala_rank_13"
  },
  {
    "id": "scala14",
    "name": "🔮 Visionario del Burraco",
    "color": "#fae8ff",
    "description": "Vinci 180 partite di Scala 40",
    "category": "scala40",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 180,
    "feat": "scala_rank_14"
  },
  {
    "id": "scala15",
    "name": "📐 Matematico del 40",
    "color": "#c084fc",
    "description": "Vinci 250 partite di Scala 40",
    "category": "scala40",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 250,
    "feat": "scala_rank_15"
  },
  {
    "id": "scala16",
    "name": "🏗️ Architetto di Scale",
    "color": "#a855f7",
    "description": "Vinci 350 partite di Scala 40",
    "category": "scala40",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 350,
    "feat": "scala_rank_16"
  },
  {
    "id": "scala17",
    "name": "🃏 Custode del Jolly",
    "color": "#9333ea",
    "description": "Usa 50 Jolly in partite di Scala 40",
    "category": "scala40",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 50,
    "feat": "scala_rank_17"
  },
  {
    "id": "scala18",
    "name": "🐉 Drago delle Sequenze",
    "color": "#7e22ce",
    "description": "Vinci 500 partite di Scala 40",
    "category": "scala40",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 500,
    "feat": "scala_rank_18"
  },
  {
    "id": "scala19",
    "name": "🧠 Mente Superiore",
    "color": "#6b21a8",
    "description": "Vinci 700 partite di Scala 40",
    "category": "scala40",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 700,
    "feat": "scala_rank_19"
  },
  {
    "id": "scala20",
    "name": "🎯 Infallibile",
    "color": "#e9d5ff",
    "description": "Vinci 1000 partite di Scala 40",
    "category": "scala40",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 1000,
    "feat": "scala_rank_20"
  },
  {
    "id": "scala21",
    "name": "🎓 Gran Maestro di Scala",
    "color": "#d8b4fe",
    "description": "Vinci 1500 partite di Scala 40",
    "category": "scala40",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 1500,
    "feat": "scala_rank_21"
  },
  {
    "id": "scala22",
    "name": "💀 Terrore del Mazzo",
    "color": "#f0abfc",
    "description": "Vinci 2000 partite di Scala 40",
    "category": "scala40",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 2000,
    "feat": "scala_rank_22"
  },
  {
    "id": "scala23",
    "name": "🌄 Zenith delle Carte",
    "color": "#FFD700",
    "description": "Vinci 2500 partite di Scala 40",
    "category": "scala40",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 2500,
    "feat": "scala_rank_23"
  },
  {
    "id": "scala24",
    "name": "♾️ Infinito Quadrato",
    "color": "#ffffff",
    "description": "Vinci 3000 partite di Scala 40",
    "category": "scala40",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 3000,
    "feat": "scala_rank_24"
  },
  {
    "id": "scala25",
    "name": "👑 IMPERATORE DI SCALA",
    "color": "#c084fc",
    "description": "Raggiungi il massimo di Scala 40 — 3000 vittorie",
    "category": "scala40",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 40,
    "feat": "scala_rank_25"
  },
  {
    "id": "sct1",
    "name": "🏆 Campione Scala 32",
    "color": "#c084fc",
    "description": "Vinci il Torneo 32 Scala 40",
    "category": "scala40",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 32,
    "feat": "scala_tourney_champ"
  },
  {
    "id": "sct2",
    "name": "👑 Gran Maestro Scala",
    "color": "#a855f7",
    "description": "Vinci 3 tornei Scala 40",
    "category": "scala40",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 3,
    "feat": "scala_tourney_3x"
  },
  {
    "id": "ruba6",
    "name": "🖐️ Mano Lesta",
    "color": "#22D3EE",
    "description": "Vinci 5 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 5,
    "feat": "ruba_rank_6"
  },
  {
    "id": "ruba7",
    "name": "🃏 Ladro di Mazzi Pro",
    "color": "#06b6d4",
    "description": "Vinci 15 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 15,
    "feat": "ruba_rank_7"
  },
  {
    "id": "ruba8",
    "name": "💎 Rapina Perfetta",
    "color": "#0891b2",
    "description": "Ruba 50 mazzetti totali",
    "category": "ruba",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 50,
    "feat": "ruba_rank_8"
  },
  {
    "id": "ruba9",
    "name": "🌙 Predatore Notturno",
    "color": "#164e63",
    "description": "Vinci 30 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 30,
    "feat": "ruba_rank_9"
  },
  {
    "id": "ruba10",
    "name": "📦 Accumulatore Seriale",
    "color": "#67e8f9",
    "description": "Vinci 50 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 50,
    "feat": "ruba_rank_10"
  },
  {
    "id": "ruba11",
    "name": "💀 Terrore dei Punti",
    "color": "#22D3EE",
    "description": "Vinci 80 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 80,
    "feat": "ruba_rank_11"
  },
  {
    "id": "ruba12",
    "name": "👑 Re del Furto",
    "color": "#0e7490",
    "description": "Ruba 200 mazzetti totali",
    "category": "ruba",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 200,
    "feat": "ruba_rank_12"
  },
  {
    "id": "ruba13",
    "name": "👤 Ombra Invisibile",
    "color": "#155e75",
    "description": "Vinci 120 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 120,
    "feat": "ruba_rank_13"
  },
  {
    "id": "ruba14",
    "name": "💰 Colpo Grosso",
    "color": "#cffafe",
    "description": "Vinci 180 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 180,
    "feat": "ruba_rank_14"
  },
  {
    "id": "ruba15",
    "name": "🦅 Sguardo d'Aquila",
    "color": "#a5f3fc",
    "description": "Vinci 250 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 250,
    "feat": "ruba_rank_15"
  },
  {
    "id": "ruba16",
    "name": "🦅 Rapace del Tavolo",
    "color": "#7dd3fc",
    "description": "Ruba 500 mazzetti totali",
    "category": "ruba",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 500,
    "feat": "ruba_rank_16"
  },
  {
    "id": "ruba17",
    "name": "🏴‍☠️ Bandito delle Carte",
    "color": "#38bdf8",
    "description": "Vinci 350 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 350,
    "feat": "ruba_rank_17"
  },
  {
    "id": "ruba18",
    "name": "💼 Maestro del Bottino",
    "color": "#0ea5e9",
    "description": "Vinci 500 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 500,
    "feat": "ruba_rank_18"
  },
  {
    "id": "ruba19",
    "name": "🌬️ Inafferrabile",
    "color": "#0369a1",
    "description": "Vinci 700 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 700,
    "feat": "ruba_rank_19"
  },
  {
    "id": "ruba20",
    "name": "👹 Tiranno del Mazzo",
    "color": "#075985",
    "description": "Ruba 1000 mazzetti totali",
    "category": "ruba",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 1000,
    "feat": "ruba_rank_20"
  },
  {
    "id": "ruba21",
    "name": "🎩 Erede di Lupin",
    "color": "#e0f2fe",
    "description": "Vinci 1000 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 1000,
    "feat": "ruba_rank_21"
  },
  {
    "id": "ruba22",
    "name": "🌟 Dominatore dei Punti",
    "color": "#bae6fd",
    "description": "Vinci 1500 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 1500,
    "feat": "ruba_rank_22"
  },
  {
    "id": "ruba23",
    "name": "⚡ Leggenda del Furto",
    "color": "#7dd3fc",
    "description": "Ruba 2000 mazzetti totali",
    "category": "ruba",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 2000,
    "feat": "ruba_rank_23"
  },
  {
    "id": "ruba24",
    "name": "👻 Fantasma del Mazzo",
    "color": "#ffffff",
    "description": "Vinci 2000 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 2000,
    "feat": "ruba_rank_24"
  },
  {
    "id": "ruba25",
    "name": "👑 RE DEI LADRI",
    "color": "#22D3EE",
    "description": "Il dominio assoluto del Ruba Mazzetto — 2000 vittorie",
    "category": "ruba",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 2000,
    "feat": "ruba_rank_25"
  },
  {
    "id": "rm1",
    "name": "🃏 Ladro di Mazzi",
    "color": "#22D3EE",
    "description": "Vinci 1 partita di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "ruba_win1"
  },
  {
    "id": "rm2",
    "name": "🃏 Re del Furto",
    "color": "#22D3EE",
    "description": "Vinci 10 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 10,
    "feat": "ruba_win10"
  },
  {
    "id": "rm3",
    "name": "🃏 Maestro Ruba",
    "color": "#00b4d8",
    "description": "Vinci 50 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 50,
    "feat": "ruba_win50"
  },
  {
    "id": "rmt1",
    "name": "🏆 Campione Ruba 32",
    "color": "#FFD700",
    "description": "Vinci il Torneo 32 Ruba Mazzetto",
    "category": "ruba",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 32,
    "feat": "ruba_tourney_champ"
  },
  {
    "id": "rmt2",
    "name": "🥇 Dominatore Furto",
    "color": "#FFD700",
    "description": "Vinci 3 tornei Ruba Mazzetto",
    "category": "ruba",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 3,
    "feat": "ruba_tourney_3x"
  },
  {
    "id": "bj7",
    "name": "💸 Scommettitore Audace",
    "color": "#34D399",
    "description": "Vinci 10 partite di Blackjack",
    "category": "blackjack",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 10,
    "feat": "bj_rank_7"
  },
  {
    "id": "bj8",
    "name": "🎯 Occhio al 21",
    "color": "#10b981",
    "description": "Raggiungi 21 esatto 10 volte",
    "category": "blackjack",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 21,
    "feat": "bj_rank_8"
  },
  {
    "id": "bj9",
    "name": "🧊 Freddezza del Dealer",
    "color": "#059669",
    "description": "Vinci 30 partite di Blackjack",
    "category": "blackjack",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 30,
    "feat": "bj_rank_9"
  },
  {
    "id": "bj10",
    "name": "🔱 Raddoppio d'Oro",
    "color": "#047857",
    "description": "Usa il raddoppio 20 volte con successo",
    "category": "blackjack",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 20,
    "feat": "bj_rank_10"
  },
  {
    "id": "bj11",
    "name": "📊 Strategia di Base",
    "color": "#065f46",
    "description": "Vinci 50 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 50,
    "feat": "bj_rank_11"
  },
  {
    "id": "bj12",
    "name": "🏰 Assedio al Banco",
    "color": "#6ee7b7",
    "description": "Batti il banco 30 volte di fila",
    "category": "blackjack",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 30,
    "feat": "bj_rank_12"
  },
  {
    "id": "bj13",
    "name": "🔮 Intuizione Vincente",
    "color": "#a7f3d0",
    "description": "Vinci 80 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 80,
    "feat": "bj_rank_13"
  },
  {
    "id": "bj14",
    "name": "🎰 Mente da Casinò",
    "color": "#d1fae5",
    "description": "Vinci 120 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 120,
    "feat": "bj_rank_14"
  },
  {
    "id": "bj15",
    "name": "🦈 Squalo del Blackjack",
    "color": "#34D399",
    "description": "Vinci 200 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 200,
    "feat": "bj_rank_15"
  },
  {
    "id": "bj16",
    "name": "💎 High Roller",
    "color": "#10b981",
    "description": "Vinci 300 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 300,
    "feat": "bj_rank_16"
  },
  {
    "id": "bj17",
    "name": "🃏 Asso nella Manica",
    "color": "#059669",
    "description": "Fai 20 Blackjack naturali",
    "category": "blackjack",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 20,
    "feat": "bj_rank_17"
  },
  {
    "id": "bj18",
    "name": "🎩 Colpo da Maestro",
    "color": "#047857",
    "description": "Vinci 500 partite di Blackjack",
    "category": "blackjack",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 500,
    "feat": "bj_rank_18"
  },
  {
    "id": "bj19",
    "name": "📐 Architetto del 21",
    "color": "#065f46",
    "description": "Vinci 700 partite di Blackjack",
    "category": "blackjack",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 700,
    "feat": "bj_rank_19"
  },
  {
    "id": "bj20",
    "name": "💥 Distruttore del Banco",
    "color": "#6ee7b7",
    "description": "Vinci 1000 partite di Blackjack",
    "category": "blackjack",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 1000,
    "feat": "bj_rank_20"
  },
  {
    "id": "bj21",
    "name": "🎰 Leggenda di Vegas",
    "color": "#a7f3d0",
    "description": "Vinci 1500 partite di Blackjack",
    "category": "blackjack",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 1500,
    "feat": "bj_rank_21"
  },
  {
    "id": "bj22",
    "name": "♠️ Re delle Chip",
    "color": "#FFD700",
    "description": "Vinci 2000 partite di Blackjack",
    "category": "blackjack",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 2000,
    "feat": "bj_rank_22"
  },
  {
    "id": "bj23",
    "name": "⚡ Sfidante Supremo",
    "color": "#f43f5e",
    "description": "Fai 50 Blackjack naturali",
    "category": "blackjack",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 50,
    "feat": "bj_rank_23"
  },
  {
    "id": "bj24",
    "name": "🃏 Anima d'Azzardo",
    "color": "#ffffff",
    "description": "Vinci 2500 partite di Blackjack",
    "category": "blackjack",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 2500,
    "feat": "bj_rank_24"
  },
  {
    "id": "bj25",
    "name": "👑 DIO DEL 21",
    "color": "#34D399",
    "description": "Il vertice assoluto del Blackjack — 2500 vittorie + 50 naturali",
    "category": "blackjack",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 2500,
    "feat": "bj_rank_25"
  },
  {
    "id": "bj1",
    "name": "🂡 Principiante BJ",
    "color": "#34D399",
    "description": "Vinci 1 partita di Black Jack",
    "category": "blackjack",
    "rarity": "legendary",
    "prestigeTier": 4,
    "feat": "bj_win1"
  },
  {
    "id": "bj2",
    "name": "🂡 Mano Fortunata",
    "color": "#34D399",
    "description": "Vinci 10 partite di Black Jack",
    "category": "blackjack",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 10,
    "feat": "bj_win10"
  },
  {
    "id": "bj3",
    "name": "🂡 Contatore di Carte",
    "color": "#10b981",
    "description": "Vinci 50 partite di Black Jack",
    "category": "blackjack",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 50,
    "feat": "bj_win50"
  },
  {
    "id": "bj4",
    "name": "🂡 Il Baro",
    "color": "#6ee7b7",
    "description": "Fai 5 Blackjack naturali",
    "category": "blackjack",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 5,
    "feat": "bj_blackjack5"
  },
  {
    "id": "bj5",
    "name": "🂡 Sfida al Banco",
    "color": "#00E5FF",
    "description": "Batti il banco con 21 esatti",
    "category": "blackjack",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 21,
    "feat": "bj_beat_dealer"
  },
  {
    "id": "bjt1",
    "name": "🏆 Campione BJ 32",
    "color": "#FFD700",
    "description": "Vinci il Torneo 32 Black Jack",
    "category": "blackjack",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 32,
    "feat": "bj_tourney_champ"
  },
  {
    "id": "club_member",
    "name": "👥 Membro del Club",
    "color": "#a855f7",
    "description": "Entra in un Club",
    "category": "club",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "club_joined"
  },
  {
    "id": "club_grind5",
    "name": "⚔️ Club Warrior",
    "color": "#c084fc",
    "description": "5 vittorie per il Club",
    "category": "club",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 5,
    "feat": "club_wins5"
  },
  {
    "id": "club_grind25",
    "name": "🏅 Club Champion",
    "color": "#d8b4fe",
    "description": "25 vittorie per il Club",
    "category": "club",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 25,
    "feat": "club_wins25"
  },
  {
    "id": "club_legend",
    "name": "🌟 Club Legend",
    "color": "#f0abfc",
    "description": "100 vittorie per il Club",
    "category": "club",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 100,
    "feat": "club_wins100"
  },
  {
    "id": "club_mission1",
    "name": "📋 Missione Compiuta",
    "color": "#a855f7",
    "description": "Completa 1 missione Club",
    "category": "club",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "club_mission1"
  },
  {
    "id": "club_mission10",
    "name": "🎖️ Cacciatore di Missioni",
    "color": "#c084fc",
    "description": "Completa 10 missioni Club",
    "category": "club",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 10,
    "feat": "club_mission10"
  },
  {
    "id": "club_boost",
    "name": "⚡ Potenziato dal Club",
    "color": "#e879f9",
    "description": "Usa un boost MMR Club",
    "category": "club",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "club_boost_used"
  },
  {
    "id": "club_founder",
    "name": "👑 Fondatore",
    "color": "#fbbf24",
    "description": "Fondi il tuo primo Club",
    "category": "club",
    "rarity": "rare",
    "prestigeTier": 2,
    "feat": "club_founder"
  },
  {
    "id": "clubp9",
    "name": "💎 Membro d'Élite",
    "color": "#a855f7",
    "description": "Vinci 200 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 200,
    "feat": "club_rank_9"
  },
  {
    "id": "clubp10",
    "name": "🤝 Socio d'Onore",
    "color": "#9333ea",
    "description": "Vinci 300 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 300,
    "feat": "club_rank_10"
  },
  {
    "id": "clubp11",
    "name": "💰 Investitore di Prestigio",
    "color": "#7e22ce",
    "description": "Vinci 450 partite per il tuo Club",
    "category": "club",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 450,
    "feat": "club_rank_11"
  },
  {
    "id": "clubp12",
    "name": "🏛️ Pilastro del Club",
    "color": "#6b21a8",
    "description": "Vinci 600 partite per il tuo Club",
    "category": "club",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 600,
    "feat": "club_rank_12"
  },
  {
    "id": "clubp13",
    "name": "💎 VIP Platinum",
    "color": "#d8b4fe",
    "description": "Vinci 800 partite per il tuo Club",
    "category": "club",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 800,
    "feat": "club_rank_13"
  },
  {
    "id": "clubp14",
    "name": "💎 Magnate delle Gemme",
    "color": "#c084fc",
    "description": "Vinci 1000 partite per il tuo Club",
    "category": "club",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 1000,
    "feat": "club_rank_14"
  },
  {
    "id": "clubp15",
    "name": "🔮 Visionario del Club",
    "color": "#a855f7",
    "description": "Vinci 1300 partite per il tuo Club",
    "category": "club",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 1300,
    "feat": "club_rank_15"
  },
  {
    "id": "clubp16",
    "name": "🗝️ Custode del Segreto",
    "color": "#9333ea",
    "description": "Completa 50 missioni Club",
    "category": "club",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 50,
    "feat": "club_rank_16"
  },
  {
    "id": "clubp17",
    "name": "🌟 Ambasciatore d'Oro",
    "color": "#fbbf24",
    "description": "Vinci 1600 partite per il tuo Club",
    "category": "club",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 1600,
    "feat": "club_rank_17"
  },
  {
    "id": "clubp18",
    "name": "🏗️ Architetto dell'Ordine",
    "color": "#f59e0b",
    "description": "Vinci 2000 partite per il tuo Club",
    "category": "club",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 2000,
    "feat": "club_rank_18"
  },
  {
    "id": "clubp19",
    "name": "✨ Eletto del Club",
    "color": "#fde68a",
    "description": "Completa 100 missioni Club",
    "category": "club",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 100,
    "feat": "club_rank_19"
  },
  {
    "id": "clubp20",
    "name": "🎭 Patrono delle Arti",
    "color": "#fef3c7",
    "description": "Vinci 2500 partite per il tuo Club",
    "category": "club",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 2500,
    "feat": "club_rank_20"
  },
  {
    "id": "clubp21",
    "name": "🌫️ Eminenza Grigia",
    "color": "#d1d5db",
    "description": "Vinci 3000 partite per il tuo Club",
    "category": "club",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 3000,
    "feat": "club_rank_21"
  },
  {
    "id": "clubp22",
    "name": "👑 Sovrano del Circolo",
    "color": "#FFD700",
    "description": "Vinci 4000 partite per il tuo Club",
    "category": "club",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 4000,
    "feat": "club_rank_22"
  },
  {
    "id": "clubp23",
    "name": "🏋️ Titano del Prestigio",
    "color": "#c084fc",
    "description": "Completa 200 missioni Club",
    "category": "club",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 200,
    "feat": "club_rank_23"
  },
  {
    "id": "clubp24",
    "name": "📜 Leggenda del Club",
    "color": "#e9d5ff",
    "description": "Vinci 5000 partite per il tuo Club",
    "category": "club",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 5000,
    "feat": "club_rank_24"
  },
  {
    "id": "clubp25",
    "name": "🏰 FONDATORE ETERNO",
    "color": "#ffffff",
    "description": "Il massimo onore del Club — 5000 vittorie + 200 missioni",
    "category": "club",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 5000,
    "feat": "club_rank_25"
  },
  {
    "id": "multi2",
    "name": "🧳 Primo Viaggiatore",
    "color": "#F5C842",
    "description": "Vinci in 2 modalità diverse",
    "category": "multi",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 2,
    "feat": "multi_rank_2"
  },
  {
    "id": "multi3",
    "name": "🗺️ Esploratore di Modalità",
    "color": "#fbbf24",
    "description": "Vinci in 3 modalità diverse",
    "category": "multi",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 3,
    "feat": "multi_rank_3"
  },
  {
    "id": "multi4",
    "name": "🦎 Adattabile",
    "color": "#f59e0b",
    "description": "Vinci in 4 modalità diverse",
    "category": "multi",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 4,
    "feat": "multi_rank_4"
  },
  {
    "id": "multi5",
    "name": "🦎 Camaleonte del Gioco",
    "color": "#d97706",
    "description": "Vinci in tutte le 5+ modalità",
    "category": "multi",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 5,
    "feat": "multi_rank_5"
  },
  {
    "id": "multi6",
    "name": "🔧 Versatile",
    "color": "#b45309",
    "description": "Vinci 10 partite in ogni modalità",
    "category": "multi",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 10,
    "feat": "multi_rank_6"
  },
  {
    "id": "multi7",
    "name": "🌪️ Maestro del Caos",
    "color": "#92400e",
    "description": "Vinci 25 partite in ogni modalità",
    "category": "multi",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 25,
    "feat": "multi_rank_7"
  },
  {
    "id": "multi8",
    "name": "🧿 Onnisciente",
    "color": "#fef3c7",
    "description": "Vinci 50 partite in ogni modalità",
    "category": "multi",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 50,
    "feat": "multi_rank_8"
  },
  {
    "id": "multi9",
    "name": "💎 Poliedrico",
    "color": "#fde68a",
    "description": "Vinci 100 partite in ogni modalità",
    "category": "multi",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 100,
    "feat": "multi_rank_9"
  },
  {
    "id": "multi10",
    "name": "🚶 Viandante dei Mazzi",
    "color": "#fcd34d",
    "description": "Vinci 150 partite in ogni modalità",
    "category": "multi",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 150,
    "feat": "multi_rank_10"
  },
  {
    "id": "multi11",
    "name": "🔬 Sperimentatore",
    "color": "#fbbf24",
    "description": "Vinci 250 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 250,
    "feat": "multi_rank_11"
  },
  {
    "id": "multi12",
    "name": "♾️ Signore delle Varianti",
    "color": "#f59e0b",
    "description": "Vinci 400 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 400,
    "feat": "multi_rank_12"
  },
  {
    "id": "multi13",
    "name": "🧬 Genio Multitasking",
    "color": "#d97706",
    "description": "Vinci 600 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 600,
    "feat": "multi_rank_13"
  },
  {
    "id": "multi14",
    "name": "🌊 Dominatore del Flusso",
    "color": "#b45309",
    "description": "Vinci 900 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 900,
    "feat": "multi_rank_14"
  },
  {
    "id": "multi15",
    "name": "🌍 Conquistatore Globale",
    "color": "#92400e",
    "description": "Vinci 1200 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 1200,
    "feat": "multi_rank_15"
  },
  {
    "id": "multi16",
    "name": "🧠 Mente Universale",
    "color": "#fef3c7",
    "description": "Vinci 1500 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 1500,
    "feat": "multi_rank_16"
  },
  {
    "id": "multi17",
    "name": "💥 Distruttore di Regole",
    "color": "#fde68a",
    "description": "Vinci 2000 partite in ogni modalità",
    "category": "multi",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 2000,
    "feat": "multi_rank_17"
  },
  {
    "id": "multi18",
    "name": "🌌 Viaggiatore Dimensionale",
    "color": "#fcd34d",
    "description": "Vinci 2500 partite in ogni modalità",
    "category": "multi",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 2500,
    "feat": "multi_rank_18"
  },
  {
    "id": "multi19",
    "name": "🏗️ Architetto del Multiverso",
    "color": "#F5C842",
    "description": "Vinci 3000 partite in ogni modalità",
    "category": "multi",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 3000,
    "feat": "multi_rank_19"
  },
  {
    "id": "multi20",
    "name": "🎓 Maestro di Ogni Cosa",
    "color": "#f59e0b",
    "description": "Vinci 4000 partite in ogni modalità",
    "category": "multi",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 4000,
    "feat": "multi_rank_20"
  },
  {
    "id": "multi21",
    "name": "⚡ Leggenda Ibrida",
    "color": "#fbbf24",
    "description": "Vinci 5000 partite in ogni modalità",
    "category": "multi",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 5000,
    "feat": "multi_rank_21"
  },
  {
    "id": "multi22",
    "name": "🎭 Avatar del Gioco",
    "color": "#FFD700",
    "description": "Vinci 7000 partite in ogni modalità",
    "category": "multi",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 7000,
    "feat": "multi_rank_22"
  },
  {
    "id": "multi23",
    "name": "🌐 Onnipresente",
    "color": "#c084fc",
    "description": "Vinci 10000 partite in ogni modalità",
    "category": "multi",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 10000,
    "feat": "multi_rank_23"
  },
  {
    "id": "multi24",
    "name": "📚 Colui che Tutto Sa",
    "color": "#e9d5ff",
    "description": "Vinci 15000 partite in ogni modalità",
    "category": "multi",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 15000,
    "feat": "multi_rank_24"
  },
  {
    "id": "multi25",
    "name": "🌌 MAESTRO DEL MULTIVERSO",
    "color": "#ffffff",
    "description": "La leggenda assoluta di tutte le modalità — 15000 vittorie ovunque",
    "category": "multi",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 15000,
    "feat": "multi_rank_25"
  },
  {
    "id": "ucs1",
    "name": "👑 ELITE UCS",
    "color": "#e8e8e8",
    "description": "Primo trionfo UCS",
    "category": "ucs",
    "rarity": "mythic",
    "prestigeTier": 5,
    "feat": "ucs_win1",
    "anim": "title-animated-elite"
  },
  {
    "id": "ucs2",
    "name": "🌌 OLTRE L'ULTRA",
    "color": "#00E5FF",
    "description": "5 vittorie UCS",
    "category": "ucs",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 5,
    "feat": "ucs_win5",
    "anim": "title-animated-oltre"
  },
  {
    "id": "ucs3",
    "name": "💎 ETERNO",
    "color": "#7EE4F8",
    "description": "UCS senza perdere un round",
    "category": "ucs",
    "rarity": "mythic",
    "prestigeTier": 5,
    "feat": "ucs_flawless",
    "anim": "title-animated-eterno"
  },
  {
    "id": "ucs4",
    "name": "💠 ARCHITETTO DEL CAOS",
    "color": "#c084fc",
    "description": "10+ carte +4 in un UCS",
    "category": "ucs",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 10,
    "feat": "ucs_ten_w4",
    "anim": "title-animated-anomaly"
  },
  {
    "id": "rlcs1",
    "name": "🌱 Open Qualifier",
    "color": "#9ca3af",
    "description": "Completa il tuo primo Open Qualifier UCS",
    "category": "ucs",
    "rarity": "common",
    "prestigeTier": 1,
    "feat": "ucs_rank_1"
  },
  {
    "id": "rlcs2",
    "name": "🔢 Top 128 Seed",
    "color": "#a3b4c4",
    "description": "Vinci 3 partite UCS",
    "category": "ucs",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 3,
    "feat": "ucs_rank_2"
  },
  {
    "id": "rlcs3",
    "name": "🎯 Top 64 Contender",
    "color": "#b0c4d8",
    "description": "Vinci 7 partite UCS",
    "category": "ucs",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 7,
    "feat": "ucs_rank_3"
  },
  {
    "id": "rlcs4",
    "name": "⚡ Closed Qualifier Finalist",
    "color": "#7dd3fc",
    "description": "Vinci 12 partite UCS",
    "category": "ucs",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 12,
    "feat": "ucs_rank_4"
  },
  {
    "id": "rlcs5",
    "name": "🏟️ Main Event Rookie",
    "color": "#38bdf8",
    "description": "Vinci 20 partite UCS",
    "category": "ucs",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 20,
    "feat": "ucs_rank_5"
  },
  {
    "id": "rlcs6",
    "name": "🔴 Regional Round 1",
    "color": "#f97316",
    "description": "Vinci 30 partite UCS",
    "category": "ucs",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 30,
    "feat": "ucs_rank_6"
  },
  {
    "id": "rlcs7",
    "name": "⚔️ Regional Quarter-finalist",
    "color": "#fb923c",
    "description": "Vinci 45 partite UCS",
    "category": "ucs",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 45,
    "feat": "ucs_rank_7"
  },
  {
    "id": "rlcs8",
    "name": "🥊 Regional Semi-finalist",
    "color": "#fdba74",
    "description": "Vinci 65 partite UCS",
    "category": "ucs",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 65,
    "feat": "ucs_rank_8"
  },
  {
    "id": "rlcs9",
    "name": "🏅 Regional Finalist",
    "color": "#fcd34d",
    "description": "Vinci 90 partite UCS",
    "category": "ucs",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 90,
    "feat": "ucs_rank_9"
  },
  {
    "id": "rlcs10",
    "name": "🏆 Regional Champion",
    "color": "#f59e0b",
    "description": "Vinci 120 partite UCS",
    "category": "ucs",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 120,
    "feat": "ucs_rank_10"
  },
  {
    "id": "rlcs11",
    "name": "🎟️ Major Qualified",
    "color": "#a78bfa",
    "description": "Vinci 160 partite UCS",
    "category": "ucs",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 160,
    "feat": "ucs_rank_11"
  },
  {
    "id": "rlcs12",
    "name": "🏛️ Major Group Stage",
    "color": "#8b5cf6",
    "description": "Vinci 200 partite UCS",
    "category": "ucs",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 200,
    "feat": "ucs_rank_12"
  },
  {
    "id": "rlcs13",
    "name": "⚡ Major Playoffs",
    "color": "#7c3aed",
    "description": "Vinci 250 partite UCS",
    "category": "ucs",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 250,
    "feat": "ucs_rank_13"
  },
  {
    "id": "rlcs14",
    "name": "🥈 Major Finalist",
    "color": "#c084fc",
    "description": "Vinci 310 partite UCS",
    "category": "ucs",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 310,
    "feat": "ucs_rank_14"
  },
  {
    "id": "rlcs15",
    "name": "🥇 Major Champion",
    "color": "#e879f9",
    "description": "Vinci 380 partite UCS",
    "category": "ucs",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 380,
    "feat": "ucs_rank_15"
  },
  {
    "id": "rlcs16",
    "name": "🌍 World Championship Wildcard",
    "color": "#f43f5e",
    "description": "Vinci 460 partite UCS",
    "category": "ucs",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 460,
    "feat": "ucs_rank_16"
  },
  {
    "id": "rlcs17",
    "name": "💫 Worlds Group Stage Elite",
    "color": "#fb7185",
    "description": "Vinci 550 partite UCS",
    "category": "ucs",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 550,
    "feat": "ucs_rank_17"
  },
  {
    "id": "rlcs18",
    "name": "🏹 Worlds Quarter-finalist",
    "color": "#ff4081",
    "description": "Vinci 650 partite UCS + 10 vittorie flawless UCS",
    "category": "ucs",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 650,
    "feat": "ucs_rank_18"
  },
  {
    "id": "rlcs19",
    "name": "🔥 Worlds Semi-finalist",
    "color": "#00E5FF",
    "description": "Vinci 780 partite UCS + 3 vittorie consecutive senza perdere round",
    "category": "ucs",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 780,
    "feat": "ucs_rank_19"
  },
  {
    "id": "rlcs20",
    "name": "🌠 Worlds Grand Finalist",
    "color": "#ffffff",
    "description": "Vinci 950 partite UCS + 25 vittorie flawless UCS",
    "category": "ucs",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 950,
    "feat": "ucs_rank_20"
  },
  {
    "id": "rlcs21",
    "name": "👑 World Champion",
    "color": "#FFD700",
    "description": "Vinci 1100 partite UCS + 50 vittorie flawless UCS",
    "category": "ucs",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 1100,
    "feat": "ucs_rank_21"
  },
  {
    "id": "rlcs22",
    "name": "🌟 Season MVP",
    "color": "#F5C842",
    "description": "Raggiungi 1100 vittorie UCS e 50 +4 in partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 1100,
    "feat": "ucs_rank_22"
  },
  {
    "id": "rlcs23",
    "name": "🐐 GOAT Contender",
    "color": "#c084fc",
    "description": "Completa tutti i titoli UCS precedenti",
    "category": "ucs",
    "rarity": "mythic",
    "prestigeTier": 5,
    "feat": "ucs_rank_23"
  },
  {
    "id": "rlcs24",
    "name": "🏛️ Hall of Fame",
    "color": "#e8e8e8",
    "description": "Completa tutti i titoli UCS precedenti",
    "category": "ucs",
    "rarity": "mythic",
    "prestigeTier": 5,
    "feat": "ucs_rank_24"
  },
  {
    "id": "rlcs25",
    "name": "👑 WORLD CHAMPION SUPREME",
    "color": "#FFD700",
    "description": "Raggiungi la vetta assoluta di UCS — tutti i titoli UCS sbloccati",
    "category": "ucs",
    "rarity": "mythic",
    "prestigeTier": 5,
    "feat": "ucs_rank_25"
  },
  {
    "id": "tx3",
    "name": "🏆 Campione del Torneo",
    "color": "#FFD700",
    "description": "Vinci il torneo da 32",
    "category": "ucs",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 32,
    "feat": "tourney_champ32"
  },
  {
    "id": "s2_leg_1",
    "name": "S2 – Bronzo",
    "color": "#9E9E9E",
    "description": "Hai raggiunto Bronzo nella Stagione 2 · Non più ottenibile",
    "category": "season2",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 2,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_2",
    "name": "S2 – Argento",
    "color": "#CBD5E1",
    "description": "Hai raggiunto Argento nella Stagione 2 · Non più ottenibile",
    "category": "season2",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 2,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_3",
    "name": "S2 – Oro",
    "color": "#FFD500",
    "description": "Hai raggiunto Oro nella Stagione 2 · Non più ottenibile",
    "category": "season2",
    "rarity": "common",
    "prestigeTier": 1,
    "missionTarget": 2,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_4",
    "name": "S2 – Platino",
    "color": "#38BDF8",
    "description": "Hai raggiunto Platino nella Stagione 2 · Non più ottenibile",
    "category": "season2",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 2,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_5",
    "name": "S2 – Diamante",
    "color": "#A855F7",
    "description": "Hai raggiunto Diamante nella Stagione 2 · Non più ottenibile",
    "category": "season2",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 2,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_6",
    "name": "S2 – Campione",
    "color": "#EC4899",
    "description": "Hai raggiunto Campione nella Stagione 2 · Non più ottenibile",
    "category": "season2",
    "rarity": "rare",
    "prestigeTier": 2,
    "missionTarget": 2,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_7",
    "name": "S2 – Grande Campione",
    "color": "#F43F5E",
    "description": "Hai raggiunto Grande Campione nella Stagione 2 · Non più ottenibile",
    "category": "season2",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 2,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_8",
    "name": "S2 – Leggenda Supersonica",
    "color": "#FFFFFF",
    "description": "Hai raggiunto Leggenda Supersonica nella Stagione 2 · Non più ottenibile",
    "category": "season2",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 2,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_9",
    "name": "S2 – Eredità Settebello",
    "color": "#FB923C",
    "description": "Top 3 Scopa nella stagione (S2) · Non più ottenibile",
    "category": "season2",
    "rarity": "epic",
    "prestigeTier": 3,
    "missionTarget": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_10",
    "name": "S2 – Orizzonte Mille",
    "color": "#22D3EE",
    "description": "Top 3 Millemiglia nella stagione (S2) · Non più ottenibile",
    "category": "season2",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_11",
    "name": "S2 – Predatore del Piatto",
    "color": "#34D399",
    "description": "Top 3 Poker nella stagione (S2) · Non più ottenibile",
    "category": "season2",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_12",
    "name": "S2 – Sincronia Eterna",
    "color": "#C084FC",
    "description": "Top 3 Burraco nella stagione (S2) · Non più ottenibile",
    "category": "season2",
    "rarity": "legendary",
    "prestigeTier": 4,
    "missionTarget": 3,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_13",
    "name": "S2 – Fastest Hand",
    "color": "#FBBF24",
    "description": "Vincitore modalità Blitz stagionale (S2) · Non più ottenibile",
    "category": "season2",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 2,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_14",
    "name": "S2 – World Champion",
    "color": "#FFD32A",
    "description": "Campione UCS della stagione (S2) · Non più ottenibile",
    "category": "season2",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 2,
    "legacyUnavailable": true
  },
  {
    "id": "s2_leg_15",
    "name": "S2 – Leggenda Senza Tempo",
    "color": "#FFFFFF",
    "description": "SSL confermato in 2 stagioni consecutive (S2) · Non più ottenibile",
    "category": "season2",
    "rarity": "mythic",
    "prestigeTier": 5,
    "missionTarget": 2,
    "legacyUnavailable": true
  }
] as const;

export const LEGACY_TITLES_BY_ID: Readonly<Record<string, LegacyTitleDefinition>> = Object.fromEntries(
  LEGACY_TITLES.map((t) => [t.id, t]),
);

export interface RealisticBotProfile {
  readonly name: string;
  readonly avatar: string;
  readonly baseMmr: number;
}

export const REALISTIC_BOT_PROFILES: readonly RealisticBotProfile[] = [
  {
    "name": "🗡️ DreadForce",
    "avatar": "🗡️",
    "baseMmr": 2186
  },
  {
    "name": "🤖 PikeKard",
    "avatar": "🤖",
    "baseMmr": 2191
  },
  {
    "name": "🎭 GhostEdge",
    "avatar": "🎭",
    "baseMmr": 2195
  },
  {
    "name": "🌪 PeakMode",
    "avatar": "🌪",
    "baseMmr": 2180
  },
  {
    "name": "🏆 KingJinx",
    "avatar": "🏆",
    "baseMmr": 2173
  },
  {
    "name": "🦊 MistVibe",
    "avatar": "🦊",
    "baseMmr": 2164
  },
  {
    "name": "🎮 JumpGlow",
    "avatar": "🎮",
    "baseMmr": 2158
  },
  {
    "name": "🎱 RainPlex",
    "avatar": "🎱",
    "baseMmr": 2156
  },
  {
    "name": "🐍 DawnZeus",
    "avatar": "🐍",
    "baseMmr": 2149
  },
  {
    "name": "🌋 FireSurge",
    "avatar": "🌋",
    "baseMmr": 2143
  },
  {
    "name": "🏅 SnowDark",
    "avatar": "🏅",
    "baseMmr": 2136
  },
  {
    "name": "🐉 TideGG",
    "avatar": "🐉",
    "baseMmr": 2131
  },
  {
    "name": "🚀 SageInk",
    "avatar": "🚀",
    "baseMmr": 2125
  },
  {
    "name": "🦊 PeakRiot",
    "avatar": "🦊",
    "baseMmr": 2117
  },
  {
    "name": "🦄 QuasarInk",
    "avatar": "🦄",
    "baseMmr": 2112
  },
  {
    "name": "🗡️ EdgeSurge",
    "avatar": "🗡️",
    "baseMmr": 2105
  },
  {
    "name": "🏅 ThornTop",
    "avatar": "🏅",
    "baseMmr": 2099
  },
  {
    "name": "🎴 KuroJet",
    "avatar": "🎴",
    "baseMmr": 2092
  },
  {
    "name": "🦋 IrisUnix",
    "avatar": "🦋",
    "baseMmr": 2088
  },
  {
    "name": "🎮 OnyxRush",
    "avatar": "🎮",
    "baseMmr": 2081
  },
  {
    "name": "🧬 DuskMax",
    "avatar": "🧬",
    "baseMmr": 2075
  },
  {
    "name": "🗡️ QuadUnix",
    "avatar": "🗡️",
    "baseMmr": 2070
  },
  {
    "name": "🌪 OrbXtra",
    "avatar": "🌪",
    "baseMmr": 2065
  },
  {
    "name": "🌺 LynxFlash",
    "avatar": "🌺",
    "baseMmr": 2057
  },
  {
    "name": "🎲 VertexRush",
    "avatar": "🎲",
    "baseMmr": 2053
  },
  {
    "name": "🌙 HuntJinx",
    "avatar": "🌙",
    "baseMmr": 2044
  },
  {
    "name": "☄️ Zen99",
    "avatar": "☄️",
    "baseMmr": 2041
  },
  {
    "name": "💠 JadeQuick",
    "avatar": "💠",
    "baseMmr": 2034
  },
  {
    "name": "🤖 ApexKill",
    "avatar": "🤖",
    "baseMmr": 2028
  },
  {
    "name": "🌪 ZenYang",
    "avatar": "🌪",
    "baseMmr": 2024
  },
  {
    "name": "💎 JadeMVP",
    "avatar": "💎",
    "baseMmr": 2016
  },
  {
    "name": "🦄 KiloNeo",
    "avatar": "🦄",
    "baseMmr": 2008
  },
  {
    "name": "🎴 FluxYolo",
    "avatar": "🎴",
    "baseMmr": 2005
  },
  {
    "name": "🧠 BoltHero",
    "avatar": "🧠",
    "baseMmr": 1999
  },
  {
    "name": "🎪 PeakOmni",
    "avatar": "🎪",
    "baseMmr": 1990
  },
  {
    "name": "👁️ ZetaTop",
    "avatar": "👁️",
    "baseMmr": 1985
  },
  {
    "name": "💠 LakeXtreme",
    "avatar": "💠",
    "baseMmr": 1981
  },
  {
    "name": "🐺 LuxRush",
    "avatar": "🐺",
    "baseMmr": 1975
  },
  {
    "name": "💠 AshMVP",
    "avatar": "💠",
    "baseMmr": 1966
  },
  {
    "name": "🎪 MoonKard",
    "avatar": "🎪",
    "baseMmr": 1961
  },
  {
    "name": "🎲 AshQuick",
    "avatar": "🎲",
    "baseMmr": 1956
  },
  {
    "name": "🦅 VertexMax",
    "avatar": "🦅",
    "baseMmr": 1949
  },
  {
    "name": "🎮 ThornWild",
    "avatar": "🎮",
    "baseMmr": 1944
  },
  {
    "name": "🎲 FireBoss",
    "avatar": "🎲",
    "baseMmr": 1939
  },
  {
    "name": "🎲 LakeZero",
    "avatar": "🎲",
    "baseMmr": 1932
  },
  {
    "name": "🌪 EchoLion",
    "avatar": "🌪",
    "baseMmr": 1927
  },
  {
    "name": "🦄 TideLore",
    "avatar": "🦄",
    "baseMmr": 1918
  },
  {
    "name": "🐉 YukiInk",
    "avatar": "🐉",
    "baseMmr": 1916
  },
  {
    "name": "👁️ RexVibe",
    "avatar": "👁️",
    "baseMmr": 1906
  },
  {
    "name": "⚡ NullUltra",
    "avatar": "⚡",
    "baseMmr": 1901
  },
  {
    "name": "💠 LakeMVP",
    "avatar": "💠",
    "baseMmr": 1898
  },
  {
    "name": "🌺 OpalVolt",
    "avatar": "🌺",
    "baseMmr": 1890
  },
  {
    "name": "🎲 UltraYang",
    "avatar": "🎲",
    "baseMmr": 1883
  },
  {
    "name": "🎲 NightVibe",
    "avatar": "🎲",
    "baseMmr": 1876
  },
  {
    "name": "🗡️ FireOmega",
    "avatar": "🗡️",
    "baseMmr": 1872
  },
  {
    "name": "🏆 HazeFlash",
    "avatar": "🏆",
    "baseMmr": 1866
  },
  {
    "name": "🐉 NullEdge",
    "avatar": "🐉",
    "baseMmr": 1861
  },
  {
    "name": "🗡️ UltraJinx",
    "avatar": "🗡️",
    "baseMmr": 1852
  },
  {
    "name": "💠 ZetaNuke",
    "avatar": "💠",
    "baseMmr": 1846
  },
  {
    "name": "🎲 ArcGlow",
    "avatar": "🎲",
    "baseMmr": 1844
  },
  {
    "name": "🐍 ZetaZero",
    "avatar": "🐍",
    "baseMmr": 1835
  },
  {
    "name": "🦁 UltraYang",
    "avatar": "🦁",
    "baseMmr": 1829
  },
  {
    "name": "🦁 LuxWild",
    "avatar": "🦁",
    "baseMmr": 1825
  },
  {
    "name": "🎴 AshJet",
    "avatar": "🎴",
    "baseMmr": 1819
  },
  {
    "name": "🎲 DawnOmega",
    "avatar": "🎲",
    "baseMmr": 1813
  },
  {
    "name": "🦁 KiloGod",
    "avatar": "🦁",
    "baseMmr": 1808
  },
  {
    "name": "🌺 OrbEdge",
    "avatar": "🌺",
    "baseMmr": 1802
  },
  {
    "name": "🦅 IronPlus",
    "avatar": "🦅",
    "baseMmr": 1796
  },
  {
    "name": "🌙 KingZeus",
    "avatar": "🌙",
    "baseMmr": 1790
  },
  {
    "name": "🏆 OnyxRiot",
    "avatar": "🏆",
    "baseMmr": 1783
  },
  {
    "name": "🏅 FireJinx",
    "avatar": "🏅",
    "baseMmr": 1774
  },
  {
    "name": "🎲 Ghost99",
    "avatar": "🎲",
    "baseMmr": 1769
  },
  {
    "name": "🦈 GhostPlus",
    "avatar": "🦈",
    "baseMmr": 1762
  },
  {
    "name": "🌪 OrbUnix",
    "avatar": "🌪",
    "baseMmr": 1756
  },
  {
    "name": "🧨 ArcBoss",
    "avatar": "🧨",
    "baseMmr": 1751
  },
  {
    "name": "🐍 BayNuke",
    "avatar": "🐍",
    "baseMmr": 1745
  },
  {
    "name": "☄️ UltraZero",
    "avatar": "☄️",
    "baseMmr": 1739
  },
  {
    "name": "🧬 YukiMark",
    "avatar": "🧬",
    "baseMmr": 1732
  },
  {
    "name": "🎯 UltraOmega",
    "avatar": "🎯",
    "baseMmr": 1727
  },
  {
    "name": "☄️ KiloVibe",
    "avatar": "☄️",
    "baseMmr": 1720
  },
  {
    "name": "🎆 PeakZero",
    "avatar": "🎆",
    "baseMmr": 1717
  },
  {
    "name": "🎪 NullTop",
    "avatar": "🎪",
    "baseMmr": 1709
  },
  {
    "name": "🧨 Ghost99",
    "avatar": "🧨",
    "baseMmr": 1702
  },
  {
    "name": "🦈 MistKill",
    "avatar": "🦈",
    "baseMmr": 1698
  },
  {
    "name": "🌋 ValeYang",
    "avatar": "🌋",
    "baseMmr": 1694
  },
  {
    "name": "💎 NovaMark",
    "avatar": "💎",
    "baseMmr": 1684
  },
  {
    "name": "🦊 FangCore",
    "avatar": "🦊",
    "baseMmr": 1682
  },
  {
    "name": "🎴 LakePro",
    "avatar": "🎴",
    "baseMmr": 1674
  },
  {
    "name": "🚀 ZenOne",
    "avatar": "🚀",
    "baseMmr": 1666
  },
  {
    "name": "🚀 MoonMark",
    "avatar": "🚀",
    "baseMmr": 1662
  },
  {
    "name": "🎴 LuxOmni",
    "avatar": "🎴",
    "baseMmr": 1654
  },
  {
    "name": "🏆 RainNuke",
    "avatar": "🏆",
    "baseMmr": 1652
  },
  {
    "name": "🐉 FireOmni",
    "avatar": "🐉",
    "baseMmr": 1642
  },
  {
    "name": "🀄 HexDrift",
    "avatar": "🀄",
    "baseMmr": 1640
  },
  {
    "name": "🔥 Lake99",
    "avatar": "🔥",
    "baseMmr": 1633
  },
  {
    "name": "🎭 VoidOne",
    "avatar": "🎭",
    "baseMmr": 1625
  },
  {
    "name": "🚀 AshMax",
    "avatar": "🚀",
    "baseMmr": 1620
  },
  {
    "name": "🌪 VoidElite",
    "avatar": "🌪",
    "baseMmr": 1612
  },
  {
    "name": "⚡ IronGG",
    "avatar": "⚡",
    "baseMmr": 1609
  },
  {
    "name": "🌋 EchoX",
    "avatar": "🌋",
    "baseMmr": 1602
  },
  {
    "name": "⚡ ArcAlpha",
    "avatar": "⚡",
    "baseMmr": 1599
  },
  {
    "name": "🏆 HuntGod",
    "avatar": "🏆",
    "baseMmr": 1599
  },
  {
    "name": "🐉 IrisLion",
    "avatar": "🐉",
    "baseMmr": 1598
  },
  {
    "name": "🎯 PikeUltra",
    "avatar": "🎯",
    "baseMmr": 1597
  },
  {
    "name": "🀄 WaveOmega",
    "avatar": "🀄",
    "baseMmr": 1597
  },
  {
    "name": "🦈 LuxLion",
    "avatar": "🦈",
    "baseMmr": 1596
  },
  {
    "name": "⚡ PeakVibe",
    "avatar": "⚡",
    "baseMmr": 1595
  },
  {
    "name": "⚡ PikeAlpha",
    "avatar": "⚡",
    "baseMmr": 1595
  },
  {
    "name": "🏅 RainAce",
    "avatar": "🏅",
    "baseMmr": 1594
  },
  {
    "name": "🏆 VertexGod",
    "avatar": "🏆",
    "baseMmr": 1593
  },
  {
    "name": "🌟 CrowKill",
    "avatar": "🌟",
    "baseMmr": 1593
  },
  {
    "name": "🐺 MoonXtra",
    "avatar": "🐺",
    "baseMmr": 1592
  },
  {
    "name": "🏆 NovaAlpha",
    "avatar": "🏆",
    "baseMmr": 1591
  },
  {
    "name": "🦄 DawnJinx",
    "avatar": "🦄",
    "baseMmr": 1590
  },
  {
    "name": "🐺 ZetaAce",
    "avatar": "🐺",
    "baseMmr": 1590
  },
  {
    "name": "🦅 XenoMode",
    "avatar": "🦅",
    "baseMmr": 1589
  },
  {
    "name": "🗡️ VertexElite",
    "avatar": "🗡️",
    "baseMmr": 1588
  },
  {
    "name": "🐉 Lake99",
    "avatar": "🐉",
    "baseMmr": 1588
  },
  {
    "name": "🐺 PeakGlow",
    "avatar": "🐺",
    "baseMmr": 1587
  },
  {
    "name": "🎪 NeonKard",
    "avatar": "🎪",
    "baseMmr": 1587
  }
] as const;

const MODE_TO_TITLE_CAT: Readonly<Record<string, LegacyTitleCategory>> = {
  uno: "uno",
  scala40: "scala40",
  "ruba-mazzetto": "ruba",
  blackjack: "blackjack",
  scopa: "scopa",
  "poker-texas": "poker",
  burraco: "burraco",
  "mille-miglia": "millemiglia",
};

/**
 * Selects a title whose prestige scales directly with player/bot MMR
 * and prioritizes the active game mode category when matching tier titles exist.
 */
export function pickPrestigiousTitleForMMR(
  mmr: number,
  mode = "uno",
  seed = 0,
): LegacyTitleDefinition {
  const targetTier: 1 | 2 | 3 | 4 | 5 =
    mmr >= 1750 ? 5 : mmr >= 1400 ? 4 : mmr >= 1100 ? 3 : mmr >= 700 ? 2 : 1;
  const preferredCat = MODE_TO_TITLE_CAT[mode] ?? "uno";

  const modeTierPool = LEGACY_TITLES.filter(
    (t) =>
      (t.category === preferredCat || t.category === "ucs" || t.category === "rank") &&
      t.prestigeTier === targetTier,
  );
  if (modeTierPool.length > 0) {
    return modeTierPool[Math.abs(seed) % modeTierPool.length]!;
  }
  const anyTierPool = LEGACY_TITLES.filter((t) => t.prestigeTier === targetTier);
  return anyTierPool[Math.abs(seed) % anyTierPool.length] ?? LEGACY_TITLES[0]!;
}

export const LEGACY_DAILY_CHALLENGES: readonly ChallengeDefinition[] = [
  {
    "id": "lg_d_c_win3",
    "period": "daily",
    "title": "Vittorie Rapide",
    "description": "Vinci 3 partite",
    "metric": "matches_won",
    "target": 3,
    "rewardXp": 200,
    "rewardVCard": 40
  },
  {
    "id": "lg_d_c_play10",
    "period": "daily",
    "title": "Mani di Fuoco",
    "description": "Gioca 10 carte in una sola partita",
    "metric": "cards_played",
    "target": 10,
    "rewardXp": 150,
    "rewardVCard": 25
  },
  {
    "id": "lg_d_c_draw5",
    "period": "daily",
    "title": "Pescatore",
    "description": "Fai pescare 5 carte agli avversari",
    "metric": "matches_played",
    "target": 5,
    "rewardXp": 200,
    "rewardVCard": 30
  },
  {
    "id": "lg_d_c_uno3",
    "period": "daily",
    "title": "Dici UNO!",
    "description": "Dichiara UNO 3 volte",
    "metric": "uno_calls",
    "target": 3,
    "rewardXp": 150,
    "rewardVCard": 25
  },
  {
    "id": "lg_d_c_nolose",
    "period": "daily",
    "title": "Invincibile",
    "description": "Vinci senza perdere round",
    "metric": "matches_won",
    "target": 1,
    "rewardXp": 150,
    "rewardVCard": 60
  },
  {
    "id": "lg_d_c_w4",
    "period": "daily",
    "title": "Pioggia di +4",
    "description": "Gioca 2 carte +4",
    "metric": "matches_played",
    "target": 2,
    "rewardXp": 200,
    "rewardVCard": 35
  },
  {
    "id": "lg_d_c_tourney",
    "period": "daily",
    "title": "Torneatore",
    "description": "Completa 1 torneo",
    "metric": "matches_played",
    "target": 1,
    "rewardXp": 150,
    "rewardVCard": 100
  },
  {
    "id": "lg_d_c_games3",
    "period": "daily",
    "title": "Maratoneta",
    "description": "Gioca 3 partite (qualsiasi esito)",
    "metric": "matches_played",
    "target": 3,
    "rewardXp": 150,
    "rewardVCard": 25
  },
  {
    "id": "lg_d_c_scopa_win1",
    "period": "daily",
    "title": "Primo Spazzino",
    "description": "Vinci 1 partita di Scopa",
    "metric": "matches_won",
    "target": 1,
    "rewardXp": 150,
    "rewardVCard": 25
  },
  {
    "id": "lg_d_c_scopa_win3",
    "period": "daily",
    "title": "Scopa Pro",
    "description": "Vinci 3 partite di Scopa",
    "metric": "matches_won",
    "target": 3,
    "rewardXp": 150,
    "rewardVCard": 40
  },
  {
    "id": "lg_d_c_scopa2",
    "period": "daily",
    "title": "Doppia Scopa",
    "description": "Fai 2 scope in una partita",
    "metric": "matches_played",
    "target": 2,
    "rewardXp": 150,
    "rewardVCard": 30
  },
  {
    "id": "lg_d_c_poker_win1",
    "period": "daily",
    "title": "Primo Pot",
    "description": "Vinci 1 partita di Poker",
    "metric": "matches_won",
    "target": 1,
    "rewardXp": 150,
    "rewardVCard": 25
  },
  {
    "id": "lg_d_c_poker_win3",
    "period": "daily",
    "title": "Poker Face",
    "description": "Vinci 3 partite di Poker",
    "metric": "matches_won",
    "target": 3,
    "rewardXp": 150,
    "rewardVCard": 45
  },
  {
    "id": "lg_d_c_poker_allin",
    "period": "daily",
    "title": "All-In!",
    "description": "Vai all-in e vinci",
    "metric": "matches_played",
    "target": 1,
    "rewardXp": 150,
    "rewardVCard": 50
  },
  {
    "id": "lg_d_c_burr_win1",
    "period": "daily",
    "title": "Burraco Debut",
    "description": "Vinci 1 partita di Burraco",
    "metric": "matches_won",
    "target": 1,
    "rewardXp": 150,
    "rewardVCard": 25
  },
  {
    "id": "lg_d_c_burr_brr",
    "period": "daily",
    "title": "Burraco!",
    "description": "Fai un Burraco (7+ carte)",
    "metric": "matches_played",
    "target": 1,
    "rewardXp": 150,
    "rewardVCard": 40
  },
  {
    "id": "lg_d_c_mm_win1",
    "period": "daily",
    "title": "Bandiera",
    "description": "Vinci 1 partita di MM",
    "metric": "matches_won",
    "target": 1,
    "rewardXp": 150,
    "rewardVCard": 25
  },
  {
    "id": "lg_d_c_mm_500",
    "period": "daily",
    "title": "Metà Strada",
    "description": "Raggiungi 500 miglia in una partita",
    "metric": "matches_played",
    "target": 1,
    "rewardXp": 150,
    "rewardVCard": 30
  },
  {
    "id": "lg_d_c_bj_win2",
    "period": "daily",
    "title": "House Edge",
    "description": "Vinci 2 mani di Blackjack",
    "metric": "matches_won",
    "target": 2,
    "rewardXp": 150,
    "rewardVCard": 25
  },
  {
    "id": "lg_d_c_bj_bj",
    "period": "daily",
    "title": "Blackjack!",
    "description": "Fai Blackjack naturale (21)",
    "metric": "matches_played",
    "target": 1,
    "rewardXp": 150,
    "rewardVCard": 50
  },
  {
    "id": "lg_d_c_ruba_win2",
    "period": "daily",
    "title": "Ladro di Carte",
    "description": "Vinci 2 partite di Ruba",
    "metric": "matches_won",
    "target": 2,
    "rewardXp": 150,
    "rewardVCard": 25
  },
  {
    "id": "lg_d_c_scala_win1",
    "period": "daily",
    "title": "Scala di Seta",
    "description": "Vinci 1 partita di Scala 40",
    "metric": "matches_won",
    "target": 1,
    "rewardXp": 150,
    "rewardVCard": 25
  },
  {
    "id": "lg_d_c_mini_3",
    "period": "daily",
    "title": "Tuttofare",
    "description": "Gioca 3 mini-game diversi",
    "metric": "matches_played",
    "target": 3,
    "rewardXp": 150,
    "rewardVCard": 60
  },
  {
    "id": "lg_dm_dm_win3",
    "period": "daily",
    "title": "Hat-Trick",
    "description": "Vinci 3 partite oggi",
    "metric": "matches_won",
    "target": 3,
    "rewardXp": 225,
    "rewardVCard": 40
  },
  {
    "id": "lg_dm_dm_win5",
    "period": "daily",
    "title": "Dominatore",
    "description": "Vinci 5 partite oggi",
    "metric": "matches_won",
    "target": 5,
    "rewardXp": 375,
    "rewardVCard": 75
  },
  {
    "id": "lg_dm_dm_play10",
    "period": "daily",
    "title": "Maratoneta",
    "description": "Gioca 10 partite oggi",
    "metric": "matches_played",
    "target": 10,
    "rewardXp": 150,
    "rewardVCard": 30
  },
  {
    "id": "lg_dm_dm_w4_5",
    "period": "daily",
    "title": "Re del +4",
    "description": "Gioca 5 carte +4 oggi",
    "metric": "matches_played",
    "target": 5,
    "rewardXp": 180,
    "rewardVCard": 35
  },
  {
    "id": "lg_dm_dm_uno3",
    "period": "daily",
    "title": "UNO! x3",
    "description": "Di' UNO e vinci 3 volte",
    "metric": "matches_won",
    "target": 3,
    "rewardXp": 270,
    "rewardVCard": 45
  },
  {
    "id": "lg_dm_dm_streak3",
    "period": "daily",
    "title": "Striscia",
    "description": "Fai una striscia di 3 vittorie",
    "metric": "matches_played",
    "target": 3,
    "rewardXp": 300,
    "rewardVCard": 50
  },
  {
    "id": "lg_dm_dm_ranked3",
    "period": "daily",
    "title": "Competitore",
    "description": "Vinci 3 ranked oggi",
    "metric": "matches_played",
    "target": 3,
    "rewardXp": 330,
    "rewardVCard": 60
  },
  {
    "id": "lg_dm_dm_skip5",
    "period": "daily",
    "title": "Intoccabile",
    "description": "Usa 5 carte Skip oggi",
    "metric": "matches_played",
    "target": 5,
    "rewardXp": 150,
    "rewardVCard": 25
  }
] as const;

export const LEGACY_WEEKLY_CHALLENGES: readonly ChallengeDefinition[] = [
  {
    "id": "lg_w_w_wins10",
    "period": "weekly",
    "title": "Campione della Settimana",
    "description": "Vinci 10 partite questa settimana",
    "metric": "matches_won",
    "target": 10,
    "rewardXp": 300,
    "rewardVCard": 250
  },
  {
    "id": "lg_w_w_scopa5",
    "period": "weekly",
    "title": "Maestro della Scopa",
    "description": "Vinci 5 partite di Scopa",
    "metric": "matches_won",
    "target": 5,
    "rewardXp": 200,
    "rewardVCard": 150
  },
  {
    "id": "lg_w_w_poker5",
    "period": "weekly",
    "title": "Squalo del Poker",
    "description": "Vinci 5 partite di Poker",
    "metric": "matches_won",
    "target": 5,
    "rewardXp": 200,
    "rewardVCard": 150
  },
  {
    "id": "lg_w_w_mini10",
    "period": "weekly",
    "title": "Giocatore Versatile",
    "description": "Gioca 10 mini-game diversi",
    "metric": "matches_played",
    "target": 10,
    "rewardXp": 250,
    "rewardVCard": 200
  },
  {
    "id": "lg_w_w_mmr50",
    "period": "weekly",
    "title": "Scalata MMR",
    "description": "Guadagna 50 MMR totali questa settimana",
    "metric": "matches_played",
    "target": 50,
    "rewardXp": 350,
    "rewardVCard": 300
  },
  {
    "id": "lg_w_w_streak5",
    "period": "weekly",
    "title": "Striscia Vincente",
    "description": "Vinci 5 partite di fila",
    "metric": "matches_played",
    "target": 5,
    "rewardXp": 280,
    "rewardVCard": 225
  },
  {
    "id": "lg_w_w_penta",
    "period": "weekly",
    "title": "Pentatleta",
    "description": "Completa 1 Pentathlon",
    "metric": "matches_played",
    "target": 1,
    "rewardXp": 500,
    "rewardVCard": 400
  },
  {
    "id": "lg_wm_wm_win15",
    "period": "weekly",
    "title": "Campione Settimanale",
    "description": "Vinci 15 partite questa settimana",
    "metric": "matches_won",
    "target": 15,
    "rewardXp": 900,
    "rewardVCard": 200
  },
  {
    "id": "lg_wm_wm_win25",
    "period": "weekly",
    "title": "Dominatore Assoluto",
    "description": "Vinci 25 partite questa settimana",
    "metric": "matches_won",
    "target": 25,
    "rewardXp": 1500,
    "rewardVCard": 350
  },
  {
    "id": "lg_wm_wm_ruba5",
    "period": "weekly",
    "title": "Ladro Esperto",
    "description": "Vinci 5 partite Ruba Mazzetto",
    "metric": "matches_played",
    "target": 5,
    "rewardXp": 600,
    "rewardVCard": 125
  },
  {
    "id": "lg_wm_wm_scala5",
    "period": "weekly",
    "title": "Maestro delle Scale",
    "description": "Vinci 5 partite Scala 40",
    "metric": "matches_played",
    "target": 5,
    "rewardXp": 600,
    "rewardVCard": 125
  },
  {
    "id": "lg_wm_wm_bj5",
    "period": "weekly",
    "title": "High Roller",
    "description": "Vinci 5 partite Blackjack",
    "metric": "matches_played",
    "target": 5,
    "rewardXp": 600,
    "rewardVCard": 125
  },
  {
    "id": "lg_wm_wm_ucs1",
    "period": "weekly",
    "title": "Accesso Elite",
    "description": "Vinci 1 partita UCS",
    "metric": "matches_played",
    "target": 1,
    "rewardXp": 1200,
    "rewardVCard": 250
  },
  {
    "id": "lg_wm_wm_streak5",
    "period": "weekly",
    "title": "Striscia Leggendaria",
    "description": "Fai 5 vittorie consecutive",
    "metric": "matches_played",
    "target": 5,
    "rewardXp": 825,
    "rewardVCard": 175
  },
  {
    "id": "lg_wm_wm_t32_1",
    "period": "weekly",
    "title": "Conquistatore",
    "description": "Vinci il Torneo a 32",
    "metric": "matches_played",
    "target": 1,
    "rewardXp": 1350,
    "rewardVCard": 300
  }
] as const;

export const LEGACY_SEASONAL_CHALLENGES: readonly ChallengeDefinition[] = [
  {
    "id": "lg_cm_cm_wins",
    "period": "seasonal",
    "title": "Vittorie Club",
    "description": "Vinci 10 partite",
    "metric": "matches_won",
    "target": 10,
    "rewardXp": 500,
    "rewardVCard": 30
  },
  {
    "id": "lg_cm_cm_games",
    "period": "seasonal",
    "title": "Maratoneta Club",
    "description": "Gioca 20 partite",
    "metric": "matches_played",
    "target": 20,
    "rewardXp": 300,
    "rewardVCard": 30
  },
  {
    "id": "lg_cm_cm_bj",
    "period": "seasonal",
    "title": "Notti al Casino",
    "description": "Vinci 5 mani BJ",
    "metric": "matches_played",
    "target": 5,
    "rewardXp": 400,
    "rewardVCard": 30
  },
  {
    "id": "lg_cm_cm_uno",
    "period": "seasonal",
    "title": "UNO Squadra",
    "description": "Dichiara UNO 8 volte",
    "metric": "uno_calls",
    "target": 8,
    "rewardXp": 250,
    "rewardVCard": 30
  },
  {
    "id": "lg_cm_cm_w4",
    "period": "seasonal",
    "title": "Pioggia di Fuoco",
    "description": "Gioca 15 carte +4",
    "metric": "matches_played",
    "target": 15,
    "rewardXp": 350,
    "rewardVCard": 30
  },
  {
    "id": "lg_cm_cm_weekly_w",
    "period": "seasonal",
    "title": "Settimana Epica",
    "description": "Vinci 50 partite in 7 giorni",
    "metric": "matches_won",
    "target": 50,
    "rewardXp": 1500,
    "rewardVCard": 30
  },
  {
    "id": "lg_cm_cm_weekly_g",
    "period": "seasonal",
    "title": "Grind Settimanale",
    "description": "Gioca 100 partite in 7 giorni",
    "metric": "matches_played",
    "target": 100,
    "rewardXp": 2000,
    "rewardVCard": 30
  }
] as const;
