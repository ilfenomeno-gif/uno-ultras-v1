// ============================================================
// UNO ULTRA Server — Player Inventory & Locker Loadout REST Router
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../../auth/middleware.js';
import {
  equipCosmetic,
  getEquippedLoadout,
  getPlayerInventory,
} from '../../../persistence/postgres/repositories/inventory.js';

export const inventoryRouter = Router();

const EquipSchema = z.object({
  slot: z.enum(['avatar', 'frame', 'card_back', 'title']),
  itemId: z.string().min(1).max(80),
});

inventoryRouter.get('/', authRequired, async (req, res) => {
  try {
    const [items, loadout] = await Promise.all([
      getPlayerInventory(req.user!.sub),
      getEquippedLoadout(req.user!.sub),
    ]);
    res.status(200).json({ items, loadout });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Errore inventario' });
  }
});

inventoryRouter.post('/equip', authRequired, async (req, res) => {
  const parsed = EquipSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Parametri equipaggiamento non validi' });
    return;
  }
  try {
    const loadout = await equipCosmetic(req.user!.sub, parsed.data.slot, parsed.data.itemId);
    res.status(200).json({ loadout });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Equip fallito' });
  }
});
