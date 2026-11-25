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

export async function listSearchingMatchmakingTickets(): Promise<Array<Record<string, unknown>>> {
  const byTicketId = new Map<string, Record<string, unknown>>();
  const now = Date.now();

  for (const [id, entry] of ticketMemory) {
    if (entry.expiresAt < now) {
      ticketMemory.delete(id);
      continue;
    }
    try {
      const parsed = JSON.parse(entry.data) as Record<string, unknown>;
      if (parsed['status'] === 'searching') {
        byTicketId.set(id, parsed);
      }
    } catch {
      // ignore malformed cached entry
    }
  }

  try {
    const client = getRedisClient();
    if (client.isOpen) {
      for await (const rawKey of client.scanIterator({ MATCH: 'mm:ticket:*', COUNT: 100 })) {
        const keys = Array.isArray(rawKey) ? rawKey : [rawKey];
        for (const key of keys) {
          const val = await client.get(String(key));
          if (!val) continue;
          try {
            const parsed = JSON.parse(val) as Record<string, unknown>;
            const id =
              typeof parsed['ticketId'] === 'string'
                ? parsed['ticketId']
                : String(key).replace(/^mm:ticket:/, '');
            if (parsed['status'] === 'searching' && id) {
              byTicketId.set(id, parsed);
            }
          } catch {
            // ignore malformed JSON
          }
        }
      }
    }
  } catch {
    // fallback in-memory entries already collected
  }

  return [...byTicketId.values()];
}
