// ============================================================
// UNO ULTRA Client — V-Card Currency Store Unit Tests
// ============================================================

import { describe, expect, it } from 'vitest';
import { VCARD_PACKS } from '@uno/shared';
import {
  getVCardPackActionState,
  getVCardPackArtworkSvg,
  VCARD_ARTWORK_IDS,
} from '../src/ui/navigation/vcard-artworks.js';

describe('V-Card Currency Store Packs & Artworks', () => {
  it('defines 4 escalating packs matching UNO ULTRA pricing and rarities', () => {
    expect(VCARD_PACKS).toHaveLength(4);
    expect(
      VCARD_PACKS.map((p) => ({
        base: p.baseVCard,
        bonus: p.bonusVCard,
        total: p.totalVCard,
        price: p.priceDisplay,
        rarity: p.rarity,
      })),
    ).toEqual([
      { base: 500, bonus: 0, total: 500, price: '4,99 €', rarity: 'rare' },
      { base: 1000, bonus: 100, total: 1100, price: '9,99 €', rarity: 'epic' },
      { base: 2800, bonus: 400, total: 3200, price: '24,99 €', rarity: 'legendary' },
      { base: 6500, bonus: 1500, total: 8000, price: '49,99 €', rarity: 'mythic' },
    ]);
  });

  it('provides accessible SVG artwork with globally unique <defs> IDs for each pack', () => {
    const seenIds = new Set<string>();
    for (const pack of VCARD_PACKS) {
      expect(VCARD_ARTWORK_IDS).toContain(pack.id);
      const svg = getVCardPackArtworkSvg(pack.id);
      expect(svg).toContain('<svg');
      expect(svg).toContain('aria-hidden="true"');
      for (const match of svg.matchAll(/id="([^"]+)"/g)) {
        const defId = match[1];
        expect(defId).toBeDefined();
        if (defId) {
          expect(seenIds.has(defId)).toBe(false);
          seenIds.add(defId);
        }
      }
    }
  });

  it('disables grant CTA honestly when dev grants are off and enables in dev mode', () => {
    expect(getVCardPackActionState(false, '4,99 €')).toEqual({
      label: 'Pagamenti non ancora attivi',
      actionable: false,
    });
    expect(getVCardPackActionState(true, '4,99 €')).toEqual({
      label: 'Accredita Test · 4,99 €',
      actionable: true,
    });
  });
});
