// ============================================================
// UNO ULTRA Server — Battle Card (Lv. 1..100) Repository
// ============================================================

import {
  BATTLE_CARD_MAX_LEVEL,
  BATTLE_CARD_PRICE_BASE,
  BATTLE_CARD_PRICE_BUNDLE_20,
  BATTLE_CARD_REWARDS,
  BATTLE_CARD_UNLOCK_LEVEL_PRICE,
  BATTLE_CARD_XP_PER_LEVEL,
  CATALOG_BY_ID,
} from '@uno/shared';
import { getPostgresPool, query } from '../client.js';
import { canUseDevFallback, updateDevState } from '../dev-store.js';
import { getDevPlayerSnapshot, updateDevPlayerSnapshot } from './players.js';
import { InsufficientFundsError } from './transactions.js';

export type BattleCardTier = 'free' | 'base' | 'bundle20';

export interface PlayerBattleCardState {
  playerId: string;
  seasonId: string;
  tier: BattleCardTier;
  level: number;
  xp: number;
  claimedLevels: string[]; // format: "free:10", "premium:15"
}

export async function getOrCreateBattleCard(
  playerId: string,
  seasonId = 'S1',
): Promise<PlayerBattleCardState> {
  try {
    await query(
      `INSERT INTO player_battle_cards (player_id, season_id)
       VALUES ($1, $2)
       ON CONFLICT (player_id, season_id) DO NOTHING`,
      [playerId, seasonId],
    );
    const res = await query<{
      player_id: string;
      season_id: string;
      tier: BattleCardTier;
      level: number;
      xp: number;
      claimed_levels: unknown;
    }>(
      `SELECT player_id, season_id, tier, level, xp, claimed_levels
         FROM player_battle_cards
        WHERE player_id = $1 AND season_id = $2
        LIMIT 1`,
      [playerId, seasonId],
    );
    const row = res.rows[0]!;
    return {
      playerId: row.player_id,
      seasonId: row.season_id,
      tier: row.tier,
      level: Number(row.level),
      xp: Number(row.xp),
      claimedLevels: Array.isArray(row.claimed_levels)
        ? row.claimed_levels.map(String)
        : [],
    };
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const key = `${playerId}:${seasonId}`;
    return updateDevState((state) => {
      const existing = (state.battleCards[key] ??= {
        tier: 'free',
        level: 1,
        xp: 0,
        claimedLevels: [],
      });
      return {
        playerId,
        seasonId,
        tier: existing.tier,
        level: existing.level,
        xp: existing.xp,
        claimedLevels: [...existing.claimedLevels],
      };
    });
  }
}

export async function addBattleCardXp(
  playerId: string,
  xpDelta: number,
  seasonId = 'S1',
): Promise<PlayerBattleCardState> {
  const safeDelta = Math.max(0, Math.floor(xpDelta));
  try {
    const pool = getPostgresPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO player_battle_cards (player_id, season_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [playerId, seasonId],
      );
      const lockRes = await client.query<{
        tier: BattleCardTier;
        level: number;
        xp: number;
        claimed_levels: unknown;
      }>(
        `SELECT tier, level, xp, claimed_levels
           FROM player_battle_cards
          WHERE player_id = $1 AND season_id = $2
          FOR UPDATE`,
        [playerId, seasonId],
      );
      const row = lockRes.rows[0]!;
      const currentLevel = Number(row.level);
      const totalXp = Number(row.xp) + safeDelta;
      const gainedLevels = Math.floor(totalXp / BATTLE_CARD_XP_PER_LEVEL);
      const nextLevel = Math.min(BATTLE_CARD_MAX_LEVEL, currentLevel + gainedLevels);
      const remXp = nextLevel >= BATTLE_CARD_MAX_LEVEL ? 0 : totalXp % BATTLE_CARD_XP_PER_LEVEL;

      await client.query(
        `UPDATE player_battle_cards
            SET level = $1, xp = $2, updated_at = NOW()
          WHERE player_id = $3 AND season_id = $4`,
        [nextLevel, remXp, playerId, seasonId],
      );
      await client.query(
        `UPDATE players SET battle_card_level = $1, xp = xp + $2, updated_at = NOW() WHERE id = $3`,
        [nextLevel, safeDelta, playerId],
      );
      await client.query('COMMIT');
      return {
        playerId,
        seasonId,
        tier: row.tier,
        level: nextLevel,
        xp: remXp,
        claimedLevels: Array.isArray(row.claimed_levels) ? row.claimed_levels.map(String) : [],
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const key = `${playerId}:${seasonId}`;
    return updateDevState((state) => {
      const bc = (state.battleCards[key] ??= {
        tier: 'free',
        level: 1,
        xp: 0,
        claimedLevels: [],
      });
      const totalXp = bc.xp + safeDelta;
      const gainedLevels = Math.floor(totalXp / BATTLE_CARD_XP_PER_LEVEL);
      bc.level = Math.min(BATTLE_CARD_MAX_LEVEL, bc.level + gainedLevels);
      bc.xp = bc.level >= BATTLE_CARD_MAX_LEVEL ? 0 : totalXp % BATTLE_CARD_XP_PER_LEVEL;
      updateDevPlayerSnapshot(playerId, { battle_card_level: bc.level });
      return {
        playerId,
        seasonId,
        tier: bc.tier,
        level: bc.level,
        xp: bc.xp,
        claimedLevels: [...bc.claimedLevels],
      };
    });
  }
}

export async function purchaseBattleCardPass(
  playerId: string,
  plan: 'base' | 'bundle20',
  seasonId = 'S1',
): Promise<{ state: PlayerBattleCardState; vcardAfter: number }> {
  const price = plan === 'bundle20' ? BATTLE_CARD_PRICE_BUNDLE_20 : BATTLE_CARD_PRICE_BASE;
  const levelBoost = plan === 'bundle20' ? 20 : 0;
  try {
    const pool = getPostgresPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO player_battle_cards (player_id, season_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [playerId, seasonId],
      );
      const pLock = await client.query<{ vcard: number }>(
        `SELECT vcard FROM players WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [playerId],
      );
      const curVCard = pLock.rows[0]?.vcard;
      if (curVCard === undefined) throw new Error(`Player ${playerId} not found`);
      if (Number(curVCard) < price) {
        throw new InsufficientFundsError('vcard', price, Number(curVCard));
      }

      const bcRes = await client.query<{ tier: BattleCardTier; level: number; xp: number; claimed_levels: unknown }>(
        `SELECT tier, level, xp, claimed_levels FROM player_battle_cards
          WHERE player_id = $1 AND season_id = $2 FOR UPDATE`,
        [playerId, seasonId],
      );
      const curBc = bcRes.rows[0]!;
      if (curBc.tier !== 'free') {
        throw new Error('Battle Card Premium gia sbloccata per questa stagione');
      }

      const nextLevel = Math.min(BATTLE_CARD_MAX_LEVEL, Number(curBc.level) + levelBoost);
      const vcardAfter = Number(curVCard) - price;

      await client.query(
        `UPDATE players SET vcard = $1, battle_card_level = $2, updated_at = NOW() WHERE id = $3`,
        [vcardAfter, nextLevel, playerId],
      );
      await client.query(
        `UPDATE player_battle_cards
            SET tier = $1, level = $2, purchased_at = NOW(), updated_at = NOW()
          WHERE player_id = $3 AND season_id = $4`,
        [plan, nextLevel, playerId, seasonId],
      );
      await client.query(
        `INSERT INTO economy_transactions (player_id, tx_type, currency, amount_delta, balance_after, reference_id)
         VALUES ($1, 'battle_card_buy', 'vcard', $2, $3, $4)`,
        [playerId, -price, vcardAfter, `${seasonId}:${plan}`],
      );
      await client.query('COMMIT');
      return {
        state: {
          playerId,
          seasonId,
          tier: plan,
          level: nextLevel,
          xp: Number(curBc.xp),
          claimedLevels: Array.isArray(curBc.claimed_levels) ? curBc.claimed_levels.map(String) : [],
        },
        vcardAfter,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const key = `${playerId}:${seasonId}`;
    return updateDevState((state) => {
      const player = getDevPlayerSnapshot(playerId);
      if (!player) throw new Error(`Player ${playerId} not found`);
      const curVCard = Number(player.vcard);
      if (curVCard < price) throw new InsufficientFundsError('vcard', price, curVCard);
      const bc = (state.battleCards[key] ??= {
        tier: 'free',
        level: 1,
        xp: 0,
        claimedLevels: [],
      });
      if (bc.tier !== 'free') {
        throw new Error('Battle Card Premium gia sbloccata per questa stagione');
      }
      bc.tier = plan;
      bc.level = Math.min(BATTLE_CARD_MAX_LEVEL, bc.level + levelBoost);
      const vcardAfter = curVCard - price;
      updateDevPlayerSnapshot(playerId, { vcard: vcardAfter, battle_card_level: bc.level });
      return {
        state: {
          playerId,
          seasonId,
          tier: bc.tier,
          level: bc.level,
          xp: bc.xp,
          claimedLevels: [...bc.claimedLevels],
        },
        vcardAfter,
      };
    });
  }
}

export async function unlockAllRemainingBattleCardLevels(
  playerId: string,
  seasonId = 'S1',
): Promise<{ state: PlayerBattleCardState; costVCard: number; vcardAfter: number }> {
  const state = await getOrCreateBattleCard(playerId, seasonId);
  const remaining = Math.max(0, BATTLE_CARD_MAX_LEVEL - state.level);
  if (remaining === 0) {
    try {
      const bal = await query<{ vcard: number }>(`SELECT vcard FROM players WHERE id = $1`, [playerId]);
      return { state, costVCard: 0, vcardAfter: Number(bal.rows[0]?.vcard ?? 0) };
    } catch (err) {
      if (!canUseDevFallback(err)) throw err;
      const player = getDevPlayerSnapshot(playerId);
      return { state, costVCard: 0, vcardAfter: Number(player?.vcard ?? 0) };
    }
  }
  const costVCard = remaining * BATTLE_CARD_UNLOCK_LEVEL_PRICE;
  try {
    const pool = getPostgresPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const pLock = await client.query<{ vcard: number }>(
        `SELECT vcard FROM players WHERE id = $1 FOR UPDATE`,
        [playerId],
      );
      const curVCard = Number(pLock.rows[0]?.vcard ?? 0);
      if (curVCard < costVCard) {
        throw new InsufficientFundsError('vcard', costVCard, curVCard);
      }
      const vcardAfter = curVCard - costVCard;
      await client.query(
        `UPDATE players SET vcard = $1, battle_card_level = $2, updated_at = NOW() WHERE id = $3`,
        [vcardAfter, BATTLE_CARD_MAX_LEVEL, playerId],
      );
      await client.query(
        `UPDATE player_battle_cards SET level = $1, xp = 0, updated_at = NOW()
          WHERE player_id = $2 AND season_id = $3`,
        [BATTLE_CARD_MAX_LEVEL, playerId, seasonId],
      );
      await client.query(
        `INSERT INTO economy_transactions (player_id, tx_type, currency, amount_delta, balance_after, reference_id)
         VALUES ($1, 'battle_card_buy', 'vcard', $2, $3, $4)`,
        [playerId, -costVCard, vcardAfter, `${seasonId}:unlock_all`],
      );
      await client.query('COMMIT');
      return {
        state: { ...state, level: BATTLE_CARD_MAX_LEVEL, xp: 0 },
        costVCard,
        vcardAfter,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const key = `${playerId}:${seasonId}`;
    return updateDevState((dev) => {
      const player = getDevPlayerSnapshot(playerId);
      const curVCard = Number(player?.vcard ?? 0);
      if (curVCard < costVCard) throw new InsufficientFundsError('vcard', costVCard, curVCard);
      const vcardAfter = curVCard - costVCard;
      const bc = (dev.battleCards[key] ??= {
        tier: state.tier,
        level: state.level,
        xp: state.xp,
        claimedLevels: [...state.claimedLevels],
      });
      bc.level = BATTLE_CARD_MAX_LEVEL;
      bc.xp = 0;
      updateDevPlayerSnapshot(playerId, { vcard: vcardAfter, battle_card_level: BATTLE_CARD_MAX_LEVEL });
      return {
        state: { ...state, level: BATTLE_CARD_MAX_LEVEL, xp: 0 },
        costVCard,
        vcardAfter,
      };
    });
  }
}

export async function claimBattleCardReward(
  playerId: string,
  level: number,
  track: 'free' | 'premium',
  seasonId = 'S1',
): Promise<{ claimedKey: string; vcardDelta: number; itemId?: string }> {
  const tierDef = BATTLE_CARD_REWARDS.find((r) => r.level === level);
  const reward = track === 'free' ? tierDef?.free : tierDef?.premium;
  if (!reward) throw new Error(`Nessuna ricompensa ${track} al livello ${level}`);

  const claimedKey = `${track}:${level}`;
  try {
    const pool = getPostgresPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const bcRes = await client.query<{ tier: BattleCardTier; level: number; claimed_levels: unknown }>(
        `SELECT tier, level, claimed_levels FROM player_battle_cards
          WHERE player_id = $1 AND season_id = $2 FOR UPDATE`,
        [playerId, seasonId],
      );
      const bc = bcRes.rows[0];
      if (!bc) throw new Error('Battle Card non inizializzata');
      if (track === 'premium' && bc.tier === 'free') {
        throw new Error('Richiede Battle Card Premium');
      }
      if (Number(bc.level) < level) {
        throw new Error(`Livello ${level} non ancora raggiunto`);
      }
      const existingClaims = Array.isArray(bc.claimed_levels) ? bc.claimed_levels.map(String) : [];
      if (existingClaims.includes(claimedKey)) {
        throw new Error(`Ricompensa ${claimedKey} gia riscattata`);
      }

      const updatedClaims = [...existingClaims, claimedKey];
      await client.query(
        `UPDATE player_battle_cards SET claimed_levels = $1::jsonb, updated_at = NOW()
          WHERE player_id = $2 AND season_id = $3`,
        [JSON.stringify(updatedClaims), playerId, seasonId],
      );

      let vcardDelta = 0;
      if (reward.kind === 'vcard' && reward.vcardAmount) {
        vcardDelta = reward.vcardAmount;
        const pRes = await client.query<{ vcard: number }>(
          `UPDATE players SET vcard = vcard + $1, updated_at = NOW() WHERE id = $2 RETURNING vcard`,
          [vcardDelta, playerId],
        );
        await client.query(
          `INSERT INTO economy_transactions (player_id, tx_type, currency, amount_delta, balance_after, reference_id)
           VALUES ($1, 'battle_card_claim', 'vcard', $2, $3, $4)`,
          [playerId, vcardDelta, Number(pRes.rows[0]?.vcard ?? 0), claimedKey],
        );
      } else if (reward.kind === 'cosmetic' && reward.itemId) {
        const cat = CATALOG_BY_ID[reward.itemId]?.category ?? 'avatar';
        await client.query(
          `INSERT INTO player_inventory (player_id, item_id, category, quantity)
           VALUES ($1, $2, $3, 1)
           ON CONFLICT (player_id, item_id)
           DO UPDATE SET quantity = player_inventory.quantity + 1, updated_at = NOW()`,
          [playerId, reward.itemId, cat],
        );
      }

      await client.query('COMMIT');
      return {
        claimedKey,
        vcardDelta,
        ...(reward.itemId !== undefined ? { itemId: reward.itemId } : {}),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const key = `${playerId}:${seasonId}`;
    return updateDevState((dev) => {
      const bc = dev.battleCards[key];
      if (!bc) throw new Error('Battle Card non inizializzata');
      if (track === 'premium' && bc.tier === 'free') {
        throw new Error('Richiede Battle Card Premium');
      }
      if (bc.level < level) {
        throw new Error(`Livello ${level} non ancora raggiunto`);
      }
      if (bc.claimedLevels.includes(claimedKey)) {
        throw new Error(`Ricompensa ${claimedKey} gia riscattata`);
      }
      bc.claimedLevels.push(claimedKey);

      let vcardDelta = 0;
      if (reward.kind === 'vcard' && reward.vcardAmount) {
        vcardDelta = reward.vcardAmount;
        const player = getDevPlayerSnapshot(playerId);
        const nextVcard = Number(player?.vcard ?? 0) + vcardDelta;
        updateDevPlayerSnapshot(playerId, { vcard: nextVcard });
      } else if (reward.kind === 'cosmetic' && reward.itemId) {
        const cat = CATALOG_BY_ID[reward.itemId]?.category ?? 'avatar';
        const inv = (dev.inventory[playerId] ??= []);
        const nowIso = new Date().toISOString();
        const found = inv.find((r) => r.item_id === reward.itemId);
        if (found) {
          found.quantity += 1;
          found.updated_at = nowIso;
        } else {
          inv.push({
            item_id: reward.itemId,
            category: cat,
            quantity: 1,
            acquired_at: nowIso,
            updated_at: nowIso,
          });
        }
      }

      return {
        claimedKey,
        vcardDelta,
        ...(reward.itemId !== undefined ? { itemId: reward.itemId } : {}),
      };
    });
  }
}
