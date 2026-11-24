// ============================================================
// UNO ULTRA Server — Shop & Tournament Crates REST Router
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { CATALOG_ITEMS, VCARD_PACKS } from '@uno/shared';
import { authRequired } from '../../../auth/middleware.js';
import { RATE_LIMIT_POLICIES } from '../../../config/rate-limits.js';
import { createRateLimiter } from '../../../security/rate-limiter.js';
import {
  fulfillVCardPackGrant,
  isDevCurrencyGrantEnabled,
} from '../../../services/currency-grant.js';
import {
  getPlayerBalances,
  InsufficientFundsError,
} from '../../../persistence/postgres/repositories/transactions.js';
import {
  openCatalogCrate,
  purchaseCatalogItem,
} from '../../../persistence/postgres/repositories/inventory.js';

export const shopRouter = Router();

const shopPolicy = RATE_LIMIT_POLICIES['shop_purchase']!;
const shopLimiter = createRateLimiter({
  scope: 'shop_purchase',
  max: shopPolicy.maxRequests,
  windowSeconds: Math.round(shopPolicy.windowMs / 1000),
});

const PurchaseBodySchema = z.object({
  itemId: z.string().min(1).max(80),
  idempotencyKey: z.string().min(1).max(120).optional(),
});

const OpenCrateBodySchema = z.object({
  crateId: z.enum(['crate_bronze_100', 'crate_silver_500', 'crate_ssl_1000']),
  currency: z.enum(['tournament_credits', 'vcard']).optional(),
});

const VCardPackGrantSchema = z.object({
  packId: z.enum(['vcard_500', 'vcard_1100', 'vcard_3200', 'vcard_8000']),
  idempotencyKey: z.string().min(1).max(120).optional(),
});

shopRouter.get('/catalog', (_req, res) => {
  res.status(200).json({
    items: CATALOG_ITEMS,
    dailyRotation: CATALOG_ITEMS.filter((i) => i.isDailyRotation),
  });
});

shopRouter.get('/balances', authRequired, async (req, res) => {
  try {
    const balances = await getPlayerBalances(req.user!.sub);
    res.status(200).json(balances);
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Saldo non trovato' });
  }
});

shopRouter.post('/purchase', authRequired, shopLimiter, async (req, res) => {
  const parsed = PurchaseBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Richiesta acquisto non valida' });
    return;
  }
  try {
    const result = await purchaseCatalogItem(
      req.user!.sub,
      parsed.data.itemId,
      parsed.data.idempotencyKey,
    );
    res.status(200).json(result);
  } catch (err) {
    const status = err instanceof InsufficientFundsError ? 402 : 400;
    res.status(status).json({ error: err instanceof Error ? err.message : 'Acquisto fallito' });
  }
});

shopRouter.post('/crates/open', authRequired, shopLimiter, async (req, res) => {
  const parsed = OpenCrateBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Cassa torneo non valida' });
    return;
  }
  try {
    const result = await openCatalogCrate(
      req.user!.sub,
      parsed.data.crateId,
      parsed.data.currency ?? 'tournament_credits',
    );
    res.status(200).json(result);
  } catch (err) {
    const status = err instanceof InsufficientFundsError ? 402 : 400;
    res.status(status).json({ error: err instanceof Error ? err.message : 'Apertura cassa fallita' });
  }
});

shopRouter.get('/vcard-packs', (_req, res) => {
  res.status(200).json({
    packs: VCARD_PACKS,
    devGrantsEnabled: isDevCurrencyGrantEnabled(),
    paymentsActive: false,
  });
});

shopRouter.post('/vcard-packs/grant', authRequired, shopLimiter, async (req, res) => {
  if (!isDevCurrencyGrantEnabled()) {
    res.status(403).json({
      error: 'Pagamenti non ancora attivi',
      code: 'PAYMENTS_DISABLED',
    });
    return;
  }
  const parsed = VCardPackGrantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Pacchetto V-Card non valido' });
    return;
  }
  try {
    const result = await fulfillVCardPackGrant({
      playerId: req.user!.sub,
      packId: parsed.data.packId,
      source: 'dev_grant',
      ...(parsed.data.idempotencyKey
        ? { idempotencyKey: parsed.data.idempotencyKey }
        : {}),
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Accredito V-Card fallito',
    });
  }
});
