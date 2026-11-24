// ============================================================
// UNO ULTRA Server — Centralized Rate-Limit Definitions
// ============================================================

export interface RateLimitPolicy {
  readonly windowMs: number;
  readonly maxRequests: number;
  readonly blockDurationMs?: number;
}

export const RATE_LIMIT_POLICIES: Readonly<Record<string, RateLimitPolicy>> = {
  auth_login: { windowMs: 60_000, maxRequests: 10, blockDurationMs: 300_000 },
  auth_register: { windowMs: 3_600_000, maxRequests: 5 },
  shop_purchase: { windowMs: 60_000, maxRequests: 20 },
  friend_request: { windowMs: 86_400_000, maxRequests: 20 },
  lobby_invite: { windowMs: 60_000, maxRequests: 5 },
  match_action: { windowMs: 1_000, maxRequests: 8 },
  telemetry_udp: { windowMs: 1_000, maxRequests: 30 },
} as const;
