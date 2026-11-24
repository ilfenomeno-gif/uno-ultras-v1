// ============================================================
// UNO ULTRA — Unit tests: Zod Auth Validators & Blacklist
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  LoginPayloadSchema,
  PasswordSchema,
  RESERVED_USERNAMES,
  RegisterPayloadSchema,
  UsernameSchema,
  isReservedUsername,
} from '../../src/index.js';

describe('Auth Validators & Username Blacklist', () => {
  it('accetta username validi (3-20 char alfanumerici, _ e -)', () => {
    expect(UsernameSchema.safeParse('Alice_01').success).toBe(true);
    expect(UsernameSchema.safeParse('pro-gamer99').success).toBe(true);
    expect(UsernameSchema.safeParse('abc').success).toBe(true);
  });

  it('rifiuta username troppo corti o troppo lunghi', () => {
    expect(UsernameSchema.safeParse('ab').success).toBe(false);
    expect(UsernameSchema.safeParse('a'.repeat(21)).success).toBe(false);
  });

  it('rifiuta username con caratteri non ammessi (spazi, simboli, unicode)', () => {
    expect(UsernameSchema.safeParse('alice bob').success).toBe(false);
    expect(UsernameSchema.safeParse('alice@uno').success).toBe(false);
    expect(UsernameSchema.safeParse('alìce').success).toBe(false);
  });

  it('blocca tutti i nomi riservati in modo case-insensitive (admin, bot, uno, ultra, ecc.)', () => {
    for (const reserved of RESERVED_USERNAMES) {
      expect(UsernameSchema.safeParse(reserved).success).toBe(false);
      expect(UsernameSchema.safeParse(reserved.toUpperCase()).success).toBe(false);
      expect(isReservedUsername(reserved)).toBe(true);
    }
  });

  it('blocca prefisso pool bot (UNO_BOT_1)', () => {
    expect(UsernameSchema.safeParse('UNO_BOT_1').success).toBe(false);
    expect(UsernameSchema.safeParse('uno_bot_alpha').success).toBe(false);
  });

  it('valida lunghezza password (8-128)', () => {
    expect(PasswordSchema.safeParse('1234567').success).toBe(false);
    expect(PasswordSchema.safeParse('12345678').success).toBe(true);
    expect(PasswordSchema.safeParse('x'.repeat(128)).success).toBe(true);
    expect(PasswordSchema.safeParse('x'.repeat(129)).success).toBe(false);
  });

  it('valida LoginPayloadSchema correttamente', () => {
    expect(
      LoginPayloadSchema.safeParse({ username: 'PlayerOne', password: 'password123' }).success
    ).toBe(true);
    expect(
      LoginPayloadSchema.safeParse({ username: 'admin', password: 'password123' }).success
    ).toBe(false);
  });

  it('RegisterPayloadSchema richiede confirmPassword coincidente', () => {
    const mismatch = RegisterPayloadSchema.safeParse({
      username: 'PlayerOne',
      password: 'password123',
      confirmPassword: 'differentPassword',
    });
    expect(mismatch.success).toBe(false);
  });

  it('RegisterPayloadSchema accetta email opzionale valida o assente', () => {
    expect(
      RegisterPayloadSchema.safeParse({
        username: 'PlayerOne',
        password: 'password123',
        confirmPassword: 'password123',
      }).success
    ).toBe(true);

    expect(
      RegisterPayloadSchema.safeParse({
        username: 'PlayerOne',
        password: 'password123',
        confirmPassword: 'password123',
        email: 'player@unoultra.gg',
      }).success
    ).toBe(true);
  });

  it('RegisterPayloadSchema rifiuta email malformata', () => {
    expect(
      RegisterPayloadSchema.safeParse({
        username: 'PlayerOne',
        password: 'password123',
        confirmPassword: 'password123',
        email: 'not-an-email',
      }).success
    ).toBe(false);
  });
});
