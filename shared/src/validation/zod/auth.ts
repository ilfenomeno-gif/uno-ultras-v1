// ============================================================
// UNO ULTRA — Validatori Zod: autenticazione
// ============================================================

import { z } from 'zod';

/** Username riservati di sistema o pool bot (confronto case-insensitive). */
export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'root',
  'system',
  'mod',
  'moderator',
  'bot',
  'guest',
  'player',
  'uno',
  'ultra',
] as const;

export function isReservedUsername(username: string): boolean {
  const normalized = username.trim().toLowerCase();
  if ((RESERVED_USERNAMES as readonly string[]).includes(normalized)) {
    return true;
  }
  return normalized.startsWith('uno_bot');
}

/** Username: 3-20 caratteri alfanumerici + underscore/trattino, non riservato. */
export const UsernameSchema = z
  .string()
  .min(3, 'Username troppo corto (min 3)')
  .max(20, 'Username troppo lungo (max 20)')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username: solo lettere, numeri, _ e -')
  .refine((u) => !isReservedUsername(u), 'Username riservato non utilizzabile');

/** Password: 8-128 caratteri, nessuna restrizione di composizione. */
export const PasswordSchema = z
  .string()
  .min(8, 'Password troppo corta (min 8)')
  .max(128, 'Password troppo lunga (max 128)');

/** Payload di login: username + password. */
export const LoginPayloadSchema = z.object({
  username: UsernameSchema,
  password: PasswordSchema,
});

/** Payload di registrazione: aggiunge conferma password ed email opzionale. */
export const RegisterPayloadSchema = z
  .object({
    username: UsernameSchema,
    password: PasswordSchema,
    confirmPassword: PasswordSchema,
    email: z.string().email('Email non valida').optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  });

// ── Tipi inferiti ─────────────────────────────────────────────

export type LoginPayload = z.infer<typeof LoginPayloadSchema>;
export type RegisterPayload = z.infer<typeof RegisterPayloadSchema>;
