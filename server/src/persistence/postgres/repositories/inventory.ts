// ============================================================
// UNO ULTRA Server — Inventory, Crate Unboxing & Loadout Repository
// ============================================================

import { CATALOG_BY_ID, CATALOG_ITEMS, type CatalogItem } from '@uno/shared';
import { getPostgresPool, query } from '../client.js';
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
}

export async function getPlayerInventory(playerId: string): Promise<InventoryItemRow[]> {
  const res = await query<InventoryItemRow>(
    `SELECT player_id, item_id, category, quantity, acquired_at, updated_at
       FROM player_inventory
      WHERE player_id = $1 AND quantity > 0
      ORDER BY acquired_at DESC`,
    [playerId],
  );
  return res.rows;
}

export async function getEquippedLoadout(playerId: string): Promise<EquippedLoadout> {
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
}

export async function equipCosmetic(
  playerId: string,
  slot: 'avatar' | 'frame' | 'card_back' | 'title',
  itemId: string,
): Promise<EquippedLoadout> {
  const defaults = new Set(['default', 'none', 'classic', 't1', 'avatar_default', 'frame_default', 'back_default']);
  if (!defaults.has(itemId)) {
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
}

export async function grantInventoryItem(
  playerId: string,
  itemId: string,
  category: string,
): Promise<{ quantityAfter: number; duplicate: boolean }> {
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
}

/** Apre una cassa torneo (100/500/1000 V-Card) generando drop pesato per rarita. */
export async function openCatalogCrate(
  playerId: string,
  crateId: 'crate_bronze_100' | 'crate_silver_500' | 'crate_ssl_1000',
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

  const pgPool = getPostgresPool();
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    const lockRes = await client.query<{ vcard: number }>(
      `SELECT vcard FROM players WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
      [playerId],
    );
    const cur = lockRes.rows[0]?.vcard;
    if (cur === undefined) throw new Error(`Player ${playerId} not found`);

    const ownedCrateRes = await client.query<{ quantity: number }>(
      `SELECT quantity FROM player_inventory WHERE player_id = $1 AND item_id = $2 FOR UPDATE`,
      [playerId, crateId],
    );
    const ownedCrateQty = ownedCrateRes.rows[0]?.quantity ?? 0;
    const redeemOwnedCrate = ownedCrateQty >= 1;
    const crateCost = redeemOwnedCrate ? 0 : crate.priceVCard;

    if (Number(cur) < crateCost) {
      throw new InsufficientFundsError('vcard', crateCost, Number(cur));
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
    const vcardAfter = Number(cur) - crateCost + refund;

    await client.query(`UPDATE players SET vcard = $1, updated_at = NOW() WHERE id = $2`, [
      vcardAfter,
      playerId,
    ]);
    await client.query(
      `INSERT INTO player_inventory (player_id, item_id, category, quantity)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (player_id, item_id)
       DO UPDATE SET quantity = player_inventory.quantity + 1, updated_at = NOW()`,
      [playerId, dropped.id, dropped.category],
    );
    await client.query(
      `INSERT INTO economy_transactions
         (player_id, tx_type, currency, amount_delta, balance_after, reference_id, metadata)
       VALUES ($1, 'crate_open', 'vcard', $2, $3, $4, $5::jsonb)`,
      [
        playerId,
        -crateCost + refund,
        vcardAfter,
        dropped.id,
        JSON.stringify({ crateId, redeemedOwnedCrate: redeemOwnedCrate, duplicate, refund }),
      ],
    );
    await client.query('COMMIT');
    return { crateId, droppedItem: dropped, duplicate, refundVCard: refund, vcardAfter };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
