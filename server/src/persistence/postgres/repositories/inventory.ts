// ============================================================
// UNO ULTRA Server — Inventory, Crate Unboxing & Loadout Repository
// ============================================================

import crypto from 'node:crypto';
import { CATALOG_BY_ID, CATALOG_ITEMS, LEGACY_TITLES_BY_ID, type CatalogItem } from '@uno/shared';
import { getPostgresPool, query } from '../client.js';
import { canUseDevFallback, readDevState, updateDevState } from '../dev-store.js';
import { getDevPlayerSnapshot, updateDevPlayerSnapshot } from './players.js';
import { InsufficientFundsError } from './transactions.js';

export interface InventoryItemRow {
  player_id: string;
  item_id: string;
  category: string;
  quantity: number;
  acquired_at: Date;
  updated_at: Date;
}

export interface EquippedLoadout {
  avatar: string;
  frame: string;
  cardStyle: string;
  title: string;
}

export interface ShopPurchaseResult {
  item: CatalogItem;
  duplicate: boolean;
  refundVCard: number;
  quantityAfter: number;
  vcardAfter: number;
}

export interface CrateOpenResult {
  crateId: string;
  droppedItem: CatalogItem;
  duplicate: boolean;
  refundVCard: number;
  vcardAfter: number;
  tournamentCreditsAfter: number;
  currencyUsed: 'owned_crate' | 'tournament_credits' | 'vcard';
}

const DEFAULT_LOADOUT: EquippedLoadout = {
  avatar: 'default',
  frame: 'none',
  cardStyle: 'classic',
  title: 't1',
};

export async function getPlayerInventory(playerId: string): Promise<InventoryItemRow[]> {
  try {
    const res = await query<InventoryItemRow>(
      `SELECT player_id, item_id, category, quantity, acquired_at, updated_at
         FROM player_inventory
        WHERE player_id = $1 AND quantity > 0
        ORDER BY acquired_at DESC`,
      [playerId],
    );
    return res.rows;
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    return (readDevState().inventory[playerId] ?? [])
      .filter((r) => r.quantity > 0)
      .map((r) => ({
        player_id: playerId,
        item_id: r.item_id,
        category: r.category,
        quantity: r.quantity,
        acquired_at: new Date(r.acquired_at),
        updated_at: new Date(r.updated_at),
      }));
  }
}

export async function getEquippedLoadout(playerId: string): Promise<EquippedLoadout> {
  try {
    const res = await query<{
      equipped_avatar: string;
      equipped_frame: string;
      equipped_card_style: string;
      equipped_title: string;
    }>(
      `SELECT equipped_avatar, equipped_frame, equipped_card_style, equipped_title
         FROM players
        WHERE id = $1 AND deleted_at IS NULL
        LIMIT 1`,
      [playerId],
    );
    const row = res.rows[0];
    if (!row) throw new Error(`Player ${playerId} not found`);
    return {
      avatar: row.equipped_avatar,
      frame: row.equipped_frame,
      cardStyle: row.equipped_card_style,
      title: row.equipped_title,
    };
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    const player = getDevPlayerSnapshot(playerId);
    if (!player) throw new Error(`Player ${playerId} not found`);
    const cur = readDevState().loadouts[playerId];
    return cur ? { ...cur } : { ...DEFAULT_LOADOUT };
  }
}

export async function equipCosmetic(
  playerId: string,
  slot: 'avatar' | 'frame' | 'card_back' | 'title',
  itemId: string,
): Promise<EquippedLoadout> {
  const defaults = new Set(['default', 'none', 'classic', 't1', 'avatar_default', 'frame_default', 'back_default']);
  const isLegacyTitle = slot === 'title' && itemId in LEGACY_TITLES_BY_ID;
  try {
    if (!defaults.has(itemId) && !isLegacyTitle) {
      const owned = await query<{ quantity: number }>(
        `SELECT quantity FROM player_inventory WHERE player_id = $1 AND item_id = $2 LIMIT 1`,
        [playerId, itemId],
      );
      if ((owned.rows[0]?.quantity ?? 0) < 1) {
        throw new Error(`Oggetto ${itemId} non posseduto nell'inventario`);
      }
    }

    const colMap = {
      avatar: 'equipped_avatar',
      frame: 'equipped_frame',
      card_back: 'equipped_card_style',
      title: 'equipped_title',
    } as const;
    const col = colMap[slot];

    await query(
      `UPDATE players SET ${col} = $1, updated_at = NOW() WHERE id = $2`,
      [itemId, playerId],
    );
    return getEquippedLoadout(playerId);
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    return updateDevState((state) => {
      const inv = state.inventory[playerId] ?? [];
      if (!defaults.has(itemId) && !isLegacyTitle) {
        const ownedQty = inv.find((r) => r.item_id === itemId)?.quantity ?? 0;
        if (ownedQty < 1) {
          throw new Error(`Oggetto ${itemId} non posseduto nell'inventario`);
        }
      }
      const loadout = (state.loadouts[playerId] ??= { ...DEFAULT_LOADOUT });
      if (slot === 'avatar') loadout.avatar = itemId;
      else if (slot === 'frame') loadout.frame = itemId;
      else if (slot === 'card_back') loadout.cardStyle = itemId;
      else loadout.title = itemId;
      return { ...loadout };
    });
  }
}

/**
 * Acquisto atomico in shop con gestione doppione ×N + rimborso V-Card.
 */
export async function purchaseCatalogItem(
  playerId: string,
  itemId: string,
  idempotencyKey?: string,
): Promise<ShopPurchaseResult> {
  const item = CATALOG_BY_ID[itemId];
  if (!item) {
    throw new Error(`Oggetto catalogo inesistente: ${itemId}`);
  }
  try {
    const pool = getPostgresPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const lockRes = await client.query<{ vcard: number }>(
        `SELECT vcard FROM players WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [playerId],
      );
      const currentVCard = lockRes.rows[0]?.vcard;
      if (currentVCard === undefined) throw new Error(`Player ${playerId} not found`);
      if (Number(currentVCard) < item.priceVCard) {
        throw new InsufficientFundsError('vcard', item.priceVCard, Number(currentVCard));
      }

      const existingInv = await client.query<{ quantity: number }>(
        `SELECT quantity FROM player_inventory WHERE player_id = $1 AND item_id = $2 FOR UPDATE`,
        [playerId, item.id],
      );
      const alreadyOwned = (existingInv.rows[0]?.quantity ?? 0) > 0;
      const refund = alreadyOwned && item.category !== 'crate' ? item.duplicateRefundVCard : 0;
      const netDelta = -item.priceVCard + refund;
      const vcardAfter = Number(currentVCard) + netDelta;

      await client.query(
        `UPDATE players SET vcard = $1, updated_at = NOW() WHERE id = $2`,
        [vcardAfter, playerId],
      );

      const upsertInv = await client.query<{ quantity: number }>(
        `INSERT INTO player_inventory (player_id, item_id, category, quantity)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (player_id, item_id)
         DO UPDATE SET quantity = player_inventory.quantity + 1, updated_at = NOW()
         RETURNING quantity`,
        [playerId, item.id, item.category],
      );

      await client.query(
        `INSERT INTO economy_transactions
           (player_id, tx_type, currency, amount_delta, balance_after, reference_id, idempotency_key, metadata)
         VALUES ($1, 'shop_purchase', 'vcard', $2, $3, $4, $5, $6::jsonb)`,
        [
          playerId,
          netDelta,
          vcardAfter,
          item.id,
          idempotencyKey ?? null,
          JSON.stringify({ duplicate: alreadyOwned, refund }),
        ],
      );

      await client.query('COMMIT');
      return {
        item,
        duplicate: alreadyOwned,
        refundVCard: refund,
        quantityAfter: upsertInv.rows[0]?.quantity ?? 1,
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
    return updateDevState((state) => {
      const player = getDevPlayerSnapshot(playerId);
      if (!player) throw new Error(`Player ${playerId} not found`);
      const currentVCard = Number(player.vcard);
      if (currentVCard < item.priceVCard) {
        throw new InsufficientFundsError('vcard', item.priceVCard, currentVCard);
      }
      const inv = (state.inventory[playerId] ??= []);
      const existing = inv.find((r) => r.item_id === item.id);
      const alreadyOwned = (existing?.quantity ?? 0) > 0;
      const refund = alreadyOwned && item.category !== 'crate' ? item.duplicateRefundVCard : 0;
      const netDelta = -item.priceVCard + refund;
      const vcardAfter = currentVCard + netDelta;
      const nowIso = new Date().toISOString();

      updateDevPlayerSnapshot(playerId, { vcard: vcardAfter });
      let quantityAfter = 1;
      if (existing) {
        existing.quantity += 1;
        existing.updated_at = nowIso;
        quantityAfter = existing.quantity;
      } else {
        inv.push({
          item_id: item.id,
          category: item.category,
          quantity: 1,
          acquired_at: nowIso,
          updated_at: nowIso,
        });
      }

      state.transactions.unshift({
        id: crypto.randomUUID(),
        player_id: playerId,
        tx_type: 'shop_purchase',
        currency: 'vcard',
        amount_delta: netDelta,
        balance_after: vcardAfter,
        reference_id: item.id,
        idempotency_key: idempotencyKey ?? null,
        metadata: { duplicate: alreadyOwned, refund },
        created_at: nowIso,
      });

      return {
        item,
        duplicate: alreadyOwned,
        refundVCard: refund,
        quantityAfter,
        vcardAfter,
      };
    });
  }
}

export async function grantInventoryItem(
  playerId: string,
  itemId: string,
  category: string,
): Promise<{ quantityAfter: number; duplicate: boolean }> {
  try {
    const existing = await query<{ quantity: number }>(
      `SELECT quantity FROM player_inventory WHERE player_id = $1 AND item_id = $2`,
      [playerId, itemId],
    );
    const duplicate = (existing.rows[0]?.quantity ?? 0) > 0;
    const res = await query<{ quantity: number }>(
      `INSERT INTO player_inventory (player_id, item_id, category, quantity)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (player_id, item_id)
       DO UPDATE SET quantity = player_inventory.quantity + 1, updated_at = NOW()
       RETURNING quantity`,
      [playerId, itemId, category],
    );
    return { quantityAfter: res.rows[0]?.quantity ?? 1, duplicate };
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    return updateDevState((state) => {
      const inv = (state.inventory[playerId] ??= []);
      const existing = inv.find((r) => r.item_id === itemId);
      const duplicate = (existing?.quantity ?? 0) > 0;
      const nowIso = new Date().toISOString();
      let quantityAfter = 1;
      if (existing) {
        existing.quantity += 1;
        existing.updated_at = nowIso;
        quantityAfter = existing.quantity;
      } else {
        inv.push({
          item_id: itemId,
          category,
          quantity: 1,
          acquired_at: nowIso,
          updated_at: nowIso,
        });
      }
      return { quantityAfter, duplicate };
    });
  }
}

/** Apre una cassa torneo (100/500/1000) consumando copia posseduta, Crediti Torneo o V-Card. */
export async function openCatalogCrate(
  playerId: string,
  crateId: 'crate_bronze_100' | 'crate_silver_500' | 'crate_ssl_1000',
  preferredCurrency: 'tournament_credits' | 'vcard' = 'tournament_credits',
): Promise<CrateOpenResult> {
  const crate = CATALOG_BY_ID[crateId];
  if (!crate) throw new Error(`Cassa non valida: ${crateId}`);

  const eligibleRarities =
    crateId === 'crate_ssl_1000'
      ? new Set(['legendary', 'mythic'])
      : crateId === 'crate_silver_500'
        ? new Set(['epic', 'legendary'])
        : new Set(['common', 'rare']);

  const pool = CATALOG_ITEMS.filter(
    (i) => i.category !== 'crate' && eligibleRarities.has(i.rarity),
  );
  const dropped = pool[Math.floor(Math.random() * pool.length)] ?? CATALOG_ITEMS[0]!;

  try {
    const pgPool = getPostgresPool();
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const lockRes = await client.query<{ vcard: number; tournament_credits: number }>(
        `SELECT vcard, tournament_credits FROM players WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [playerId],
      );
      const playerRow = lockRes.rows[0];
      if (!playerRow) throw new Error(`Player ${playerId} not found`);
      const curVCard = Number(playerRow.vcard);
      const curCredits = Number(playerRow.tournament_credits);

      const ownedCrateRes = await client.query<{ quantity: number }>(
        `SELECT quantity FROM player_inventory WHERE player_id = $1 AND item_id = $2 FOR UPDATE`,
        [playerId, crateId],
      );
      const ownedCrateQty = ownedCrateRes.rows[0]?.quantity ?? 0;
      const redeemOwnedCrate = ownedCrateQty >= 1;
      const currencyUsed: CrateOpenResult['currencyUsed'] = redeemOwnedCrate
        ? 'owned_crate'
        : preferredCurrency;
      const crateCost = redeemOwnedCrate ? 0 : crate.priceVCard;

      if (currencyUsed === 'tournament_credits' && curCredits < crateCost) {
        throw new InsufficientFundsError('tournament_credits', crateCost, curCredits);
      }
      if (currencyUsed === 'vcard' && curVCard < crateCost) {
        throw new InsufficientFundsError('vcard', crateCost, curVCard);
      }

      if (redeemOwnedCrate) {
        if (ownedCrateQty === 1) {
          await client.query(
            `DELETE FROM player_inventory WHERE player_id = $1 AND item_id = $2`,
            [playerId, crateId],
          );
        } else {
          await client.query(
            `UPDATE player_inventory
                SET quantity = quantity - 1, updated_at = NOW()
              WHERE player_id = $1 AND item_id = $2`,
            [playerId, crateId],
          );
        }
      }

      const ownedRes = await client.query<{ quantity: number }>(
        `SELECT quantity FROM player_inventory WHERE player_id = $1 AND item_id = $2 FOR UPDATE`,
        [playerId, dropped.id],
      );
      const duplicate = (ownedRes.rows[0]?.quantity ?? 0) > 0;
      const refund = duplicate ? dropped.duplicateRefundVCard : 0;

      const vcardAfter =
        currencyUsed === 'vcard' ? curVCard - crateCost + refund : curVCard + refund;
      const tournamentCreditsAfter =
        currencyUsed === 'tournament_credits' ? curCredits - crateCost : curCredits;

      await client.query(
        `UPDATE players SET vcard = $1, tournament_credits = $2, updated_at = NOW() WHERE id = $3`,
        [vcardAfter, tournamentCreditsAfter, playerId],
      );
      await client.query(
        `INSERT INTO player_inventory (player_id, item_id, category, quantity)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (player_id, item_id)
         DO UPDATE SET quantity = player_inventory.quantity + 1, updated_at = NOW()`,
        [playerId, dropped.id, dropped.category],
      );

      const txCurrency = currencyUsed === 'tournament_credits' ? 'tournament_credits' : 'vcard';
      const txDelta = currencyUsed === 'tournament_credits' ? -crateCost : -crateCost + refund;
      const txBalanceAfter =
        currencyUsed === 'tournament_credits' ? tournamentCreditsAfter : vcardAfter;

      await client.query(
        `INSERT INTO economy_transactions
           (player_id, tx_type, currency, amount_delta, balance_after, reference_id, metadata)
         VALUES ($1, 'crate_open', $2, $3, $4, $5, $6::jsonb)`,
        [
          playerId,
          txCurrency,
          txDelta,
          txBalanceAfter,
          dropped.id,
          JSON.stringify({ crateId, currencyUsed, duplicate, refund }),
        ],
      );
      await client.query('COMMIT');
      return {
        crateId,
        droppedItem: dropped,
        duplicate,
        refundVCard: refund,
        vcardAfter,
        tournamentCreditsAfter,
        currencyUsed,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (!canUseDevFallback(err)) throw err;
    return updateDevState((state) => {
      const player = getDevPlayerSnapshot(playerId);
      if (!player) throw new Error(`Player ${playerId} not found`);
      const curVCard = Number(player.vcard);
      const curCredits = Number(state.tournamentCredits[playerId] ?? 0);
      const inv = (state.inventory[playerId] ??= []);

      const ownedCrateIdx = inv.findIndex((r) => r.item_id === crateId && r.quantity > 0);
      const redeemOwnedCrate = ownedCrateIdx >= 0;
      const currencyUsed: CrateOpenResult['currencyUsed'] = redeemOwnedCrate
        ? 'owned_crate'
        : preferredCurrency;
      const crateCost = redeemOwnedCrate ? 0 : crate.priceVCard;

      if (currencyUsed === 'tournament_credits' && curCredits < crateCost) {
        throw new InsufficientFundsError('tournament_credits', crateCost, curCredits);
      }
      if (currencyUsed === 'vcard' && curVCard < crateCost) {
        throw new InsufficientFundsError('vcard', crateCost, curVCard);
      }

      const nowIso = new Date().toISOString();
      if (redeemOwnedCrate) {
        const crateRow = inv[ownedCrateIdx]!;
        if (crateRow.quantity <= 1) inv.splice(ownedCrateIdx, 1);
        else {
          crateRow.quantity -= 1;
          crateRow.updated_at = nowIso;
        }
      }

      const dropRow = inv.find((r) => r.item_id === dropped.id);
      const duplicate = (dropRow?.quantity ?? 0) > 0;
      const refund = duplicate ? dropped.duplicateRefundVCard : 0;

      const vcardAfter =
        currencyUsed === 'vcard' ? curVCard - crateCost + refund : curVCard + refund;
      const tournamentCreditsAfter =
        currencyUsed === 'tournament_credits' ? curCredits - crateCost : curCredits;

      updateDevPlayerSnapshot(playerId, { vcard: vcardAfter });
      state.tournamentCredits[playerId] = tournamentCreditsAfter;

      if (dropRow) {
        dropRow.quantity += 1;
        dropRow.updated_at = nowIso;
      } else {
        inv.push({
          item_id: dropped.id,
          category: dropped.category,
          quantity: 1,
          acquired_at: nowIso,
          updated_at: nowIso,
        });
      }

      return {
        crateId,
        droppedItem: dropped,
        duplicate,
        refundVCard: refund,
        vcardAfter,
        tournamentCreditsAfter,
        currencyUsed,
      };
    });
  }
}
