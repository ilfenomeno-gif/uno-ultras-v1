// ============================================================
// UNO ULTRA Server — Bot Social Profiles Pool Repository
// ============================================================

import { getRankFromMMR, type AIProfile } from '@uno/shared';
import { query } from '../client.js';

export interface BotSocialProfile {
  id: string;
  displayName: string;
  aiProfile: AIProfile;
  mmr: number;
  rankTier: string;
  avatarId: string;
  frameId: string;
  favoriteMode: string;
  wins: number;
  matches: number;
}

const DEFAULT_BOT_ROSTER: readonly Omit<BotSocialProfile, 'rankTier'>[] = [
  {
    id: 'bot_nova_aggr',
    displayName: 'Nova_Strike',
    aiProfile: 'AGGR',
    mmr: 680,
    avatarId: 'avatar_neon_fox',
    frameId: 'frame_gold_pulse',
    favoriteMode: 'uno',
    wins: 44,
    matches: 82,
  },
  {
    id: 'bot_vega_strat',
    displayName: 'Vega_Prime',
    aiProfile: 'STRAT',
    mmr: 1240,
    avatarId: 'avatar_chrono_ace',
    frameId: 'frame_gold_pulse',
    favoriteMode: 'scala40',
    wins: 91,
    matches: 150,
  },
  {
    id: 'bot_kairo_cons',
    displayName: 'Kairo_Shield',
    aiProfile: 'CONS',
    mmr: 910,
    avatarId: 'avatar_neon_fox',
    frameId: 'frame_default',
    favoriteMode: 'scopa',
    wins: 62,
    matches: 120,
  },
  {
    id: 'bot_zenith_ssl',
    displayName: 'Zenith_SSL',
    aiProfile: 'STRAT',
    mmr: 1640,
    avatarId: 'avatar_cyber_dragon',
    frameId: 'frame_ssl_prism',
    favoriteMode: 'uno',
    wins: 210,
    matches: 300,
  },
];

export async function seedBotSocialProfiles(): Promise<void> {
  for (const b of DEFAULT_BOT_ROSTER) {
    const tier = getRankFromMMR(b.mmr);
    await query(
      `INSERT INTO bot_social_profiles
         (id, display_name, ai_profile, mmr, rank_tier, avatar_id, frame_id, favorite_mode, wins, matches)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [b.id, b.displayName, b.aiProfile, b.mmr, tier, b.avatarId, b.frameId, b.favoriteMode, b.wins, b.matches],
    );
  }
}

export async function listBotSocialProfilesNearMMR(
  targetMMR: number,
  limit = 6,
): Promise<BotSocialProfile[]> {
  try {
    const res = await query<{
      id: string;
      display_name: string;
      ai_profile: AIProfile;
      mmr: number;
      rank_tier: string;
      avatar_id: string;
      frame_id: string;
      favorite_mode: string;
      wins: number;
      matches: number;
    }>(
      `SELECT id, display_name, ai_profile, mmr, rank_tier, avatar_id, frame_id, favorite_mode, wins, matches
         FROM bot_social_profiles
        ORDER BY ABS(mmr - $1) ASC
        LIMIT $2`,
      [targetMMR, limit],
    );
    if (res.rows.length > 0) {
      return res.rows.map((r) => ({
        id: r.id,
        displayName: r.display_name,
        aiProfile: r.ai_profile,
        mmr: Number(r.mmr),
        rankTier: r.rank_tier,
        avatarId: r.avatar_id,
        frameId: r.frame_id,
        favoriteMode: r.favorite_mode,
        wins: Number(r.wins),
        matches: Number(r.matches),
      }));
    }
  } catch {
    // Fallback static roster se DB non disponibile
  }
  return [...DEFAULT_BOT_ROSTER]
    .sort((a, b) => Math.abs(a.mmr - targetMMR) - Math.abs(b.mmr - targetMMR))
    .slice(0, limit)
    .map((b) => ({ ...b, rankTier: getRankFromMMR(b.mmr) }));
}
