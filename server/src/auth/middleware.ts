// ============================================================
// UNO ULTRA Server — Express authentication middleware
// ============================================================

import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, type VerifiedTokenPayload } from './jwt-service.js';
import { isTokenRevoked } from '../persistence/redis/session-store.js';
import { presenceService } from '../rooms/base/presence.js';

declare global {
  namespace Express {
    interface Request {
      user?: VerifiedTokenPayload;
    }
  }
}

export async function authRequired(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token di autenticazione mancante' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Token di autenticazione vuoto' });
    return;
  }

  try {
    const verified = verifyAccessToken(token);
    if (verified.jti && (await isTokenRevoked(verified.jti))) {
      res.status(401).json({ error: 'Sessione revocata' });
      return;
    }
    req.user = verified;
    void presenceService.touchOnline(verified.sub).catch(() => undefined);
    next();
  } catch {
    res.status(401).json({ error: 'Token non valido o scaduto' });
  }
}
