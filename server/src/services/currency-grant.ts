// ============================================================
// UNO ULTRA Server — V-Card Currency Fulfillment Service
// Ready for Payment Webhooks + Dev/Test Grants behind Env Gate
// ============================================================

import { VCARD_PACK_BY_ID, type VCardPackDefinition } from '@uno/shared';
import { env } from '../config/env.js';
import { applyBalanceDelta } from '../persistence/postgres/repositories/transactions.js';

export type VCardGrantSource = 'dev_grant' | 'payment_webhook';

export interface FulfillVCardPackInput {
  readonly playerId: string;
  readonly packId: string;
  readonly source: VCardGrantSource;
  readonly idempotencyKey?: string;
  readonly externalRef?: string;
}

export interface FulfillVCardPackResult {
  readonly pack: VCardPackDefinition;
  readonly vcardAdded: number;
  readonly vcardAfter: number;
  readonly deduplicated: boolean;
  readonly source: VCardGrantSource;
}

/** Dev currency grants are never allowed in production, even if env flag is set. */
export function isDevCurrencyGrantEnabled(): boolean {
  return env.ENABLE_DEV_CURRENCY_GRANTS && env.NODE_ENV !== 'production';
}

export async function fulfillVCardPackGrant(
  input: FulfillVCardPackInput
): Promise<FulfillVCardPackResult> {
  const pack = VCARD_PACK_BY_ID[input.packId];
  if (!pack) {
    throw new Error(`Pacchetto V-Card inesistente: ${input.packId}`);
  }

  const res = await applyBalanceDelta({
    playerId: input.playerId,
    txType: 'admin_grant',
    currency: 'vcard',
    delta: pack.totalVCard,
    referenceId: pack.id,
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    metadata: {
      source: input.source,
      baseVCard: pack.baseVCard,
      bonusVCard: pack.bonusVCard,
      priceEurCents: pack.priceEurCents,
      ...(input.externalRef ? { externalRef: input.externalRef } : {}),
    },
  });

  return {
    pack,
    vcardAdded: pack.totalVCard,
    vcardAfter: res.balanceAfter,
    deduplicated: res.deduplicated,
    source: input.source,
  };
}
