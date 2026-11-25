// ============================================================
// UNO ULTRA Server — In-Memory MMR Bucket Matchmaking Queue
// ============================================================

import { randomUUID } from 'node:crypto';
import type { GameMode } from '@uno/shared';
import { computeMatchmakingBand } from './mmr.js';

export interface QueueTicket {
  readonly ticketId: string;
  readonly playerId: string;
  readonly username: string;
  readonly mode: GameMode;
  readonly ranked: boolean;
  readonly mmr: number;
  readonly targetPlayers: number;
  readonly joinedAtMs: number;
  readonly variant?: string;
  readonly fallbackAtMs?: number;
}

export interface FormedMatch {
  readonly matchId: string;
  readonly mode: GameMode;
  readonly ranked: boolean;
  readonly players: readonly QueueTicket[];
  readonly averageMMR: number;
}

export class MatchmakingQueue {
  private readonly entries = new Map<string, QueueTicket>();

  enqueue(input: Omit<QueueTicket, 'ticketId' | 'joinedAtMs'> & { ticketId?: string }): QueueTicket {
    const ticket: QueueTicket = {
      ...input,
      ticketId: input.ticketId ?? randomUUID(),
      joinedAtMs: Date.now(),
    };
    this.entries.set(input.playerId, ticket);
    return ticket;
  }

  cancel(playerId: string): boolean {
    return this.entries.delete(playerId);
  }

  cancelAndGetTicket(playerId: string): QueueTicket | null {
    const existing = this.entries.get(playerId) ?? null;
    if (!existing) return null;
    this.entries.delete(playerId);
    return existing;
  }

  claimForBotFallback(
    playerId: string,
    ticketId: string,
    nowMs = Date.now(),
  ): QueueTicket | null {
    const entry = this.entries.get(playerId);
    if (
      !entry ||
      entry.ticketId !== ticketId ||
      !entry.fallbackAtMs ||
      nowMs < entry.fallbackAtMs
    ) {
      return null;
    }
    this.entries.delete(playerId);
    return entry;
  }

  size(): number {
    return this.entries.size;
  }

  /** Cerca match compatibili per modalita/ranked/banda MMR adattiva. */
  popMatches(nowMs = Date.now()): FormedMatch[] {
    const formed: FormedMatch[] = [];
    const grouped = new Map<string, QueueTicket[]>();
    for (const t of this.entries.values()) {
      const key = `${t.mode}:${t.ranked ? 'R' : 'C'}:${t.targetPlayers}`;
      const list = grouped.get(key) ?? [];
      list.push(t);
      grouped.set(key, list);
    }

    for (const group of grouped.values()) {
      group.sort((a, b) => a.mmr - b.mmr);
      const used = new Set<string>();

      for (let i = 0; i < group.length; i++) {
        const anchor = group[i]!;
        if (used.has(anchor.playerId)) continue;
        const waitSec = Math.max(0, (nowMs - anchor.joinedAtMs) / 1000);
        const band = anchor.ranked ? computeMatchmakingBand(waitSec) : 5000;
        const bucket = [anchor];

        for (let j = i + 1; j < group.length && bucket.length < anchor.targetPlayers; j++) {
          const candidate = group[j]!;
          if (used.has(candidate.playerId)) continue;
          if (Math.abs(candidate.mmr - anchor.mmr) <= band) {
            bucket.push(candidate);
          }
        }

        if (bucket.length === anchor.targetPlayers) {
          for (const p of bucket) {
            used.add(p.playerId);
            this.entries.delete(p.playerId);
          }
          const avg = Math.round(
            bucket.reduce((s, p) => s + p.mmr, 0) / Math.max(1, bucket.length),
          );
          formed.push({
            matchId: randomUUID(),
            mode: anchor.mode,
            ranked: anchor.ranked,
            players: bucket,
            averageMMR: avg,
          });
        }
      }
    }
    return formed;
  }
}

export const matchmakingQueue = new MatchmakingQueue();
