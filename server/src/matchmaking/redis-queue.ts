// ============================================================
// UNO ULTRA Server — Redis Distributed Matchmaking Queue
// ============================================================

import type { GameMode } from '@uno/shared';
import { getRedisClient } from '../persistence/redis/client.js';
import { computeMatchmakingBand } from './mmr.js';

export async function pushRedisQueueMember(
  mode: GameMode,
  ranked: boolean,
  playerId: string,
  mmr: number,
): Promise<void> {
  const key = `mmq:${mode}:${ranked ? 'ranked' : 'casual'}`;
  const client = getRedisClient();
  if (!client.isOpen) return;
  await client.zAdd(key, { score: mmr, value: playerId });
}

export async function findRedisQueueCandidates(
  mode: GameMode,
  ranked: boolean,
  anchorMMR: number,
  waitSeconds: number,
  limit = 4,
): Promise<string[]> {
  const key = `mmq:${mode}:${ranked ? 'ranked' : 'casual'}`;
  const client = getRedisClient();
  if (!client.isOpen) return [];
  const band = computeMatchmakingBand(waitSeconds);
  const members = await client.zRangeByScore(key, anchorMMR - band, anchorMMR + band);
  return members.slice(0, limit);
}

export async function removeRedisQueueMembers(
  mode: GameMode,
  ranked: boolean,
  playerIds: readonly string[],
): Promise<void> {
  if (playerIds.length === 0) return;
  const key = `mmq:${mode}:${ranked ? 'ranked' : 'casual'}`;
  const client = getRedisClient();
  if (!client.isOpen) return;
  await client.zRem(key, [...playerIds]);
}

const CLAIM_QUEUE_MEMBER_LUA = `
if redis.call('ZSCORE', KEYS[1], ARGV[1]) then
  redis.call('ZREM', KEYS[1], ARGV[1])
  return 1
else
  return 0
end
`;

export async function claimRedisQueueMember(
  mode: GameMode,
  ranked: boolean,
  playerId: string,
): Promise<boolean> {
  const key = `mmq:${mode}:${ranked ? 'ranked' : 'casual'}`;
  const client = getRedisClient();
  if (!client.isOpen) return true;
  const res = await client.eval(CLAIM_QUEUE_MEMBER_LUA, {
    keys: [key],
    arguments: [playerId],
  });
  return Number(res) === 1;
}
