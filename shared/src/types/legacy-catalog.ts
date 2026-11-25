// ============================================================
// UNO ULTRA — Imported Legacy Targhette & Sfide Catalog (v52 Backup)
// ============================================================

import type { ChallengeDefinition, CosmeticRarity } from "./economy.js";

export type LegacyTitleCategory =
  | "rank"
  | "ucs"
  | "uno"
  | "scala40"
  | "ruba"
  | "blackjack"
  | "club"
  | "multi"
  | "battlepass"
  | "special";

export interface LegacyTitleDefinition {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly description: string;
  readonly category: LegacyTitleCategory;
  readonly rarity: CosmeticRarity;
  readonly mmrReq?: number;
  readonly feat?: string;
  readonly anim?: string;
}

export const LEGACY_TITLES: readonly LegacyTitleDefinition[] = [
  {
    "id": "t1",
    "name": "Principiante",
    "color": "#aaa",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "mmrReq": 0
  },
  {
    "id": "t2",
    "name": "S1 – Bronzo",
    "color": "#9E9E9E",
    "description": "Raggiungi 200 MMR in Stagione 1.",
    "category": "rank",
    "rarity": "rare",
    "mmrReq": 200
  },
  {
    "id": "t3",
    "name": "S1 – Argento",
    "color": "#C0C0C0",
    "description": "Raggiungi 400 MMR in Stagione 1.",
    "category": "rank",
    "rarity": "rare",
    "mmrReq": 400
  },
  {
    "id": "t4",
    "name": "S1 – Oro",
    "color": "#D39940",
    "description": "Raggiungi 600 MMR in Stagione 1.",
    "category": "rank",
    "rarity": "rare",
    "mmrReq": 600
  },
  {
    "id": "t5",
    "name": "S1 – Platino",
    "color": "#D2E4E3",
    "description": "Raggiungi 800 MMR in Stagione 1.",
    "category": "rank",
    "rarity": "epic",
    "mmrReq": 800
  },
  {
    "id": "t6",
    "name": "S1 – Diamante",
    "color": "#7EE4F8",
    "description": "Raggiungi 1000 MMR in Stagione 1.",
    "category": "rank",
    "rarity": "epic",
    "mmrReq": 1000
  },
  {
    "id": "t7",
    "name": "S1 – Campione",
    "color": "#4A9CE1",
    "description": "Raggiungi 1200 MMR in Stagione 1.",
    "category": "rank",
    "rarity": "epic",
    "mmrReq": 1200
  },
  {
    "id": "t8",
    "name": "S1 – Grande Campione",
    "color": "#FF4081",
    "description": "Raggiungi 1400 MMR in Stagione 1.",
    "category": "rank",
    "rarity": "legendary",
    "mmrReq": 1400
  },
  {
    "id": "t9",
    "name": "S1 – Leggenda Supersonica",
    "color": "#FFFFFF",
    "description": "Raggiungi 1600 MMR in Stagione 1.",
    "category": "rank",
    "rarity": "mythic",
    "mmrReq": 1600
  },
  {
    "id": "t10",
    "name": "Fastest Hand S1",
    "color": "var(--teal)",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "blitz_speed"
  },
  {
    "id": "t11",
    "name": "No Mercy",
    "color": "#ff6b35",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "overload_win"
  },
  {
    "id": "t12",
    "name": "Senza Pietà",
    "color": "var(--crimson)",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "stack8"
  },
  {
    "id": "tt1",
    "name": "🥉 Campione Bronzo I",
    "color": "#CD7F32",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_bronze1"
  },
  {
    "id": "tt2",
    "name": "🥉 Campione Bronzo II",
    "color": "#CD7F32",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_bronze2"
  },
  {
    "id": "tt3",
    "name": "🥉 Campione Bronzo III",
    "color": "#CD7F32",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_bronze3"
  },
  {
    "id": "tt4",
    "name": "🥈 Campione Argento I",
    "color": "#C0C0C0",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_silver1"
  },
  {
    "id": "tt5",
    "name": "🥈 Campione Argento II",
    "color": "#C0C0C0",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_silver2"
  },
  {
    "id": "tt6",
    "name": "🥈 Campione Argento III",
    "color": "#C0C0C0",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_silver3"
  },
  {
    "id": "tt7",
    "name": "🥇 Campione Oro I",
    "color": "#D39940",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_gold1"
  },
  {
    "id": "tt8",
    "name": "🥇 Campione Oro II",
    "color": "#D39940",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_gold2"
  },
  {
    "id": "tt9",
    "name": "🥇 Campione Oro III",
    "color": "#D39940",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_gold3"
  },
  {
    "id": "tt10",
    "name": "💠 Campione Platino I",
    "color": "#D2E4E3",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_plat1"
  },
  {
    "id": "tt11",
    "name": "💠 Campione Platino II",
    "color": "#D2E4E3",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_plat2"
  },
  {
    "id": "tt12",
    "name": "💠 Campione Platino III",
    "color": "#D2E4E3",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_plat3"
  },
  {
    "id": "tt13",
    "name": "💎 Campione Diamante I",
    "color": "#7EE4F8",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_diamond1"
  },
  {
    "id": "tt14",
    "name": "💎 Campione Diamante II",
    "color": "#7EE4F8",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_diamond2"
  },
  {
    "id": "tt15",
    "name": "💎 Campione Diamante III",
    "color": "#7EE4F8",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_diamond3"
  },
  {
    "id": "tt16",
    "name": "🏅 Campione Champion I",
    "color": "#4A9CE1",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_champ1"
  },
  {
    "id": "tt17",
    "name": "🏅 Campione Champion II",
    "color": "#4A9CE1",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_champ2"
  },
  {
    "id": "tt18",
    "name": "🏅 Campione Champion III",
    "color": "#4A9CE1",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_champ3"
  },
  {
    "id": "tt19",
    "name": "🔥 Grande Campione I",
    "color": "#FF4081",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_gchamp1"
  },
  {
    "id": "tt20",
    "name": "🔥 Grande Campione II",
    "color": "#FF4081",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_gchamp2"
  },
  {
    "id": "tt21",
    "name": "🔥 Grande Campione III",
    "color": "#FF4081",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_gchamp3"
  },
  {
    "id": "tt22",
    "name": "⚡ Leggenda Supersonica",
    "color": "#FFFFFF",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_ssl"
  },
  {
    "id": "tg1",
    "name": "Instancabile",
    "color": "#00E5FF",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "games_100"
  },
  {
    "id": "tg2",
    "name": "Veterano di Ultra",
    "color": "#7EE4F8",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "games_500"
  },
  {
    "id": "tg3",
    "name": "Leggenda Vivente",
    "color": "#FF4081",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "mythic",
    "feat": "season_champ_2x"
  },
  {
    "id": "ts1",
    "name": "Il Terrore dei +4",
    "color": "#ff6b35",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "w4_triple"
  },
  {
    "id": "ts2",
    "name": "Ultima Parola",
    "color": "#00ff88",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "win_action"
  },
  {
    "id": "ts3",
    "name": "Fantasma",
    "color": "rgba(200,200,255,.8)",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "win_no_uno"
  },
  {
    "id": "ts4",
    "name": "Il Mago del +4",
    "color": "#FF4081",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "w4_100"
  },
  {
    "id": "ti1",
    "name": "Pescato dal Destino",
    "color": "#aaa",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "hand_20_loss"
  },
  {
    "id": "ti2",
    "name": "Quasi SSL",
    "color": "rgba(255,255,255,.6)",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "mythic",
    "feat": "hardstuck_20"
  },
  {
    "id": "tm1",
    "name": "Creatura del Vuoto",
    "color": "#6c2fa0",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "win_dark"
  },
  {
    "id": "tm2",
    "name": "Anomalia",
    "color": "#ff00ff",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "chaos_5win"
  },
  {
    "id": "tm3",
    "name": "010101",
    "color": "#00ff88",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "beat_ultra_bot"
  },
  {
    "id": "tc1",
    "name": "Fortunato",
    "color": "#FFD700",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "crate_win"
  },
  {
    "id": "tc2",
    "name": "Collezionista",
    "color": "#c084fc",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "crates_5"
  },
  {
    "id": "tc3",
    "name": "Jolly del Mazzo",
    "color": "#00E5FF",
    "description": "Targhetta onorifica UNO ULTRA.",
    "category": "rank",
    "rarity": "common",
    "feat": "crate_legendary_win"
  },
  {
    "id": "sc01",
    "name": "Protocollo S",
    "color": "#fb923c",
    "description": "Vinci 1 partita a Scopa",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_win1"
  },
  {
    "id": "sc02",
    "name": "Impulso Primario",
    "color": "#f97316",
    "description": "Cattura il Settebello (7 di denari)",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_sett1"
  },
  {
    "id": "sc03",
    "name": "Tabula Rasa",
    "color": "#ea580c",
    "description": "Fai 1 scopa in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_scopa1"
  },
  {
    "id": "sc04",
    "name": "Dominio Assoluto",
    "color": "#fb923c",
    "description": "Vinci la primiera in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_prim1"
  },
  {
    "id": "sc05",
    "name": "Sovraccarico",
    "color": "#fbbf24",
    "description": "Cattura 5+ denari in una manche",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_den5"
  },
  {
    "id": "sc06",
    "name": "Collisione Finale",
    "color": "#f59e0b",
    "description": "Fai 3 scope in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_scopa3g"
  },
  {
    "id": "sc07",
    "name": "Catena d'Oro",
    "color": "#d97706",
    "description": "Cattura A+2+3 di denari (Napola) in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_napola1"
  },
  {
    "id": "sc08",
    "name": "Impulso Cinetico",
    "color": "#fb923c",
    "description": "Fai 5 scope in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_scopa5g"
  },
  {
    "id": "sc09",
    "name": "Nucleo Attivo",
    "color": "#fcd34d",
    "description": "Cattura 7+ denari in una manche",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_den7"
  },
  {
    "id": "sc10",
    "name": "Settore Zero",
    "color": "#fb923c",
    "description": "Fai 10 scope totali (cumulativi)",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_scopa10t"
  },
  {
    "id": "sc11",
    "name": "Impulso Secco",
    "color": "#f97316",
    "description": "Vinci una partita con 1 solo punto di scarto",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_win1pt"
  },
  {
    "id": "sc12",
    "name": "Eclissi Totale",
    "color": "#ea580c",
    "description": "Fai 2 scope in una singola manche",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_scopa2r"
  },
  {
    "id": "sc13",
    "name": "Carica d'Urto",
    "color": "#fbbf24",
    "description": "Cattura tutti e 4 gli assi in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_aces4"
  },
  {
    "id": "sc14",
    "name": "Oltre il Limite",
    "color": "#f59e0b",
    "description": "Fai 3 scope in una singola manche",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_scopa3r"
  },
  {
    "id": "sc15",
    "name": "Zenith",
    "color": "#d97706",
    "description": "Cattura il Settebello in 3 partite diverse",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_sett3t"
  },
  {
    "id": "sc16",
    "name": "Reazione a Catena",
    "color": "#fb923c",
    "description": "Fai 7 scope in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_scopa7g"
  },
  {
    "id": "sc17",
    "name": "Flusso Costante",
    "color": "#f97316",
    "description": "Vinci la primiera in 3 partite diverse",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_prim3t"
  },
  {
    "id": "sc18",
    "name": "Divisione Elite",
    "color": "#ea580c",
    "description": "Vinci 10 partite a Scopa",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_win10"
  },
  {
    "id": "sc19",
    "name": "Incursione",
    "color": "#fbbf24",
    "description": "Vinci Denari+Settebello+Napola in una sola partita",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_rebello"
  },
  {
    "id": "sc20",
    "name": "Titanio",
    "color": "#f59e0b",
    "description": "Vinci 20 partite a Scopa",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_win20"
  },
  {
    "id": "sc21",
    "name": "Frequenza Alta",
    "color": "#d97706",
    "description": "Completa la Napola in 3 partite diverse",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_napola3t"
  },
  {
    "id": "sc22",
    "name": "Punto di Rottura",
    "color": "#fb923c",
    "description": "Fai 10 scope in una sola partita",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_scopa10g"
  },
  {
    "id": "sc23",
    "name": "Eredità Settebello",
    "color": "#fcd34d",
    "description": "Cattura il Settebello in 5 partite diverse",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_sett5t"
  },
  {
    "id": "sc24",
    "name": "Orizzonte Eventi",
    "color": "#fb923c",
    "description": "Vinci 30 partite a Scopa",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_win30"
  },
  {
    "id": "sc25",
    "name": "Architetti del Vuoto",
    "color": "#fef08a",
    "description": "Vinci Carte+Denari+Settebello+Primiera+Napola in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "scopa_grandslam"
  },
  {
    "id": "br01",
    "name": "Flusso Sequenziale",
    "color": "#c084fc",
    "description": "Fai 1 burraco in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_brr1"
  },
  {
    "id": "br02",
    "name": "Nucleo Energetico",
    "color": "#a855f7",
    "description": "Prendi il pozzetto in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_pozz1"
  },
  {
    "id": "br03",
    "name": "Sintesi Pura",
    "color": "#9333ea",
    "description": "Vinci 1 partita a Burraco",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_win1"
  },
  {
    "id": "br04",
    "name": "Moltiplicatore",
    "color": "#c084fc",
    "description": "Cala un gruppo di 4 stessa carta (pinella)",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_pin1"
  },
  {
    "id": "br05",
    "name": "Architettura Zero",
    "color": "#d8b4fe",
    "description": "Vinci la partita con almeno 1 burraco puro (senza matte)",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_cleanwin"
  },
  {
    "id": "br06",
    "name": "Frequenza Critica",
    "color": "#a855f7",
    "description": "Vinci la prima manche (round 1)",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_smaz1"
  },
  {
    "id": "br07",
    "name": "Algoritmo Perfetto",
    "color": "#9333ea",
    "description": "Fai 2 burracos in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_brr2g"
  },
  {
    "id": "br08",
    "name": "Fase di Carica",
    "color": "#c084fc",
    "description": "Prendi il pozzetto e fai burraco nella stessa partita",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_pozzbrr"
  },
  {
    "id": "br09",
    "name": "Integrazione Totale",
    "color": "#d8b4fe",
    "description": "Vinci 5 partite a Burraco",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_win5"
  },
  {
    "id": "br10",
    "name": "Punto d'Iniezione",
    "color": "#a855f7",
    "description": "Cala 2 pinelle in una stessa partita",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_pin2g"
  },
  {
    "id": "br11",
    "name": "Evoluzione",
    "color": "#9333ea",
    "description": "Vinci 10 partite a Burraco",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_win10"
  },
  {
    "id": "br12",
    "name": "Cristallo Liquido",
    "color": "#c084fc",
    "description": "Fai 3 burracos puri totali (cumulativi)",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_clean3t"
  },
  {
    "id": "br13",
    "name": "Risonanza",
    "color": "#d8b4fe",
    "description": "Segna 500+ punti in una singola manche",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_500pts"
  },
  {
    "id": "br14",
    "name": "Switch Finale",
    "color": "#a855f7",
    "description": "Prendi il pozzetto e chiudi la partita",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_pozzclose"
  },
  {
    "id": "br15",
    "name": "Matrice Punti",
    "color": "#9333ea",
    "description": "Raggiungi 1000 punti totali in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_1000pts"
  },
  {
    "id": "br16",
    "name": "Sovratensione",
    "color": "#c084fc",
    "description": "Cala 5 pinelle totali (cumulativi)",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_pin5t"
  },
  {
    "id": "br17",
    "name": "Progetto Infinito",
    "color": "#d8b4fe",
    "description": "Vinci 20 partite a Burraco",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_win20"
  },
  {
    "id": "br18",
    "name": "Rientro Orbitale",
    "color": "#a855f7",
    "description": "Prendi il pozzetto in 10 partite diverse",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_pozz10t"
  },
  {
    "id": "br19",
    "name": "Connessione Neurale",
    "color": "#9333ea",
    "description": "Vinci 25 partite a Burraco",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_win25"
  },
  {
    "id": "br20",
    "name": "Frammentazione Zero",
    "color": "#c084fc",
    "description": "Fai burraco puro + pinella nella stessa partita",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_cleanpin"
  },
  {
    "id": "br21",
    "name": "Nucleo Magnetico",
    "color": "#d8b4fe",
    "description": "Vinci 30 partite a Burraco",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_win30"
  },
  {
    "id": "br22",
    "name": "Punto di Estrazione",
    "color": "#a855f7",
    "description": "Fai 10 burracos totali (cumulativi)",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_brr10t"
  },
  {
    "id": "br23",
    "name": "Flusso Cobalto",
    "color": "#9333ea",
    "description": "Cala 10 pinelle totali (cumulativi)",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_pin10t"
  },
  {
    "id": "br24",
    "name": "Sovrapposizione",
    "color": "#c084fc",
    "description": "Prendi il pozzetto in 20 partite diverse",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_pozz20t"
  },
  {
    "id": "br25",
    "name": "Codice d'Onore",
    "color": "#f3e8ff",
    "description": "Vinci 50 partite a Burraco",
    "category": "rank",
    "rarity": "common",
    "feat": "burraco_win50"
  },
  {
    "id": "pk01",
    "name": "Punto di Non Ritorno",
    "color": "#34d399",
    "description": "Vinci un all-in",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_allin1"
  },
  {
    "id": "pk02",
    "name": "Oltre il Buio",
    "color": "#10b981",
    "description": "Vinci 1 partita a Poker",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_win1"
  },
  {
    "id": "pk03",
    "name": "Corrente Letale",
    "color": "#059669",
    "description": "Vinci una mano al river (showdown)",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_river1"
  },
  {
    "id": "pk04",
    "name": "Architetto d'Ombre",
    "color": "#34d399",
    "description": "Vinci quando l'avversario folda",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_bluff1"
  },
  {
    "id": "pk05",
    "name": "Calcolo a Freddo",
    "color": "#6ee7b7",
    "description": "Vinci 3 partite a Poker",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_win3"
  },
  {
    "id": "pk06",
    "name": "Impatto Iniziale",
    "color": "#10b981",
    "description": "Vinci una mano al flop (tutti foldano prima del turn)",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_flop1"
  },
  {
    "id": "pk07",
    "name": "Terrore Psicologico",
    "color": "#059669",
    "description": "Vinci 5 partite a Poker",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_win5"
  },
  {
    "id": "pk08",
    "name": "Sangue Freddo",
    "color": "#34d399",
    "description": "Vinci uno showdown (carte scoperte)",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_showdown1"
  },
  {
    "id": "pk09",
    "name": "Verità d'Acciaio",
    "color": "#6ee7b7",
    "description": "Vinci con Full House o mano superiore",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_fh1"
  },
  {
    "id": "pk10",
    "name": "Predatore del Piatto",
    "color": "#10b981",
    "description": "Vinci 10 partite a Poker",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_win10"
  },
  {
    "id": "pk11",
    "name": "Scacco Matto",
    "color": "#059669",
    "description": "Vinci 3 partite consecutive a Poker",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_streak3"
  },
  {
    "id": "pk12",
    "name": "Rotazione Critica",
    "color": "#34d399",
    "description": "Vinci una mano che si decide al turn",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_turn1"
  },
  {
    "id": "pk13",
    "name": "Impulso Finale",
    "color": "#6ee7b7",
    "description": "Vinci 15 partite a Poker",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_win15"
  },
  {
    "id": "pk14",
    "name": "Visione X",
    "color": "#10b981",
    "description": "Vinci la partita dopo essere sceso sotto 200 chips",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_comeback1"
  },
  {
    "id": "pk15",
    "name": "Dominio Totale",
    "color": "#059669",
    "description": "Vinci 20 partite a Poker",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_win20"
  },
  {
    "id": "pk16",
    "name": "Ultima Speranza",
    "color": "#34d399",
    "description": "Vinci 3 mani al river (cumulativo)",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_river3t"
  },
  {
    "id": "pk17",
    "name": "Cyber-Bluff",
    "color": "#6ee7b7",
    "description": "Fai foldare l'avversario 5 volte (cumulativo)",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_bluff5t"
  },
  {
    "id": "pk18",
    "name": "Muro Indistruttibile",
    "color": "#10b981",
    "description": "Vinci con Full House in 3 partite diverse",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_fh3t"
  },
  {
    "id": "pk19",
    "name": "Protocollo Ombra",
    "color": "#059669",
    "description": "Vinci 30 partite a Poker",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_win30"
  },
  {
    "id": "pk20",
    "name": "Fuoco Incrociato",
    "color": "#34d399",
    "description": "Vinci 5 all-in totali (cumulativo)",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_allin5t"
  },
  {
    "id": "pk21",
    "name": "Punto Cieco",
    "color": "#6ee7b7",
    "description": "Vinci 40 partite a Poker",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_win40"
  },
  {
    "id": "pk22",
    "name": "Detonazione",
    "color": "#10b981",
    "description": "Vinci 10 all-in totali (cumulativo)",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_allin10t"
  },
  {
    "id": "pk23",
    "name": "Mente Alveare",
    "color": "#059669",
    "description": "Vinci 50 partite a Poker",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_win50"
  },
  {
    "id": "pk24",
    "name": "Eredità dei Re",
    "color": "#34d399",
    "description": "Vinci con Scala Reale o Scala a Colore",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_royalflush"
  },
  {
    "id": "pk25",
    "name": "Vuoto d'Aria",
    "color": "#d1fae5",
    "description": "Vinci 100 partite a Poker",
    "category": "rank",
    "rarity": "common",
    "feat": "poker_win100"
  },
  {
    "id": "mm01",
    "name": "Oltre la Barriera",
    "color": "#22d3ee",
    "description": "Vinci 1 partita a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win1"
  },
  {
    "id": "mm02",
    "name": "Accensione",
    "color": "#06b6d4",
    "description": "Gioca il primo Semaforo Verde",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_green1"
  },
  {
    "id": "mm03",
    "name": "Resistenza Estrema",
    "color": "#0891b2",
    "description": "Vinci 3 partite a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win3"
  },
  {
    "id": "mm04",
    "name": "Intervento Rapido",
    "color": "#22d3ee",
    "description": "Recupera da un guasto (gioca una carta rimedio)",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_remedy1"
  },
  {
    "id": "mm05",
    "name": "Protocollo 1000",
    "color": "#67e8f9",
    "description": "Vinci 5 partite a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win5"
  },
  {
    "id": "mm06",
    "name": "Blocco Totale",
    "color": "#06b6d4",
    "description": "Blocca un avversario con Semaforo Rosso",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_redlight1"
  },
  {
    "id": "mm07",
    "name": "Corsa Infinita",
    "color": "#0891b2",
    "description": "Vinci 10 partite a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win10"
  },
  {
    "id": "mm08",
    "name": "Conto alla Rovescia",
    "color": "#22d3ee",
    "description": "Raggiungi 500 miglia in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_500mi"
  },
  {
    "id": "mm09",
    "name": "Asfalto Liquido",
    "color": "#67e8f9",
    "description": "Vinci 15 partite a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win15"
  },
  {
    "id": "mm10",
    "name": "Spinta Idraulica",
    "color": "#06b6d4",
    "description": "Gioca una carta immunità (sicurezza)",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_safety1"
  },
  {
    "id": "mm11",
    "name": "Traiettoria Ideale",
    "color": "#0891b2",
    "description": "Vinci 20 partite a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win20"
  },
  {
    "id": "mm12",
    "name": "Backup Energetico",
    "color": "#22d3ee",
    "description": "Usa la Ruota di Scorta o Serbatoio Extra (immunity)",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_spare1"
  },
  {
    "id": "mm13",
    "name": "Orizzonte Mille",
    "color": "#67e8f9",
    "description": "Vinci 25 partite a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win25"
  },
  {
    "id": "mm14",
    "name": "Iniezione Diretta",
    "color": "#06b6d4",
    "description": "Gioca 3 carte da 200 miglia in una partita",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_200x3"
  },
  {
    "id": "mm15",
    "name": "Vento di Fuoco",
    "color": "#0891b2",
    "description": "Vinci 30 partite a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win30"
  },
  {
    "id": "mm16",
    "name": "Codice Colore",
    "color": "#22d3ee",
    "description": "Blocca e poi sblocca un avversario nella stessa partita",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_blockfix"
  },
  {
    "id": "mm17",
    "name": "Meccanica Quantistica",
    "color": "#67e8f9",
    "description": "Vinci 40 partite a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win40"
  },
  {
    "id": "mm18",
    "name": "Oltre il Traguardo",
    "color": "#06b6d4",
    "description": "Vinci una partita giocando una carta da 200 miglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_200win"
  },
  {
    "id": "mm19",
    "name": "Impulso Stradale",
    "color": "#0891b2",
    "description": "Vinci 50 partite a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win50"
  },
  {
    "id": "mm20",
    "name": "Vuoto Aerodinamico",
    "color": "#22d3ee",
    "description": "Vinci la gara essendo stato in svantaggio di 200+ miglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_overtake"
  },
  {
    "id": "mm21",
    "name": "Titanio e Cromo",
    "color": "#67e8f9",
    "description": "Vinci 60 partite a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win60"
  },
  {
    "id": "mm22",
    "name": "Reazione Zero",
    "color": "#06b6d4",
    "description": "Vinci una partita avendo giocato almeno 1 immunità",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_safetywin"
  },
  {
    "id": "mm23",
    "name": "Evoluzione Corsa",
    "color": "#0891b2",
    "description": "Vinci 75 partite a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win75"
  },
  {
    "id": "mm24",
    "name": "Rigenerazione",
    "color": "#22d3ee",
    "description": "Recupera da Semaforo Rosso, Guasto, Foratura e Carburante esaurito in partite diverse",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_allhazards"
  },
  {
    "id": "mm25",
    "name": "Ultimo Chilometro",
    "color": "#e0f2fe",
    "description": "Vinci 100 partite a Millemiglia",
    "category": "rank",
    "rarity": "common",
    "feat": "mille_win100"
  },
  {
    "id": "tx1",
    "name": "🎖️ Il Veterano",
    "color": "#CD7F32",
    "description": "Vinci 500 partite",
    "category": "special",
    "rarity": "rare",
    "feat": "veteran"
  },
  {
    "id": "tx2",
    "name": "💀 Terrore dei Bot",
    "color": "#ff4466",
    "description": "Batti l'IA SSL 10 volte",
    "category": "special",
    "rarity": "rare",
    "feat": "bot_slayer"
  },
  {
    "id": "tx3",
    "name": "🏆 Campione del Torneo",
    "color": "#FFD700",
    "description": "Vinci il torneo da 32",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "tourney_champ32"
  },
  {
    "id": "tx4",
    "name": "🔥 10 Vittorie di Fila",
    "color": "#ff6b35",
    "description": "10 vittorie consecutive",
    "category": "special",
    "rarity": "rare",
    "feat": "win_streak_10"
  },
  {
    "id": "tx5",
    "name": "🌑 Oscurità Totale",
    "color": "#8b5cf6",
    "description": "Vinci senza carte speciali",
    "category": "special",
    "rarity": "rare",
    "feat": "win_no_wild"
  },
  {
    "id": "tx6",
    "name": "👑 Dio di UNO",
    "color": "#ffffff",
    "description": "Raggiungi SSL e diventa il Dio",
    "category": "special",
    "rarity": "rare",
    "feat": "god_of_uno"
  },
  {
    "id": "tx7",
    "name": "⚡ Velocista",
    "color": "#00E5FF",
    "description": "Vinci in Speed Blitz",
    "category": "special",
    "rarity": "rare",
    "feat": "speed_demon"
  },
  {
    "id": "tx8",
    "name": "🌪️ Caos Totale",
    "color": "#FF4081",
    "description": "Vinci in modalità Chaos",
    "category": "special",
    "rarity": "rare",
    "feat": "chaos_winner"
  },
  {
    "id": "club_member",
    "name": "👥 Membro del Club",
    "color": "#a855f7",
    "description": "Entra in un Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_joined"
  },
  {
    "id": "club_grind5",
    "name": "⚔️ Club Warrior",
    "color": "#c084fc",
    "description": "5 vittorie per il Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_wins5"
  },
  {
    "id": "club_grind25",
    "name": "🏅 Club Champion",
    "color": "#d8b4fe",
    "description": "25 vittorie per il Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_wins25"
  },
  {
    "id": "club_legend",
    "name": "🌟 Club Legend",
    "color": "#f0abfc",
    "description": "100 vittorie per il Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_wins100"
  },
  {
    "id": "club_mission1",
    "name": "📋 Missione Compiuta",
    "color": "#a855f7",
    "description": "Completa 1 missione Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_mission1"
  },
  {
    "id": "club_mission10",
    "name": "🎖️ Cacciatore di Missioni",
    "color": "#c084fc",
    "description": "Completa 10 missioni Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_mission10"
  },
  {
    "id": "club_boost",
    "name": "⚡ Potenziato dal Club",
    "color": "#e879f9",
    "description": "Usa un boost MMR Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_boost_used"
  },
  {
    "id": "club_founder",
    "name": "👑 Fondatore",
    "color": "#fbbf24",
    "description": "Fondi il tuo primo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_founder"
  },
  {
    "id": "ucs1",
    "name": "👑 ELITE UCS",
    "color": "#e8e8e8",
    "description": "Primo trionfo UCS",
    "category": "ucs",
    "rarity": "mythic",
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
    "feat": "ucs_ten_w4",
    "anim": "title-animated-anomaly"
  },
  {
    "id": "rlcs1",
    "name": "🌱 Open Qualifier",
    "color": "#9ca3af",
    "description": "Completa il tuo primo Open Qualifier UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_1"
  },
  {
    "id": "rlcs2",
    "name": "🔢 Top 128 Seed",
    "color": "#a3b4c4",
    "description": "Vinci 3 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_2"
  },
  {
    "id": "rlcs3",
    "name": "🎯 Top 64 Contender",
    "color": "#b0c4d8",
    "description": "Vinci 7 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_3"
  },
  {
    "id": "rlcs4",
    "name": "⚡ Closed Qualifier Finalist",
    "color": "#7dd3fc",
    "description": "Vinci 12 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_4"
  },
  {
    "id": "rlcs5",
    "name": "🏟️ Main Event Rookie",
    "color": "#38bdf8",
    "description": "Vinci 20 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_5"
  },
  {
    "id": "rlcs6",
    "name": "🔴 Regional Round 1",
    "color": "#f97316",
    "description": "Vinci 30 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_6"
  },
  {
    "id": "rlcs7",
    "name": "⚔️ Regional Quarter-finalist",
    "color": "#fb923c",
    "description": "Vinci 45 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_7"
  },
  {
    "id": "rlcs8",
    "name": "🥊 Regional Semi-finalist",
    "color": "#fdba74",
    "description": "Vinci 65 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_8"
  },
  {
    "id": "rlcs9",
    "name": "🏅 Regional Finalist",
    "color": "#fcd34d",
    "description": "Vinci 90 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_9"
  },
  {
    "id": "rlcs10",
    "name": "🏆 Regional Champion",
    "color": "#f59e0b",
    "description": "Vinci 120 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_10"
  },
  {
    "id": "rlcs11",
    "name": "🎟️ Major Qualified",
    "color": "#a78bfa",
    "description": "Vinci 160 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_11"
  },
  {
    "id": "rlcs12",
    "name": "🏛️ Major Group Stage",
    "color": "#8b5cf6",
    "description": "Vinci 200 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_12"
  },
  {
    "id": "rlcs13",
    "name": "⚡ Major Playoffs",
    "color": "#7c3aed",
    "description": "Vinci 250 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_13"
  },
  {
    "id": "rlcs14",
    "name": "🥈 Major Finalist",
    "color": "#c084fc",
    "description": "Vinci 310 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_14"
  },
  {
    "id": "rlcs15",
    "name": "🥇 Major Champion",
    "color": "#e879f9",
    "description": "Vinci 380 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_15"
  },
  {
    "id": "rlcs16",
    "name": "🌍 World Championship Wildcard",
    "color": "#f43f5e",
    "description": "Vinci 460 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_16"
  },
  {
    "id": "rlcs17",
    "name": "💫 Worlds Group Stage Elite",
    "color": "#fb7185",
    "description": "Vinci 550 partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_17"
  },
  {
    "id": "rlcs18",
    "name": "🏹 Worlds Quarter-finalist",
    "color": "#ff4081",
    "description": "Vinci 650 partite UCS + 10 vittorie flawless UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_18"
  },
  {
    "id": "rlcs19",
    "name": "🔥 Worlds Semi-finalist",
    "color": "#00E5FF",
    "description": "Vinci 780 partite UCS + 3 vittorie consecutive senza perdere round",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_19"
  },
  {
    "id": "rlcs20",
    "name": "🌠 Worlds Grand Finalist",
    "color": "#ffffff",
    "description": "Vinci 950 partite UCS + 25 vittorie flawless UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_20"
  },
  {
    "id": "rlcs21",
    "name": "👑 World Champion",
    "color": "#FFD700",
    "description": "Vinci 1100 partite UCS + 50 vittorie flawless UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_21"
  },
  {
    "id": "rlcs22",
    "name": "🌟 Season MVP",
    "color": "#F5C842",
    "description": "Raggiungi 1100 vittorie UCS e 50 +4 in partite UCS",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_22"
  },
  {
    "id": "rlcs23",
    "name": "🐐 GOAT Contender",
    "color": "#c084fc",
    "description": "Completa tutti i titoli UCS precedenti",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_23"
  },
  {
    "id": "rlcs24",
    "name": "🏛️ Hall of Fame",
    "color": "#e8e8e8",
    "description": "Completa tutti i titoli UCS precedenti",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_24"
  },
  {
    "id": "rlcs25",
    "name": "👑 WORLD CHAMPION SUPREME",
    "color": "#FFD700",
    "description": "Raggiungi la vetta assoluta di UCS — tutti i titoli UCS sbloccati",
    "category": "ucs",
    "rarity": "mythic",
    "feat": "ucs_rank_25"
  },
  {
    "id": "uno10",
    "name": "⚡ Scarto Rapido",
    "color": "#fbbf24",
    "description": "Vinci 50 partite di UNO",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_10"
  },
  {
    "id": "uno11",
    "name": "➕ Maestro del +2",
    "color": "#f97316",
    "description": "Gioca 100 carte +2 in totale",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_11"
  },
  {
    "id": "uno12",
    "name": "💀 Incubo del +4",
    "color": "#ef4444",
    "description": "Gioca 50 carte +4 in totale",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_12"
  },
  {
    "id": "uno13",
    "name": "🎨 Muro di Colore",
    "color": "#8b5cf6",
    "description": "Vinci 100 partite di UNO",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_13"
  },
  {
    "id": "uno14",
    "name": "💡 Riflessi di Luce",
    "color": "#06b6d4",
    "description": "Vinci 150 partite di UNO",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_14"
  },
  {
    "id": "uno15",
    "name": "🎯 Tattico dell'Ultima Carta",
    "color": "#10b981",
    "description": "Dì UNO e vinci 30 volte",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_15"
  },
  {
    "id": "uno16",
    "name": "🛡️ Sentinella del Mazzo",
    "color": "#3b82f6",
    "description": "Vinci 200 partite di UNO",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_16"
  },
  {
    "id": "uno17",
    "name": "🦅 Predatore di Turni",
    "color": "#f59e0b",
    "description": "Vinci 300 partite di UNO",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_17"
  },
  {
    "id": "uno18",
    "name": "👻 Ombra del Salto",
    "color": "#6366f1",
    "description": "Usa 200 carte Skip in totale",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_18"
  },
  {
    "id": "uno19",
    "name": "🔄 Tiranno del Cambio Giro",
    "color": "#ec4899",
    "description": "Usa 200 carte Reverse in totale",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_19"
  },
  {
    "id": "uno20",
    "name": "🏗️ Architetto dello Scarto",
    "color": "#14b8a6",
    "description": "Vinci 500 partite di UNO",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_20"
  },
  {
    "id": "uno21",
    "name": "🌟 Leggenda dell'Uno",
    "color": "#f43f5e",
    "description": "Vinci 750 partite di UNO",
    "category": "uno",
    "rarity": "mythic",
    "feat": "uno_rank_21"
  },
  {
    "id": "uno22",
    "name": "🎭 Dominatore Cromatico",
    "color": "#a855f7",
    "description": "Vinci 1000 partite di UNO",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_22"
  },
  {
    "id": "uno23",
    "name": "🌑 Eclissi di Carte",
    "color": "#1e293b",
    "description": "Vinci 1500 partite di UNO",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_23"
  },
  {
    "id": "uno24",
    "name": "👑 Sovrano del Tavolo",
    "color": "#FFD700",
    "description": "Vinci 2000 partite di UNO",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_24"
  },
  {
    "id": "uno25",
    "name": "🃏 DIVINITÀ DI UNO",
    "color": "#ffffff",
    "description": "Raggiungi l'apice assoluto di UNO — 2000 vittorie",
    "category": "uno",
    "rarity": "rare",
    "feat": "uno_rank_25"
  },
  {
    "id": "scala6",
    "name": "🃏 Primo Trittico",
    "color": "#c084fc",
    "description": "Vinci 5 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_6"
  },
  {
    "id": "scala7",
    "name": "🎯 Esperto di Sequenze",
    "color": "#a855f7",
    "description": "Vinci 15 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_7"
  },
  {
    "id": "scala8",
    "name": "🃏 Collezionista di Jolly",
    "color": "#8b5cf6",
    "description": "Completa 20 sequenze con Jolly",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_8"
  },
  {
    "id": "scala9",
    "name": "🧩 Stratega del Pozzo",
    "color": "#7c3aed",
    "description": "Vinci 30 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_9"
  },
  {
    "id": "scala10",
    "name": "🧊 Calcolatore Freddo",
    "color": "#6d28d9",
    "description": "Vinci 50 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_10"
  },
  {
    "id": "scala11",
    "name": "🏁 Maestro della Chiusura",
    "color": "#ddd6fe",
    "description": "Chiudi il mazzo senza pescare 20 volte",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_11"
  },
  {
    "id": "scala12",
    "name": "👑 Re dei Giochi Aperti",
    "color": "#e9d5ff",
    "description": "Vinci 80 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_12"
  },
  {
    "id": "scala13",
    "name": "⚗️ Alchimista di Carte",
    "color": "#f5d0fe",
    "description": "Vinci 120 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_13"
  },
  {
    "id": "scala14",
    "name": "🔮 Visionario del Burraco",
    "color": "#fae8ff",
    "description": "Vinci 180 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_14"
  },
  {
    "id": "scala15",
    "name": "📐 Matematico del 40",
    "color": "#c084fc",
    "description": "Vinci 250 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_15"
  },
  {
    "id": "scala16",
    "name": "🏗️ Architetto di Scale",
    "color": "#a855f7",
    "description": "Vinci 350 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_16"
  },
  {
    "id": "scala17",
    "name": "🃏 Custode del Jolly",
    "color": "#9333ea",
    "description": "Usa 50 Jolly in partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_17"
  },
  {
    "id": "scala18",
    "name": "🐉 Drago delle Sequenze",
    "color": "#7e22ce",
    "description": "Vinci 500 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_18"
  },
  {
    "id": "scala19",
    "name": "🧠 Mente Superiore",
    "color": "#6b21a8",
    "description": "Vinci 700 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_19"
  },
  {
    "id": "scala20",
    "name": "🎯 Infallibile",
    "color": "#e9d5ff",
    "description": "Vinci 1000 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_20"
  },
  {
    "id": "scala21",
    "name": "🎓 Gran Maestro di Scala",
    "color": "#d8b4fe",
    "description": "Vinci 1500 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_21"
  },
  {
    "id": "scala22",
    "name": "💀 Terrore del Mazzo",
    "color": "#f0abfc",
    "description": "Vinci 2000 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_22"
  },
  {
    "id": "scala23",
    "name": "🌄 Zenith delle Carte",
    "color": "#FFD700",
    "description": "Vinci 2500 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_23"
  },
  {
    "id": "scala24",
    "name": "♾️ Infinito Quadrato",
    "color": "#ffffff",
    "description": "Vinci 3000 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_24"
  },
  {
    "id": "scala25",
    "name": "👑 IMPERATORE DI SCALA",
    "color": "#c084fc",
    "description": "Raggiungi il massimo di Scala 40 — 3000 vittorie",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_rank_25"
  },
  {
    "id": "ruba6",
    "name": "🖐️ Mano Lesta",
    "color": "#22D3EE",
    "description": "Vinci 5 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_6"
  },
  {
    "id": "ruba7",
    "name": "🃏 Ladro di Mazzi Pro",
    "color": "#06b6d4",
    "description": "Vinci 15 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_7"
  },
  {
    "id": "ruba8",
    "name": "💎 Rapina Perfetta",
    "color": "#0891b2",
    "description": "Ruba 50 mazzetti totali",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_8"
  },
  {
    "id": "ruba9",
    "name": "🌙 Predatore Notturno",
    "color": "#164e63",
    "description": "Vinci 30 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_9"
  },
  {
    "id": "ruba10",
    "name": "📦 Accumulatore Seriale",
    "color": "#67e8f9",
    "description": "Vinci 50 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_10"
  },
  {
    "id": "ruba11",
    "name": "💀 Terrore dei Punti",
    "color": "#22D3EE",
    "description": "Vinci 80 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_11"
  },
  {
    "id": "ruba12",
    "name": "👑 Re del Furto",
    "color": "#0e7490",
    "description": "Ruba 200 mazzetti totali",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_12"
  },
  {
    "id": "ruba13",
    "name": "👤 Ombra Invisibile",
    "color": "#155e75",
    "description": "Vinci 120 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_13"
  },
  {
    "id": "ruba14",
    "name": "💰 Colpo Grosso",
    "color": "#cffafe",
    "description": "Vinci 180 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_14"
  },
  {
    "id": "ruba15",
    "name": "🦅 Sguardo d'Aquila",
    "color": "#a5f3fc",
    "description": "Vinci 250 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_15"
  },
  {
    "id": "ruba16",
    "name": "🦅 Rapace del Tavolo",
    "color": "#7dd3fc",
    "description": "Ruba 500 mazzetti totali",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_16"
  },
  {
    "id": "ruba17",
    "name": "🏴‍☠️ Bandito delle Carte",
    "color": "#38bdf8",
    "description": "Vinci 350 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_17"
  },
  {
    "id": "ruba18",
    "name": "💼 Maestro del Bottino",
    "color": "#0ea5e9",
    "description": "Vinci 500 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_18"
  },
  {
    "id": "ruba19",
    "name": "🌬️ Inafferrabile",
    "color": "#0369a1",
    "description": "Vinci 700 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_19"
  },
  {
    "id": "ruba20",
    "name": "👹 Tiranno del Mazzo",
    "color": "#075985",
    "description": "Ruba 1000 mazzetti totali",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_20"
  },
  {
    "id": "ruba21",
    "name": "🎩 Erede di Lupin",
    "color": "#e0f2fe",
    "description": "Vinci 1000 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_21"
  },
  {
    "id": "ruba22",
    "name": "🌟 Dominatore dei Punti",
    "color": "#bae6fd",
    "description": "Vinci 1500 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_22"
  },
  {
    "id": "ruba23",
    "name": "⚡ Leggenda del Furto",
    "color": "#7dd3fc",
    "description": "Ruba 2000 mazzetti totali",
    "category": "ruba",
    "rarity": "mythic",
    "feat": "ruba_rank_23"
  },
  {
    "id": "ruba24",
    "name": "👻 Fantasma del Mazzo",
    "color": "#ffffff",
    "description": "Vinci 2000 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_24"
  },
  {
    "id": "ruba25",
    "name": "👑 RE DEI LADRI",
    "color": "#22D3EE",
    "description": "Il dominio assoluto del Ruba Mazzetto — 2000 vittorie",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_rank_25"
  },
  {
    "id": "bj7",
    "name": "💸 Scommettitore Audace",
    "color": "#34D399",
    "description": "Vinci 10 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_7"
  },
  {
    "id": "bj8",
    "name": "🎯 Occhio al 21",
    "color": "#10b981",
    "description": "Raggiungi 21 esatto 10 volte",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_8"
  },
  {
    "id": "bj9",
    "name": "🧊 Freddezza del Dealer",
    "color": "#059669",
    "description": "Vinci 30 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_9"
  },
  {
    "id": "bj10",
    "name": "🔱 Raddoppio d'Oro",
    "color": "#047857",
    "description": "Usa il raddoppio 20 volte con successo",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_10"
  },
  {
    "id": "bj11",
    "name": "📊 Strategia di Base",
    "color": "#065f46",
    "description": "Vinci 50 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_11"
  },
  {
    "id": "bj12",
    "name": "🏰 Assedio al Banco",
    "color": "#6ee7b7",
    "description": "Batti il banco 30 volte di fila",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_12"
  },
  {
    "id": "bj13",
    "name": "🔮 Intuizione Vincente",
    "color": "#a7f3d0",
    "description": "Vinci 80 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_13"
  },
  {
    "id": "bj14",
    "name": "🎰 Mente da Casinò",
    "color": "#d1fae5",
    "description": "Vinci 120 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_14"
  },
  {
    "id": "bj15",
    "name": "🦈 Squalo del Blackjack",
    "color": "#34D399",
    "description": "Vinci 200 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_15"
  },
  {
    "id": "bj16",
    "name": "💎 High Roller",
    "color": "#10b981",
    "description": "Vinci 300 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_16"
  },
  {
    "id": "bj17",
    "name": "🃏 Asso nella Manica",
    "color": "#059669",
    "description": "Fai 20 Blackjack naturali",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_17"
  },
  {
    "id": "bj18",
    "name": "🎩 Colpo da Maestro",
    "color": "#047857",
    "description": "Vinci 500 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_18"
  },
  {
    "id": "bj19",
    "name": "📐 Architetto del 21",
    "color": "#065f46",
    "description": "Vinci 700 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_19"
  },
  {
    "id": "bj20",
    "name": "💥 Distruttore del Banco",
    "color": "#6ee7b7",
    "description": "Vinci 1000 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_20"
  },
  {
    "id": "bj21",
    "name": "🎰 Leggenda di Vegas",
    "color": "#a7f3d0",
    "description": "Vinci 1500 partite di Blackjack",
    "category": "blackjack",
    "rarity": "mythic",
    "feat": "bj_rank_21"
  },
  {
    "id": "bj22",
    "name": "♠️ Re delle Chip",
    "color": "#FFD700",
    "description": "Vinci 2000 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_22"
  },
  {
    "id": "bj23",
    "name": "⚡ Sfidante Supremo",
    "color": "#f43f5e",
    "description": "Fai 50 Blackjack naturali",
    "category": "blackjack",
    "rarity": "mythic",
    "feat": "bj_rank_23"
  },
  {
    "id": "bj24",
    "name": "🃏 Anima d'Azzardo",
    "color": "#ffffff",
    "description": "Vinci 2500 partite di Blackjack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_24"
  },
  {
    "id": "bj25",
    "name": "👑 DIO DEL 21",
    "color": "#34D399",
    "description": "Il vertice assoluto del Blackjack — 2500 vittorie + 50 naturali",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_rank_25"
  },
  {
    "id": "rank24",
    "name": "⚡ Semidio dell'Olimpo",
    "color": "#c084fc",
    "description": "Vinci 500 partite ranked e raggiungi Grande Campione",
    "category": "rank",
    "rarity": "common",
    "feat": "rank_prog_24"
  },
  {
    "id": "rank25",
    "name": "🌌 ENTITÀ SUPREMA",
    "color": "#ffffff",
    "description": "Raggiungi SSL (1600+ MMR) e vinci 1000 partite ranked",
    "category": "rank",
    "rarity": "mythic",
    "feat": "rank_prog_25"
  },
  {
    "id": "clubp9",
    "name": "💎 Membro d'Élite",
    "color": "#a855f7",
    "description": "Vinci 200 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_9"
  },
  {
    "id": "clubp10",
    "name": "🤝 Socio d'Onore",
    "color": "#9333ea",
    "description": "Vinci 300 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_10"
  },
  {
    "id": "clubp11",
    "name": "💰 Investitore di Prestigio",
    "color": "#7e22ce",
    "description": "Vinci 450 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_11"
  },
  {
    "id": "clubp12",
    "name": "🏛️ Pilastro del Club",
    "color": "#6b21a8",
    "description": "Vinci 600 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_12"
  },
  {
    "id": "clubp13",
    "name": "💎 VIP Platinum",
    "color": "#d8b4fe",
    "description": "Vinci 800 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_13"
  },
  {
    "id": "clubp14",
    "name": "💎 Magnate delle Gemme",
    "color": "#c084fc",
    "description": "Vinci 1000 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_14"
  },
  {
    "id": "clubp15",
    "name": "🔮 Visionario del Club",
    "color": "#a855f7",
    "description": "Vinci 1300 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_15"
  },
  {
    "id": "clubp16",
    "name": "🗝️ Custode del Segreto",
    "color": "#9333ea",
    "description": "Completa 50 missioni Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_16"
  },
  {
    "id": "clubp17",
    "name": "🌟 Ambasciatore d'Oro",
    "color": "#fbbf24",
    "description": "Vinci 1600 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_17"
  },
  {
    "id": "clubp18",
    "name": "🏗️ Architetto dell'Ordine",
    "color": "#f59e0b",
    "description": "Vinci 2000 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_18"
  },
  {
    "id": "clubp19",
    "name": "✨ Eletto del Club",
    "color": "#fde68a",
    "description": "Completa 100 missioni Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_19"
  },
  {
    "id": "clubp20",
    "name": "🎭 Patrono delle Arti",
    "color": "#fef3c7",
    "description": "Vinci 2500 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_20"
  },
  {
    "id": "clubp21",
    "name": "🌫️ Eminenza Grigia",
    "color": "#d1d5db",
    "description": "Vinci 3000 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_21"
  },
  {
    "id": "clubp22",
    "name": "👑 Sovrano del Circolo",
    "color": "#FFD700",
    "description": "Vinci 4000 partite per il tuo Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_22"
  },
  {
    "id": "clubp23",
    "name": "🏋️ Titano del Prestigio",
    "color": "#c084fc",
    "description": "Completa 200 missioni Club",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_23"
  },
  {
    "id": "clubp24",
    "name": "📜 Leggenda del Club",
    "color": "#e9d5ff",
    "description": "Vinci 5000 partite per il tuo Club",
    "category": "club",
    "rarity": "mythic",
    "feat": "club_rank_24"
  },
  {
    "id": "clubp25",
    "name": "🏰 FONDATORE ETERNO",
    "color": "#ffffff",
    "description": "Il massimo onore del Club — 5000 vittorie + 200 missioni",
    "category": "club",
    "rarity": "rare",
    "feat": "club_rank_25"
  },
  {
    "id": "multi2",
    "name": "🧳 Primo Viaggiatore",
    "color": "#F5C842",
    "description": "Vinci in 2 modalità diverse",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_2"
  },
  {
    "id": "multi3",
    "name": "🗺️ Esploratore di Modalità",
    "color": "#fbbf24",
    "description": "Vinci in 3 modalità diverse",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_3"
  },
  {
    "id": "multi4",
    "name": "🦎 Adattabile",
    "color": "#f59e0b",
    "description": "Vinci in 4 modalità diverse",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_4"
  },
  {
    "id": "multi5",
    "name": "🦎 Camaleonte del Gioco",
    "color": "#d97706",
    "description": "Vinci in tutte le 5+ modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_5"
  },
  {
    "id": "multi6",
    "name": "🔧 Versatile",
    "color": "#b45309",
    "description": "Vinci 10 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_6"
  },
  {
    "id": "multi7",
    "name": "🌪️ Maestro del Caos",
    "color": "#92400e",
    "description": "Vinci 25 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_7"
  },
  {
    "id": "multi8",
    "name": "🧿 Onnisciente",
    "color": "#fef3c7",
    "description": "Vinci 50 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_8"
  },
  {
    "id": "multi9",
    "name": "💎 Poliedrico",
    "color": "#fde68a",
    "description": "Vinci 100 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_9"
  },
  {
    "id": "multi10",
    "name": "🚶 Viandante dei Mazzi",
    "color": "#fcd34d",
    "description": "Vinci 150 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_10"
  },
  {
    "id": "multi11",
    "name": "🔬 Sperimentatore",
    "color": "#fbbf24",
    "description": "Vinci 250 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_11"
  },
  {
    "id": "multi12",
    "name": "♾️ Signore delle Varianti",
    "color": "#f59e0b",
    "description": "Vinci 400 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_12"
  },
  {
    "id": "multi13",
    "name": "🧬 Genio Multitasking",
    "color": "#d97706",
    "description": "Vinci 600 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_13"
  },
  {
    "id": "multi14",
    "name": "🌊 Dominatore del Flusso",
    "color": "#b45309",
    "description": "Vinci 900 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_14"
  },
  {
    "id": "multi15",
    "name": "🌍 Conquistatore Globale",
    "color": "#92400e",
    "description": "Vinci 1200 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_15"
  },
  {
    "id": "multi16",
    "name": "🧠 Mente Universale",
    "color": "#fef3c7",
    "description": "Vinci 1500 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_16"
  },
  {
    "id": "multi17",
    "name": "💥 Distruttore di Regole",
    "color": "#fde68a",
    "description": "Vinci 2000 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_17"
  },
  {
    "id": "multi18",
    "name": "🌌 Viaggiatore Dimensionale",
    "color": "#fcd34d",
    "description": "Vinci 2500 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_18"
  },
  {
    "id": "multi19",
    "name": "🏗️ Architetto del Multiverso",
    "color": "#F5C842",
    "description": "Vinci 3000 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_19"
  },
  {
    "id": "multi20",
    "name": "🎓 Maestro di Ogni Cosa",
    "color": "#f59e0b",
    "description": "Vinci 4000 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_20"
  },
  {
    "id": "multi21",
    "name": "⚡ Leggenda Ibrida",
    "color": "#fbbf24",
    "description": "Vinci 5000 partite in ogni modalità",
    "category": "multi",
    "rarity": "mythic",
    "feat": "multi_rank_21"
  },
  {
    "id": "multi22",
    "name": "🎭 Avatar del Gioco",
    "color": "#FFD700",
    "description": "Vinci 7000 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_22"
  },
  {
    "id": "multi23",
    "name": "🌐 Onnipresente",
    "color": "#c084fc",
    "description": "Vinci 10000 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_23"
  },
  {
    "id": "multi24",
    "name": "📚 Colui che Tutto Sa",
    "color": "#e9d5ff",
    "description": "Vinci 15000 partite in ogni modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_24"
  },
  {
    "id": "multi25",
    "name": "🌌 MAESTRO DEL MULTIVERSO",
    "color": "#ffffff",
    "description": "La leggenda assoluta di tutte le modalità — 15000 vittorie ovunque",
    "category": "multi",
    "rarity": "epic",
    "feat": "multi_rank_25"
  },
  {
    "id": "rm1",
    "name": "🃏 Ladro di Mazzi",
    "color": "#22D3EE",
    "description": "Vinci 1 partita di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_win1"
  },
  {
    "id": "rm2",
    "name": "🃏 Re del Furto",
    "color": "#22D3EE",
    "description": "Vinci 10 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_win10"
  },
  {
    "id": "rm3",
    "name": "🃏 Maestro Ruba",
    "color": "#00b4d8",
    "description": "Vinci 50 partite di Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_win50"
  },
  {
    "id": "rmt1",
    "name": "🏆 Campione Ruba 32",
    "color": "#FFD700",
    "description": "Vinci il Torneo 32 Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_tourney_champ"
  },
  {
    "id": "rmt2",
    "name": "🥇 Dominatore Furto",
    "color": "#FFD700",
    "description": "Vinci 3 tornei Ruba Mazzetto",
    "category": "ruba",
    "rarity": "rare",
    "feat": "ruba_tourney_3x"
  },
  {
    "id": "sc1",
    "name": "🎴 Scalatore",
    "color": "#c084fc",
    "description": "Vinci 1 partita di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_win1"
  },
  {
    "id": "sc2",
    "name": "🎴 Re della Scala",
    "color": "#c084fc",
    "description": "Vinci 10 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_win10"
  },
  {
    "id": "sc3",
    "name": "🎴 Maestro Scala 40",
    "color": "#a855f7",
    "description": "Vinci 50 partite di Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_win50"
  },
  {
    "id": "sct1",
    "name": "🏆 Campione Scala 32",
    "color": "#c084fc",
    "description": "Vinci il Torneo 32 Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_tourney_champ"
  },
  {
    "id": "sct2",
    "name": "👑 Gran Maestro Scala",
    "color": "#a855f7",
    "description": "Vinci 3 tornei Scala 40",
    "category": "scala40",
    "rarity": "rare",
    "feat": "scala_tourney_3x"
  },
  {
    "id": "mx1",
    "name": "🎖️ Giocatore Totale",
    "color": "#F5C842",
    "description": "Vinci in tutte le 6 modalità",
    "category": "multi",
    "rarity": "epic",
    "feat": "all_modes_win"
  },
  {
    "id": "bj1",
    "name": "🂡 Principiante BJ",
    "color": "#34D399",
    "description": "Vinci 1 partita di Black Jack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_win1"
  },
  {
    "id": "bj2",
    "name": "🂡 Mano Fortunata",
    "color": "#34D399",
    "description": "Vinci 10 partite di Black Jack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_win10"
  },
  {
    "id": "bj3",
    "name": "🂡 Contatore di Carte",
    "color": "#10b981",
    "description": "Vinci 50 partite di Black Jack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_win50"
  },
  {
    "id": "bj4",
    "name": "🂡 Il Baro",
    "color": "#6ee7b7",
    "description": "Fai 5 Blackjack naturali",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_blackjack5"
  },
  {
    "id": "bj5",
    "name": "🂡 Sfida al Banco",
    "color": "#00E5FF",
    "description": "Batti il banco con 21 esatti",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_beat_dealer"
  },
  {
    "id": "bjt1",
    "name": "🏆 Campione BJ 32",
    "color": "#FFD700",
    "description": "Vinci il Torneo 32 Black Jack",
    "category": "blackjack",
    "rarity": "rare",
    "feat": "bj_tourney_champ"
  },
  {
    "id": "bp_lv5",
    "name": "⚡ Iniziato del Pass",
    "color": "#9ca3af",
    "description": "Sblocca al livello 5 del Battle Pass.",
    "category": "battlepass",
    "rarity": "epic",
    "feat": "bp_lv5"
  },
  {
    "id": "bp_lv10",
    "name": "🔥 Percorso Acceso",
    "color": "#fb923c",
    "description": "Sblocca al livello 10 del Battle Pass.",
    "category": "battlepass",
    "rarity": "epic",
    "feat": "bp_lv10"
  },
  {
    "id": "bp_lv15",
    "name": "💎 Portatore del Pass",
    "color": "#7EE4F8",
    "description": "Sblocca al livello 15 del Battle Pass.",
    "category": "battlepass",
    "rarity": "epic",
    "feat": "bp_lv15"
  },
  {
    "id": "bp_lv20",
    "name": "🌟 Veterano della Stagione",
    "color": "#F5C842",
    "description": "Sblocca al livello 20 del Battle Pass.",
    "category": "battlepass",
    "rarity": "epic",
    "feat": "bp_lv20"
  },
  {
    "id": "bp_lv25",
    "name": "👑 SIGNORE DEL PASS",
    "color": "#ffffff",
    "description": "Sblocca al livello 25 del Battle Pass.",
    "category": "battlepass",
    "rarity": "epic",
    "feat": "bp_lv25"
  }
] as const;

export const LEGACY_TITLES_BY_ID: Readonly<Record<string, LegacyTitleDefinition>> = Object.fromEntries(
  LEGACY_TITLES.map((t) => [t.id, t]),
);

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
