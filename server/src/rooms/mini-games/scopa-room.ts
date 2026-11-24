// ============================================================
// UNO ULTRA Server — Scopa Authoritative Colyseus Room
// ============================================================

import type { ScopaAction, ScopaState } from '@uno/shared';
import { AbstractMiniGameRoom } from './blackjack-room.js';

export class ScopaRoom extends AbstractMiniGameRoom<ScopaState, ScopaAction> {
  protected readonly mode = 'scopa' as const;
}
