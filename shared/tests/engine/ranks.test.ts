// ============================================================
// UNO ULTRA — Unit tests for 22-tier Ranks & Adaptive ELO
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  INITIAL_MMR,
  RANK_TIERS,
  SSL_MMR_THRESHOLD,
  calculateEloDelta,
  computeEffectiveK,
  getKBase,
  getRankFromMMR,
  getRankInfo,
  rankFromMMR,
} from '../../src/index.js';

describe('Ranks & Adaptive ELO (Opzione A: 22 tier, SSL 1600)', () => {
  it('espone esattamente 22 tier fino a Grand Champion III + SSL', () => {
    expect(RANK_TIERS).toHaveLength(22);
    expect(RANK_TIERS[0]).toBe('Bronze I');
    expect(RANK_TIERS[15]).toBe('Champion I');
    expect(RANK_TIERS[18]).toBe('Grand Champion I');
    expect(RANK_TIERS[21]).toBe('SSL');
    expect(SSL_MMR_THRESHOLD).toBe(1600);
  });

  it('mappa correttamente MMR → tier per ogni soglia chiave', () => {
    expect(getRankFromMMR(0)).toBe('Bronze I');
    expect(getRankFromMMR(200)).toBe('Bronze I'); // Opzione 2a: profili esistenti restano Bronze I
    expect(getRankFromMMR(210)).toBe('Bronze II');
    expect(getRankFromMMR(400)).toBe('Silver I');
    expect(getRankFromMMR(600)).toBe('Gold I');
    expect(getRankFromMMR(800)).toBe('Platinum I');
    expect(getRankFromMMR(1000)).toBe('Diamond I');
    expect(getRankFromMMR(1200)).toBe('Champion I');
    expect(getRankFromMMR(1400)).toBe('Grand Champion I');
    expect(getRankFromMMR(1600)).toBe('SSL');
    expect(getRankFromMMR(3250)).toBe('SSL');
    expect(rankFromMMR(1600)).toBe('SSL');
  });

  it('INITIAL_MMR = 0 mappa su Bronze I', () => {
    expect(INITIAL_MMR).toBe(0);
    const info = getRankInfo(INITIAL_MMR);
    expect(info.tier).toBe('Bronze I');
    expect(info.group).toBe('Bronze');
    expect(info.division).toBe('I');
    expect(info.minMMR).toBe(0);
  });

  it('getRankFromMMR(1600) restituisce SSL con maxMMR illimitato', () => {
    expect(getRankFromMMR(1600)).toBe('SSL');
    const info = getRankInfo(1600);
    expect(info.tier).toBe('SSL');
    expect(info.division).toBeNull();
    expect(info.maxMMR).toBeNull();
    expect(info.colorHex).toBe('#FFFFFF');
  });

  it('calcola ELO simmetrico a pari MMR: S=1 → +K/2, S=0 → -K/2', () => {
    const brackets = [
      { mmr: 300, expectedK: 40 },
      { mmr: 700, expectedK: 32 },
      { mmr: 1100, expectedK: 28 },
      { mmr: 1450, expectedK: 24 },
      { mmr: 1700, expectedK: 20 },
    ];

    for (const { mmr, expectedK } of brackets) {
      expect(getKBase(mmr)).toBe(expectedK);
      const win = calculateEloDelta({ playerMMR: mmr, opponentMMR: mmr, won: true });
      const loss = calculateEloDelta({ playerMMR: mmr, opponentMMR: mmr, won: false });

      expect(win.kBase).toBe(expectedK);
      expect(win.kEff).toBe(expectedK);
      expect(win.delta).toBe(expectedK / 2);
      expect(loss.delta).toBe(-expectedK / 2);
    }
  });

  it('applica i guardrail: Δ_final clampato a ±50, minWin ∈ [5,8], maxLoss ∈ [12,40]', () => {
    // Vittoria contro avversario +1000 MMR con K_base=40 → clamp a +50
    const hugeUpsetWin = calculateEloDelta({ playerMMR: 200, opponentMMR: 1200, won: true });
    expect(hugeUpsetWin.delta).toBe(50);

    // Vittoria attesa (favorevole di +1000 MMR) in SSL → minWin = 8
    const sslEasyWin = calculateEloDelta({ playerMMR: 1700, opponentMMR: 700, won: true });
    expect(sslEasyWin.delta).toBe(8);

    // Sconfitta shock in SSL (-1000 gap) → maxLoss = 12
    const sslShockLoss = calculateEloDelta({ playerMMR: 1700, opponentMMR: 700, won: false });
    expect(sslShockLoss.delta).toBe(-12);

    // Sconfitta shock in Bronze → maxLoss = 40 (e newMMR >= 0)
    const bronzeShockLoss = calculateEloDelta({ playerMMR: 500, opponentMMR: 100, won: false });
    expect(bronzeShockLoss.delta).toBeGreaterThanOrEqual(-40);
    expect(bronzeShockLoss.delta).toBeLessThanOrEqual(-1);

    const floorCheck = calculateEloDelta({ playerMMR: 5, opponentMMR: 500, won: false });
    expect(floorCheck.newMMR).toBeGreaterThanOrEqual(0);
  });

  it('applica correttamente gap bonus (|ΔR|>150 → +5, |ΔR|>300 → +15) e upset bonus (>400)', () => {
    // |ΔR| = 150 → nessun bonus; |ΔR| = 151 → +5; |ΔR| = 301 → +15 (5+10)
    expect(computeEffectiveK(700, 850)).toBe(32);
    expect(computeEffectiveK(700, 851)).toBe(37);
    expect(computeEffectiveK(700, 1001)).toBe(47);

    // Upset > 400 MMR aggiunge +10 al Δ_raw prima del clamp
    const upset = calculateEloDelta({ playerMMR: 600, opponentMMR: 1050, won: true });
    expect(upset.kBase).toBe(32);
    expect(upset.kEff).toBe(47);
    expect(upset.upsetBonus).toBe(10);
    expect(upset.delta).toBe(50);
  });
});
