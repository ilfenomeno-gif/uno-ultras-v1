// ============================================================
// UNO ULTRA Server — Auth REST routes (JWT + bcrypt + refresh)
// ============================================================

import { Router } from 'express';
import {
  LoginPayloadSchema,
  RegisterPayloadSchema,
  type PlayerProfile,
  type PlaylistRankEntry,
  type RankTier,
} from '@uno/shared';
import { hashPassword, verifyPassword } from '../../../auth/password-hasher.js';
import { signAccessToken, verifyAccessToken } from '../../../auth/jwt-service.js';
import { authRequired } from '../../../auth/middleware.js';
import {
  clearRefreshCookie,
  issueRefreshToken,
  readRefreshCookie,
  revokeRefreshToken,
  rotateRefreshToken,
  setRefreshCookie,
} from '../../../auth/session-manager.js';
import { listPlayerPlaylistRanks } from '../../../persistence/postgres/repositories/playlist-ranks.js';
import {
  createPlayer,
  findPlayerById,
  findPlayerByUsername,
  isUsernameReserved,
  type PlayerRow,
} from '../../../persistence/postgres/repositories/players.js';
import { revokeTokenJti } from '../../../persistence/redis/session-store.js';
import { createRateLimiter } from '../../../security/rate-limiter.js';
import { csrfOriginGuard } from '../../../security/csrf-protection.js';
import { logger } from '../../../config/logger.js';

export const authRouter = Router();

const loginLimiter = createRateLimiter({ scope: 'login', max: 10, windowSeconds: 60 });
const registerLimiter = createRateLimiter({ scope: 'register', max: 5, windowSeconds: 60 });

function toPlayerProfile(
  row: PlayerRow,
  playlistRanks?: Readonly<Record<string, PlaylistRankEntry>>,
): PlayerProfile {
  return {
    id: row.id,
    username: row.username,
    rankTier: row.rank_tier as RankTier,
    mmr: row.mmr,
    vcard: row.vcard,
    battleCardLevel: row.battle_card_level,
    createdAt: row.created_at.toISOString(),
    ...(playlistRanks !== undefined ? { playlistRanks } : {}),
  };
}

async function buildProfileWithPlaylists(row: PlayerRow): Promise<PlayerProfile> {
  const playlistRanks = await listPlayerPlaylistRanks(row.id).catch(() => ({}));
  return toPlayerProfile(row, playlistRanks);
}

function isPgUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === '23505'
  );
}

authRouter.post('/register', registerLimiter, async (req, res) => {
  const parsed = RegisterPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Dati di registrazione non validi',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { username, password, email } = parsed.data;

  try {
    if (await isUsernameReserved(username)) {
      res.status(400).json({ error: 'Username riservato non utilizzabile' });
      return;
    }

    const existing = await findPlayerByUsername(username);
    if (existing) {
      res.status(409).json({ error: 'Username già in uso' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const created = await createPlayer(
      email !== undefined
        ? { username, passwordHash, email }
        : { username, passwordHash }
    );

    const token = signAccessToken({
      sub: created.id,
      username: created.username,
    });

    const refresh = await issueRefreshToken(created.id);
    setRefreshCookie(res, refresh.rawToken, refresh.expiresAt);

    res.status(201).json({
      token,
      profile: await buildProfileWithPlaylists(created),
    });
  } catch (err) {
    if (isPgUniqueViolation(err)) {
      res.status(409).json({ error: 'Username o email già in uso' });
      return;
    }
    logger.error({ err }, 'Error during user registration');
    res.status(500).json({ error: 'Errore interno durante la registrazione' });
  }
});

authRouter.post('/login', loginLimiter, async (req, res) => {
  const parsed = LoginPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Credenziali non valide',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { username, password } = parsed.data;

  try {
    const player = await findPlayerByUsername(username);
    if (!player) {
      res.status(401).json({ error: 'Username o password errati' });
      return;
    }

    const valid = await verifyPassword(password, player.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Username o password errati' });
      return;
    }

    const token = signAccessToken({
      sub: player.id,
      username: player.username,
    });

    const refresh = await issueRefreshToken(player.id);
    setRefreshCookie(res, refresh.rawToken, refresh.expiresAt);

    res.status(200).json({
      token,
      profile: await buildProfileWithPlaylists(player),
    });
  } catch (err) {
    logger.error({ err }, 'Error during user login');
    res.status(500).json({ error: 'Errore interno durante il login' });
  }
});

authRouter.post('/refresh', csrfOriginGuard, async (req, res) => {
  const rawRefresh = readRefreshCookie(req);
  if (!rawRefresh) {
    res.status(401).json({ error: 'Refresh token mancante' });
    return;
  }

  try {
    const rotated = await rotateRefreshToken(rawRefresh);
    if (!rotated) {
      clearRefreshCookie(res);
      res.status(401).json({ error: 'Sessione scaduta o revocata' });
      return;
    }

    const player = await findPlayerById(rotated.playerId);
    if (!player) {
      clearRefreshCookie(res);
      res.status(401).json({ error: 'Giocatore non trovato' });
      return;
    }

    const token = signAccessToken({
      sub: player.id,
      username: player.username,
    });
    setRefreshCookie(res, rotated.rawToken, rotated.expiresAt);

    res.status(200).json({
      token,
      profile: await buildProfileWithPlaylists(player),
    });
  } catch (err) {
    logger.error({ err }, 'Error refreshing session token');
    res.status(500).json({ error: 'Errore interno durante il refresh sessione' });
  }
});

authRouter.post('/logout', csrfOriginGuard, async (req, res) => {
  const rawRefresh = readRefreshCookie(req);
  if (rawRefresh) {
    try {
      await revokeRefreshToken(rawRefresh);
    } catch (err) {
      logger.warn({ err }, 'Failed to revoke refresh token on logout');
    }
  }
  clearRefreshCookie(res);

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const access = header.slice('Bearer '.length).trim();
    try {
      const verified = verifyAccessToken(access);
      if (verified.jti) {
        const ttl = verified.exp
          ? Math.max(1, verified.exp - Math.floor(Date.now() / 1000))
          : 7 * 24 * 60 * 60;
        await revokeTokenJti(verified.jti, ttl);
      }
    } catch {
      // Token già scaduto o invalido: ignora
    }
  }

  res.status(200).json({ ok: true });
});

authRouter.get('/me', authRequired, async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'Non autenticato' });
    return;
  }

  try {
    const player = await findPlayerById(userId);
    if (!player) {
      res.status(404).json({ error: 'Giocatore non trovato' });
      return;
    }

    res.status(200).json({
      profile: await buildProfileWithPlaylists(player),
    });
  } catch (err) {
    logger.error({ err }, 'Error fetching current player profile');
    res.status(500).json({ error: 'Errore interno nel recupero del profilo' });
  }
});
