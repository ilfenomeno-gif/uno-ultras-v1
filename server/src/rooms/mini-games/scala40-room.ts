// ============================================================
// UNO ULTRA Server — Scala 40 Authoritative Colyseus Room
// ============================================================

import type { Scala40Action, Scala40State } from '@uno/shared';
import { AbstractMiniGameRoom } from './blackjack-room.js';

export class Scala40Room extends AbstractMiniGameRoom<Scala40State, Scala40Action> {
  protected readonly mode = 'scala40' as const;
}
