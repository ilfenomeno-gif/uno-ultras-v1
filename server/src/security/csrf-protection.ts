// ============================================================
// UNO ULTRA Server — CSRF Origin Guard for cookie-backed routes
// ============================================================

import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

function getAllowedOrigins(): Set<string> {
  return new Set(
    env.CORS_ORIGIN.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export function csrfOriginGuard(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  if (origin) {
    const allowed = getAllowedOrigins();
    if (!allowed.has('*') && !allowed.has(origin)) {
      res.status(403).json({ error: 'Origine richiesta non autorizzata (CSRF)' });
      return;
    }
    next();
    return;
  }

  const fetchSite = req.headers['sec-fetch-site'];
  if (typeof fetchSite === 'string' && fetchSite === 'cross-site') {
    res.status(403).json({ error: 'Richiesta cross-site non consentita (CSRF)' });
    return;
  }

  next();
}
