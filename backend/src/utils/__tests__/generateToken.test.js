import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../generateToken.js';

const testUser  = { id: 'uuid-1234', email: 'test@lapor.id',  role: 'user' };
const testAdmin = { id: 'uuid-5678', email: 'admin@lapor.id', role: 'admin' };
const testSuper = { id: 'uuid-9999', email: 'super@lapor.id', role: 'super_admin' };

beforeAll(() => {
  process.env.JWT_SECRET          = 'test_secret_key_minimum_32_chars_xxxxxxxxx';
  process.env.JWT_REFRESH_SECRET  = 'test_refresh_secret_key_minimum_32_chars_x';
  process.env.JWT_EXPIRES_IN      = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
});

// ── generateAccessToken ───────────────────────────────────────────────────────

describe('generateAccessToken', () => {
  it('menghasilkan token JWT bertipe string', () => {
    const token = generateAccessToken(testUser);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('payload memuat id, email, dan role', () => {
    const decoded = verifyAccessToken(generateAccessToken(testUser));
    expect(decoded.id).toBe(testUser.id);
    expect(decoded.email).toBe(testUser.email);
    expect(decoded.role).toBe(testUser.role);
  });

  it('bekerja untuk role user, admin, dan super_admin', () => {
    for (const account of [testUser, testAdmin, testSuper]) {
      const decoded = verifyAccessToken(generateAccessToken(account));
      expect(decoded.role).toBe(account.role);
    }
  });

  it('dua user berbeda menghasilkan token berbeda', () => {
    expect(generateAccessToken(testUser)).not.toBe(generateAccessToken(testAdmin));
  });

  it('payload tidak memuat password_hash', () => {
    const userWithPw = { ...testUser, password_hash: 'secret' };
    const decoded = verifyAccessToken(generateAccessToken(userWithPw));
    expect(decoded).not.toHaveProperty('password_hash');
  });
});

// ── generateRefreshToken ──────────────────────────────────────────────────────

describe('generateRefreshToken', () => {
  it('menghasilkan token JWT bertipe string', () => {
    const token = generateRefreshToken(testUser);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('refresh token berbeda dari access token milik user yang sama', () => {
    expect(generateAccessToken(testUser)).not.toBe(generateRefreshToken(testUser));
  });

  it('payload memuat id, email, dan role', () => {
    const decoded = verifyRefreshToken(generateRefreshToken(testUser));
    expect(decoded.id).toBe(testUser.id);
    expect(decoded.role).toBe(testUser.role);
  });
});

// ── verifyAccessToken ─────────────────────────────────────────────────────────

describe('verifyAccessToken', () => {
  it('berhasil verifikasi token valid', () => {
    const token = generateAccessToken(testUser);
    expect(() => verifyAccessToken(token)).not.toThrow();
  });

  it('melempar error untuk string acak', () => {
    expect(() => verifyAccessToken('string.acak.banget')).toThrow();
  });

  it('melempar error untuk token kosong', () => {
    expect(() => verifyAccessToken('')).toThrow();
  });

  it('melempar error jika refresh token digunakan sebagai access token', () => {
    const refreshToken = generateRefreshToken(testUser);
    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });

  it('melempar error untuk token yang dimodifikasi (tampered)', () => {
    const token = generateAccessToken(testUser);
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ id: 'hacker', role: 'super_admin' })).toString('base64');
    expect(() => verifyAccessToken(parts.join('.'))).toThrow();
  });
});

// ── verifyRefreshToken ────────────────────────────────────────────────────────

describe('verifyRefreshToken', () => {
  it('berhasil verifikasi refresh token valid', () => {
    const token = generateRefreshToken(testUser);
    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe(testUser.id);
  });

  it('melempar error untuk access token yang digunakan sebagai refresh', () => {
    const accessToken = generateAccessToken(testUser);
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });

  it('melempar error untuk token palsu', () => {
    expect(() => verifyRefreshToken('bukan.jwt.valid')).toThrow();
  });

  it('melempar error untuk token kosong', () => {
    expect(() => verifyRefreshToken('')).toThrow();
  });
});
