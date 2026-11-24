// ============================================================
// UNO ULTRA Server — Redis Matchmaking Cache
// ============================================================

import { getRedisClient } from './client.js';

const ticketMemory = new Map<string, { data: string; expiresAt: number }>();

export async function cacheMatchmakingTicket(
  ticketId: string,
  payload: Record<string, unknown>,
  ttlSeconds = 120,
): Promise<void> {
  const raw = JSON.stringify(payload);
  const now = Date.now();
  if (ticketMemory.size >= 500) {
    for (const [k, v] of ticketMemory) {
      if (v.expiresAt < now) ticketMemory.delete(k);
    }
    if (ticketMemory.size >= 500) {
      const oldest = ticketMemory.keys().next().value;
      if (oldest) ticketMemory.delete(oldest);
    }
  }
  ticketMemory.set(ticketId, { data: raw, expiresAt: now + ttlSeconds * 1000 });
  try {
    const client = getRedisClient();
    if (client.isOpen) {
      await client.setEx(`mm:ticket:${ticketId}`, ttlSeconds, raw);
    }
  } catch {
    // fallback in-memory active
  }
}

export async function getMatchmakingTicket(
  ticketId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const client = getRedisClient();
    if (client.isOpen) {
      const val = await client.get(`mm:ticket:${ticketId}`);
      if (val) return JSON.parse(val) as Record<string, unknown>;
    }
  } catch {
    // fallback
  }
  const local = ticketMemory.get(ticketId);
  if (!local || local.expiresAt < Date.now()) {
    ticketMemory.delete(ticketId);
    return null;
  }
  return JSON.parse(local.data) as Record<string, unknown>;
}
