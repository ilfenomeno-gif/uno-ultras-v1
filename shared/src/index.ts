// ============================================================
// UNO ULTRA @uno/shared — public surface (3A + 3B + 3C)
// ============================================================

// Constants
export * from './constants/cards.js';
export * from './constants/rules.js';
export * from './constants/ranks.js';
export * from './constants/game-modes.js';

// Public types
export * from './types/card.js';
export * from './types/player.js';
export * from './types/match.js';
export * from './types/lobby.js';
export * from './types/rank.js';
export * from './types/economy.js';
export * from './types/legacy-catalog.js';

// Runtime values re-exported from types (non-type)
export { AI_PROFILES, AI_DIFFICULTIES, AI_THINK_MS } from './types/player.js';

// Colyseus schemas
export * from './schemas/index.js';

// UNO Engine & Mini-Games
export * from './engine/uno/index.js';
export * from './engine/ranked/elo.js';
export * from './engine/mini-games/index.js';

// AI Decision Engine & Gemini Contracts
export { decideAction, getThinkDelayMs } from './engine/ai/decision-engine.js';
export * from './engine/ai/gemini-contracts.js';

// Protocol (TCP / UDP / QUIC / Codec)
export * from './protocol/messages.js';
export * from './protocol/tcp-channels.js';
export * from './protocol/udp-channels.js';
export * from './protocol/quic-config.js';
export * from './protocol/codec.js';

// Runtime validation (Zod)
export * from './validation/index.js';
