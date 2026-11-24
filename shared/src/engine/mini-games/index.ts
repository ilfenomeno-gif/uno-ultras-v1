// ============================================================
// UNO ULTRA — Mini-Games & Pentathlon barrel export
// ============================================================

export * from './mini-game-contract.js';
export * from './blackjack/engine.js';
export * from './scala40/engine.js';
export * from './ruba-mazzetto/engine.js';
export * from './scopa/engine.js';
export * from './poker-texas/engine.js';
export * from './burraco/engine.js';
export * from './mille-miglia/engine.js';
export * from './pentathlon.js';

import type { GameMode } from '../../constants/game-modes.js';
import { blackjackEngine } from './blackjack/engine.js';
import { scala40Engine } from './scala40/engine.js';
import { rubaMazzettoEngine } from './ruba-mazzetto/engine.js';
import { scopaEngine } from './scopa/engine.js';
import { pokerTexasEngine } from './poker-texas/engine.js';
import { burracoEngine } from './burraco/engine.js';
import { milleMigliaEngine } from './mille-miglia/engine.js';
import type { MiniGameEngine, MiniGameStateBase } from './mini-game-contract.js';

export type AnyMiniGameMode = Exclude<GameMode, 'uno'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MINI_GAME_ENGINES: Record<AnyMiniGameMode, MiniGameEngine<MiniGameStateBase, any>> = {
  blackjack: blackjackEngine,
  scala40: scala40Engine,
  'ruba-mazzetto': rubaMazzettoEngine,
  scopa: scopaEngine,
  'poker-texas': pokerTexasEngine,
  burraco: burracoEngine,
  'mille-miglia': milleMigliaEngine,
};
