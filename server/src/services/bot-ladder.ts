// ============================================================
// UNO ULTRA Server — Living Bot Ladder & ±5 Top-100 Rivals Matchmaker
// (Maintains persistent 220-bot archive #1..#220 per bucket,
//  simulates organic movement over time, matches ±5 in Top 100
//  or #101+ MMR-closest outside Top 100, and settles rival MMR)
// ============================================================

import {
  calculateEloDelta,
  getRankFromMMR,
  pickPrestigiousTitleForMMR,
  REALISTIC_BOT_PROFILES,
  type GameMode,
} from '@uno/shared';
import { env } from '../config/env.js';
import {
  readDevState,
  updateDevState,
  type DevBotLadderBucket,
  type DevBotLadderEntry,
} from '../persistence/postgres/dev-store.js';

export type LadderMode = 'global' | GameMode;
export type LadderPlayerCount = 2 | 3 | 4;

export interface LadderEntryLike {
  rank: number;
  playerId: string;
  username: string;
  mmr: number;
  rankTier: string;
  wins: number;
  winRate: number;
  title: string;
  titleColor?: string;
  isBot?: boolean;
  avatarId?: string;
  frameId?: string;
  cardBackId?: string;
}

export interface MatchedRivalInfo {
  readonly botId: string;
  readonly rank: number;
  readonly username: string;
  readonly mmr: number;
  readonly rankTier: string;
  readonly title: string;
  readonly titleColor: string;
  readonly avatarId: string;
  readonly frameId: string;
  readonly cardBackId: string;
}

export interface MatchedRivalsResult {
  readonly inTop100: boolean;
  readonly playerRank: number;
  readonly window: { readonly min: number; readonly max: number } | null;
  readonly rivals: readonly MatchedRivalInfo[];
}

const SIMULATION_INTERVAL_MS = 45_000;
const BOT_AVATAR_POOL = [
  'avatar_default',
  'avatar_neon_fox',
  'avatar_cyber_dragon',
  'avatar_chrono_ace',
] as const;
const BOT_CARDBACK_POOL = ['back_default', 'back_arcade_grid', 'back_obsidian_holo'] as const;

const EXTENDED_PREFIX_ICONS = [
  '🛰️',
  '⚙️',
  '💎',
  '⚡',
  '☄️',
  '🛡️',
  '🧿',
  '🎯',
  '🕹️',
  '🔥',
] as const;

const EXTENDED_ROOTS = [
  'OrbitZero',
  'PulseByte',
  'NovaShard',
  'VeloceX',
  'KryoLux',
  'DriftRay',
  'SparkNode',
  'HexaCore',
  'BetaFang',
  'CobaltRun',
  'DeltaDeck',
  'EchoAce',
  'FluxKnight',
  'GigaCard',
  'HaloTwin',
  'IonStorm',
  'JadePulse',
  'KiloStar',
  'LumenEdge',
  'MacroBit',
  'NeonKite',
  'OnyxLoop',
  'PixelWing',
  'QuarkSpin',
  'RiftSpark',
] as const;

const EXTENDED_SUFFIXES = ['7', '11', '21', '99'] as const;

/** 100 bot extra (posizioni #121..#220 nell'archivio server, sotto la Top 100). */
const EXTENDED_ARCHIVE_BOTS: readonly string[] = (() => {
  const existingLower = new Set(REALISTIC_BOT_PROFILES.map((b) => b.name.toLowerCase()));
  const list: string[] = [];
  for (let i = 0; i < 100; i++) {
    const icon = EXTENDED_PREFIX_ICONS[i % EXTENDED_PREFIX_ICONS.length]!;
    const root = EXTENDED_ROOTS[i % EXTENDED_ROOTS.length]!;
    const suffix = EXTENDED_SUFFIXES[Math.floor(i / EXTENDED_ROOTS.length) % EXTENDED_SUFFIXES.length]!;
    let candidate = `${icon} ${root}${suffix}`;
    if (existingLower.has(candidate.toLowerCase())) {
      candidate = `${icon} ${root}_${i + 1}`;
    }
    existingLower.add(candidate.toLowerCase());
    list.push(candidate);
  }
  return list;
})();

const memoryBotLadders = new Map<string, DevBotLadderBucket>();

function deterministicHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export function formatBotLadderBucketKey(
  mode: LadderMode,
  playerCount?: LadderPlayerCount,
): string {
  if (mode === 'global') return 'global';
  return `${mode}:${playerCount ?? 4}p`;
}

function createInitialBucket(bucketKey: string): DevBotLadderBucket {
  const seedOffset = deterministicHash(bucketKey);
  const safeKey = bucketKey.replace(/[^a-z0-9_-]/gi, '_');
  const bots: Record<string, DevBotLadderEntry> = {};

  // 1) Top 120 bot realistici (#1..#120): range ~2260 → ~980 MMR
  const totalReal = REALISTIC_BOT_PROFILES.length;
  for (let i = 0; i < totalReal; i++) {
    const src = REALISTIC_BOT_PROFILES[(i + (seedOffset % 17)) % totalReal]!;
    const botId = `lbot_${safeKey}_${i}`;
    const rawMmr = Math.round(src.baseMmr - i * 4.8 + ((seedOffset + i * 13) % 21) - 10);
    const mmr = Math.max(980, Math.min(2260, rawMmr));
    const wins = Math.max(18, Math.round((mmr - 120) / 5.5 + ((seedOffset + i) % 12)));
    const losses = Math.max(8, Math.round(wins * (0.42 + (2260 - mmr) / 3600)));
    bots[botId] = {
      botId,
      username: src.name,
      mmr,
      wins,
      losses,
      avatarId: BOT_AVATAR_POOL[(i + seedOffset) % BOT_AVATAR_POOL.length] ?? 'avatar_default',
      frameId:
        mmr >= 1900 ? 'frame_ssl_prism' : mmr >= 1350 ? 'frame_gold_pulse' : 'frame_default',
      cardBackId:
        BOT_CARDBACK_POOL[(i + seedOffset) % BOT_CARDBACK_POOL.length] ?? 'back_default',
    };
  }

  // 2) Archivio esteso #121..#220: ~970 → ~35 MMR per matchmaking fuori Top 100
  for (let j = 0; j < EXTENDED_ARCHIVE_BOTS.length; j++) {
    const idx = totalReal + j;
    const botId = `lbot_${safeKey}_${idx}`;
    const jitter = ((seedOffset + j * 19) % 15) - 7;
    const mmr = Math.max(30, Math.min(975, Math.round(970 - j * 9.3 + jitter)));
    const wins = Math.max(1, Math.round(mmr / 14 + (j % 5)));
    const losses = Math.max(2, Math.round(wins * 1.05 + 3));
    bots[botId] = {
      botId,
      username: EXTENDED_ARCHIVE_BOTS[j]!,
      mmr,
      wins,
      losses,
      avatarId: BOT_AVATAR_POOL[(idx + seedOffset) % BOT_AVATAR_POOL.length] ?? 'avatar_default',
      frameId: mmr >= 1350 ? 'frame_gold_pulse' : 'frame_default',
      cardBackId:
        BOT_CARDBACK_POOL[(idx + seedOffset) % BOT_CARDBACK_POOL.length] ?? 'back_default',
    };
  }

  return {
    lastSimulatedAtMs: Date.now(),
    bots,
  };
}

function getOrCreateBucket(bucketKey: string): DevBotLadderBucket {
  if (env.NODE_ENV !== 'production') {
    const existingDev = readDevState().botLadders[bucketKey];
    if (existingDev && Object.keys(existingDev.bots).length >= 200) {
      memoryBotLadders.set(bucketKey, existingDev);
      return existingDev;
    }
    const created = createInitialBucket(bucketKey);
    updateDevState((state) => {
      state.botLadders[bucketKey] = created;
    });
    memoryBotLadders.set(bucketKey, created);
    return created;
  }

  const cached = memoryBotLadders.get(bucketKey);
  if (cached) return cached;
  const created = createInitialBucket(bucketKey);
  memoryBotLadders.set(bucketKey, created);
  return created;
}

function saveBucket(bucketKey: string, bucket: DevBotLadderBucket): void {
  memoryBotLadders.set(bucketKey, bucket);
  if (env.NODE_ENV !== 'production') {
    try {
      updateDevState((state) => {
        state.botLadders[bucketKey] = bucket;
      });
    } catch {
      // non-fatal
    }
  }
}

/**
 * Simula scontri tra coppie di bot adiacenti in classifica per mantenere la Top 100 viva:
 * i bot guadagnano e perdono punti salendo e scendendo di posizione nel tempo.
 */
export function tickBotLadderSimulation(
  bucketKey: string,
  opts?: { force?: boolean; seed?: number },
): { simulated: boolean; updatedBots: number } {
  const bucket = getOrCreateBucket(bucketKey);
  const now = Date.now();
  if (!opts?.force && now - bucket.lastSimulatedAtMs < SIMULATION_INTERVAL_MS) {
    return { simulated: false, updatedBots: 0 };
  }

  const ordered = Object.values(bucket.bots).sort((a, b) => b.mmr - a.mmr);
  if (ordered.length < 4) return { simulated: false, updatedBots: 0 };

  const tickSeed =
    opts?.seed ?? ((Math.floor(now / 1000) ^ deterministicHash(bucketKey)) >>> 0);
  let updated = 0;

  // Simula ~18 incontri distribuiti su tutta la scala (#1..#220)
  for (let k = 0; k < 18; k++) {
    const baseIdx = ((tickSeed * 7 + k * 13) % (ordered.length - 3)) >>> 0;
    const gap = 1 + ((tickSeed + k) % 3);
    const botA = ordered[baseIdx]!;
    const botB = ordered[Math.min(ordered.length - 1, baseIdx + gap)]!;
    if (botA.botId === botB.botId) continue;

    // Esito pesato leggermente con componente casuale/uptime così i sorpassi avvengono davvero
    const aWins = ((tickSeed + k * 17 + botA.wins) & 1) === 0;
    const eloA = calculateEloDelta({
      playerMMR: botA.mmr,
      opponentMMR: botB.mmr,
      won: aWins,
    });
    const eloB = calculateEloDelta({
      playerMMR: botB.mmr,
      opponentMMR: botA.mmr,
      won: !aWins,
    });

    botA.mmr = Math.max(20, Math.min(2350, eloA.newMMR));
    botB.mmr = Math.max(20, Math.min(2350, eloB.newMMR));
    if (aWins) {
      botA.wins += 1;
      botB.losses += 1;
    } else {
      botB.wins += 1;
      botA.losses += 1;
    }
    updated += 2;
  }

  bucket.lastSimulatedAtMs = now;
  saveBucket(bucketKey, bucket);
  return { simulated: true, updatedBots: updated };
}

function toBotLeaderboardEntry(
  bot: DevBotLadderEntry,
  mode: LadderMode,
  seedOffset: number,
  idx: number,
): LadderEntryLike {
  const totalGames = Math.max(1, bot.wins + bot.losses);
  const winRate = Math.max(35, Math.min(86, Math.round((bot.wins / totalGames) * 100)));
  const titleDef = pickPrestigiousTitleForMMR(
    bot.mmr,
    mode === 'global' ? undefined : mode,
    seedOffset + idx,
  );
  return {
    rank: 0,
    playerId: bot.botId,
    username: bot.username,
    mmr: bot.mmr,
    rankTier: getRankFromMMR(bot.mmr),
    wins: bot.wins,
    winRate,
    title: titleDef.name,
    titleColor: titleDef.color,
    isBot: true,
    avatarId: bot.avatarId,
    frameId: bot.frameId,
    cardBackId: bot.cardBackId,
  };
}

/**
 * Unisce giocatori umani + archivio completo di 220 bot persistenti, ordina e assegna rank 1..N.
 */
export function buildFullRankedLadder(input: {
  mode: LadderMode;
  playerCount?: LadderPlayerCount;
  realEntries: readonly LadderEntryLike[];
  simulate?: boolean;
}): LadderEntryLike[] {
  const bucketKey = formatBotLadderBucketKey(input.mode, input.playerCount);
  if (input.simulate !== false) {
    tickBotLadderSimulation(bucketKey);
  }
  const bucket = getOrCreateBucket(bucketKey);
  const seedOffset = deterministicHash(bucketKey);

  const seenLower = new Set<string>();
  const combined: LadderEntryLike[] = [];

  for (const human of input.realEntries) {
    const key = human.username.toLowerCase();
    if (seenLower.has(key)) continue;
    seenLower.add(key);
    combined.push({ ...human, isBot: false });
  }

  const bots = Object.values(bucket.bots);
  for (let i = 0; i < bots.length; i++) {
    const b = bots[i]!;
    if (seenLower.has(b.username.toLowerCase())) continue;
    seenLower.add(b.username.toLowerCase());
    combined.push(toBotLeaderboardEntry(b, input.mode, seedOffset, i));
  }

  combined.sort((a, b) => b.mmr - a.mmr || a.username.localeCompare(b.username));
  return combined.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

/**
 * Seleziona i rivali dalla classifica completa:
 * - Se il giocatore è in Top 100 (#1..#100): pesca ESCLUSIVAMENTE nel range [rank-5, rank+5].
 * - Se il giocatore è fuori Top 100 (#101+): pesca dall'archivio server (#101+) vicino al suo MMR.
 */
export function selectMatchedRivalsFromLadder(input: {
  ladder: readonly LadderEntryLike[];
  playerId: string;
  username: string;
  playerMmr: number;
  count: number;
  excludeNames?: ReadonlySet<string>;
}): MatchedRivalsResult {
  const exclude = input.excludeNames ?? new Set<string>();
  const desiredCount = Math.max(1, Math.min(3, input.count));

  // Assicura che il giocatore sia posizionato in classifica col suo MMR reale
  let working: LadderEntryLike[] = input.ladder.filter(
    (e) =>
      e.playerId !== input.playerId &&
      e.username.toLowerCase() !== input.username.toLowerCase(),
  );
  const selfExisting = input.ladder.find(
    (e) =>
      e.playerId === input.playerId ||
      e.username.toLowerCase() === input.username.toLowerCase(),
  );
  working.push({
    rank: 0,
    playerId: input.playerId,
    username: input.username,
    mmr: input.playerMmr,
    rankTier: getRankFromMMR(input.playerMmr),
    wins: selfExisting?.wins ?? 0,
    winRate: selfExisting?.winRate ?? 50,
    title: selfExisting?.title ?? 'Principiante',
    ...(selfExisting?.titleColor ? { titleColor: selfExisting.titleColor } : {}),
    isBot: false,
  });
  working.sort((a, b) => b.mmr - a.mmr || a.username.localeCompare(b.username));
  working = working.map((e, idx) => ({ ...e, rank: idx + 1 }));

  const selfEntry = working.find((e) => e.playerId === input.playerId)!;
  const playerRank = selfEntry.rank;
  const inTop100 = playerRank <= 100;

  let chosen: LadderEntryLike[] = [];
  let window: { min: number; max: number } | null = null;

  if (inTop100) {
    const min = Math.max(1, playerRank - 5);
    const max = Math.min(100, playerRank + 5);
    window = { min, max };
    const inWindow = working
      .filter(
        (e) =>
          e.isBot &&
          e.rank >= min &&
          e.rank <= max &&
          !exclude.has(e.username.toLowerCase()),
      )
      .sort(
        (a, b) =>
          Math.abs(a.rank - playerRank) - Math.abs(b.rank - playerRank) ||
          Math.abs(a.mmr - input.playerMmr) - Math.abs(b.mmr - input.playerMmr),
      );
    chosen = inWindow.slice(0, desiredCount);

    // Solo se nel range ±5 ci fossero meno bot di quelli richiesti (es. molti umani vicini)
    if (chosen.length < desiredCount) {
      const takenIds = new Set(chosen.map((c) => c.playerId));
      const backup = working
        .filter(
          (e) =>
            e.isBot &&
            e.rank <= 100 &&
            !takenIds.has(e.playerId) &&
            !exclude.has(e.username.toLowerCase()),
        )
        .sort((a, b) => Math.abs(a.rank - playerRank) - Math.abs(b.rank - playerRank));
      chosen.push(...backup.slice(0, desiredCount - chosen.length));
    }
  } else {
    // Fuori Top 100 (#101+): pesca bot dall'archivio oltre la 100ª posizione vicini di MMR
    const archivePool = working
      .filter((e) => e.isBot && e.rank > 100 && !exclude.has(e.username.toLowerCase()))
      .sort(
        (a, b) =>
          Math.abs(a.mmr - input.playerMmr) - Math.abs(b.mmr - input.playerMmr) ||
          a.rank - b.rank,
      );
    chosen = archivePool.slice(0, desiredCount);
    if (chosen.length < desiredCount) {
      const takenIds = new Set(chosen.map((c) => c.playerId));
      const fallbackPool = working
        .filter(
          (e) =>
            e.isBot && !takenIds.has(e.playerId) && !exclude.has(e.username.toLowerCase()),
        )
        .sort((a, b) => Math.abs(a.mmr - input.playerMmr) - Math.abs(b.mmr - input.playerMmr));
      chosen.push(...fallbackPool.slice(0, desiredCount - chosen.length));
    }
  }

  return {
    inTop100,
    playerRank,
    window,
    rivals: chosen.map((c) => ({
      botId: c.playerId,
      rank: c.rank,
      username: c.username,
      mmr: c.mmr,
      rankTier: c.rankTier,
      title: c.title,
      titleColor: c.titleColor ?? '#94a3b8',
      avatarId: c.avatarId ?? 'avatar_default',
      frameId: c.frameId ?? 'frame_default',
      cardBackId: c.cardBackId ?? 'back_default',
    })),
  };
}

/**
 * Versione sincrona da cache/dev-store per stanze Colyseus (UnoRoom.startUnoMatch).
 */
export function selectMatchedRivalsSync(input: {
  playerId: string;
  username: string;
  playerMmr?: number;
  mode: GameMode;
  playerCount: LadderPlayerCount;
  count: number;
  excludeNames?: ReadonlySet<string>;
}): MatchedRivalsResult {
  const bucketKey = formatBotLadderBucketKey(input.mode, input.playerCount);
  const realEntries: LadderEntryLike[] = [];
  let resolvedMmr = input.playerMmr;
  if (env.NODE_ENV !== 'production') {
    const dev = readDevState();
    if (resolvedMmr === undefined) {
      resolvedMmr = dev.playlistRanks[input.playerId]?.[bucketKey]?.mmr ?? 0;
    }
    const devBucket = dev.leaderboards[bucketKey] ?? {};
    for (const [id, rec] of Object.entries(devBucket)) {
      realEntries.push({
        rank: 0,
        playerId: id,
        username: rec.username,
        mmr: rec.mmr,
        rankTier: getRankFromMMR(rec.mmr),
        wins: Math.max(1, Math.round(rec.mmr / 24)),
        winRate: 55,
        title: pickPrestigiousTitleForMMR(rec.mmr, input.mode, 0).name,
        isBot: false,
      });
    }
  }
  const ladder = buildFullRankedLadder({
    mode: input.mode,
    playerCount: input.playerCount,
    realEntries,
  });
  return selectMatchedRivalsFromLadder({
    ladder,
    playerId: input.playerId,
    username: input.username,
    playerMmr: resolvedMmr ?? 0,
    count: input.count,
    ...(input.excludeNames !== undefined ? { excludeNames: input.excludeNames } : {}),
  });
}

/**
 * Aggiorna in modo persistente l'MMR dei bot rivali affrontati in partita:
 * battere un bot che ti sta appena sopra riduce i suoi punti e ti permette di sorpassarlo in Top 100.
 */
export function settleBotRivalResult(input: {
  botIds: readonly string[];
  winnerId: string;
  humanMmr: number;
  mode: GameMode;
  playerCount: LadderPlayerCount;
}): void {
  const ladderBotIds = input.botIds.filter((id) => id.startsWith('lbot_'));
  if (ladderBotIds.length === 0) return;

  const bucketKey = formatBotLadderBucketKey(input.mode, input.playerCount);
  const bucket = getOrCreateBucket(bucketKey);
  const globalBucket = getOrCreateBucket('global');
  let changedBucket = false;
  let changedGlobal = false;

  for (const botId of ladderBotIds) {
    const bot = bucket.bots[botId];
    if (!bot) continue;
    const botWon = botId === input.winnerId;
    const elo = calculateEloDelta({
      playerMMR: bot.mmr,
      opponentMMR: input.humanMmr,
      won: botWon,
    });
    bot.mmr = Math.max(20, Math.min(2350, elo.newMMR));
    bot.frameId =
      bot.mmr >= 1900 ? 'frame_ssl_prism' : bot.mmr >= 1350 ? 'frame_gold_pulse' : 'frame_default';
    if (botWon) bot.wins += 1;
    else bot.losses += 1;
    changedBucket = true;

    // Aggiorna anche il corrispondente rivale nella classifica globale
    const globalMatch = Object.values(globalBucket.bots).find(
      (gb) => gb.username.toLowerCase() === bot.username.toLowerCase(),
    );
    if (globalMatch) {
      const gElo = calculateEloDelta({
        playerMMR: globalMatch.mmr,
        opponentMMR: input.humanMmr,
        won: botWon,
      });
      globalMatch.mmr = Math.max(20, Math.min(2350, gElo.newMMR));
      if (botWon) globalMatch.wins += 1;
      else globalMatch.losses += 1;
      changedGlobal = true;
    }
  }

  if (changedBucket) saveBucket(bucketKey, bucket);
  if (changedGlobal) saveBucket('global', globalBucket);
}
