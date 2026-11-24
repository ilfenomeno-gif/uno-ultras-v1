// ============================================================
// UNO ULTRA Client — Bespoke Shop Artworks Coverage Tests
// ============================================================

import { describe, expect, it } from 'vitest';
import { CATALOG_ITEMS } from '@uno/shared';
import {
  getShopItemArtworkSvg,
  SHOP_ARTWORK_IDS,
} from '../src/ui/navigation/shop-artworks.js';

describe('Shop Artworks Registry', () => {
  it('provides a dedicated SVG illustration for every catalog item', () => {
    for (const item of CATALOG_ITEMS) {
      expect(SHOP_ARTWORK_IDS).toContain(item.id);
      const svg = getShopItemArtworkSvg(item.id, item.category);
      expect(svg).toContain('<svg');
      expect(svg).toContain('aria-hidden="true"');
    }
  });

  it('uses globally unique <defs> IDs across all 13 shop SVG artworks', () => {
    const seenIds = new Set<string>();
    for (const item of CATALOG_ITEMS) {
      const svg = getShopItemArtworkSvg(item.id, item.category);
      const matches = Array.from(svg.matchAll(/id="([^"]+)"/g));
      for (const match of matches) {
        const defId = match[1];
        expect(defId).toBeDefined();
        if (defId) {
          expect(seenIds.has(defId)).toBe(false);
          seenIds.add(defId);
        }
      }
    }
  });

  it('falls back cleanly to category artwork for unknown future item IDs', () => {
    const fallback = getShopItemArtworkSvg('unknown_future_item', 'crate');
    expect(fallback).toContain('<svg');
  });
});
