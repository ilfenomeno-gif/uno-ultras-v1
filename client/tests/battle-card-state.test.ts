import { describe, expect, it } from 'vitest';
import { BATTLE_CARD_REWARDS, BATTLE_CARD_UNLOCK_LEVEL_PRICE } from '@uno/shared';
import {
  BATTLE_PASS_PHASES,
  buildBattlePassCards,
  computeBattlePassMetrics,
  getStadiumHeroArtworkSvg,
  getVCardRewardArtworkSvg,
} from '../src/ui/navigation/battle-card-helpers.js';

describe('Battle Pass / Battle Card Helpers', () => {
  it('separates Level/XP progression from unlocked Tier reward counts', () => {
    const metrics = computeBattlePassMetrics(BATTLE_CARD_REWARDS, {
      tier: 'free',
      level: 10,
      xp: 450,
      claimedLevels: ['free:1'],
    });

    expect(metrics.level).toBe(10);
    expect(metrics.maxLevel).toBe(100);
    expect(metrics.xp).toBe(450);
    expect(metrics.xpPerLevel).toBe(1000);
    expect(metrics.xpPercent).toBe(45);

    // At level 10 on free pass: free:1 and free:10 are unlocked (claimed + available),
    // while premium:5 and premium:10 stay locked.
    expect(metrics.unlockedCards).toBe(2);
    expect(metrics.claimedCards).toBe(1);
    expect(metrics.claimableCards).toBe(1);
    expect(metrics.totalCards).toBeGreaterThan(20);
    expect(metrics.unlockAllCostVCard).toBe(90 * BATTLE_CARD_UNLOCK_LEVEL_PRICE);
  });

  it('builds real FREE and PREMIUM cards per seasonal phase with accurate statuses', () => {
    expect(BATTLE_PASS_PHASES.map((p) => p.id)).toEqual([
      'pre-season',
      'qualifiers',
      'championship',
    ]);

    const preCards = buildBattlePassCards(
      BATTLE_CARD_REWARDS,
      { tier: 'base', level: 10, xp: 0, claimedLevels: ['free:1'] },
      'pre-season',
    );

    const lvl1Free = preCards.find((c) => c.key === 'free:1');
    const lvl10Prem = preCards.find((c) => c.key === 'premium:10');
    const lvl30Prem = preCards.find((c) => c.key === 'premium:30');

    expect(lvl1Free?.status).toBe('claimed');
    expect(lvl1Free?.label).toBe('Re dello Stacking');
    expect(lvl10Prem?.status).toBe('available');
    expect(lvl10Prem?.label).toBe('Neon Fox');
    expect(lvl30Prem?.status).toBe('locked');

    const champCards = buildBattlePassCards(
      BATTLE_CARD_REWARDS,
      { tier: 'free', level: 1, xp: 0, claimedLevels: [] },
      'championship',
    );
    expect(champCards.some((c) => c.level === 100 && c.label === 'Cornice Prisma SSL')).toBe(true);
  });

  it('generates isolated SVG artworks for hero stadium and V-Card tiers', () => {
    const heroSvg = getStadiumHeroArtworkSvg();
    expect(heroSvg).toContain('<svg');
    expect(heroSvg).toContain('UNO');

    const v50 = getVCardRewardArtworkSvg(50, 'free:10');
    const v50b = getVCardRewardArtworkSvg(50, 'free:20');
    expect(v50).toContain('bp_vc_glow_free_10');
    expect(v50b).toContain('bp_vc_glow_free_20');
  });
});
