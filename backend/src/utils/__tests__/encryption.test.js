import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { encrypt, decrypt } from '../encryption.js';

const VALID_KEY = 'a'.repeat(64);

beforeAll(() => { process.env.ENCRYPTION_KEY = VALID_KEY; });
afterAll(() => { delete process.env.ENCRYPTION_KEY; });

// ── encrypt ───────────────────────────────────────────────────────────────────

describe('encrypt', () => {
  it('menghasilkan string format iv:authTag:ciphertext', () => {
    const parts = encrypt('3274010101010001').split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(24);  // 12 bytes IV = 24 hex chars
    expect(parts[1]).toHaveLength(32);  // 16 bytes authTag = 32 hex chars
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it('setiap enkripsi menghasilkan output berbeda (IV acak)', () => {
    const text = '3274010101010001';
    expect(encrypt(text)).not.toBe(encrypt(text));
  });

  it('mengembalikan null jika input string kosong', () => {
    expect(encrypt('')).toBeNull();
  });

  it('mengembalikan null jika input null', () => {
    expect(encrypt(null)).toBeNull();
  });

  it('mengembalikan null jika input undefined', () => {
    expect(encrypt(undefined)).toBeNull();
  });

  it('dapat mengenkripsi teks panjang', () => {
    const longText = 'a'.repeat(500);
    const result = encrypt(longText);
    expect(result).toBeTruthy();
    expect(result.split(':')).toHaveLength(3);
  });

  it('melempar error jika ENCRYPTION_KEY kurang dari 64 karakter', () => {
    const original = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'pendek';
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY tidak valid');
    process.env.ENCRYPTION_KEY = original;
  });

  it('melempar error jika ENCRYPTION_KEY lebih dari 64 karakter', () => {
    const original = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'a'.repeat(65);
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY tidak valid');
    process.env.ENCRYPTION_KEY = original;
  });

  it('melempar error jika ENCRYPTION_KEY tidak ada', () => {
    const original = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY tidak valid');
    process.env.ENCRYPTION_KEY = original;
  });
});

// ── decrypt ───────────────────────────────────────────────────────────────────

describe('decrypt', () => {
  it('round-trip: decrypt(encrypt(x)) === x', () => {
    const original = '3274010101010001';
    expect(decrypt(encrypt(original))).toBe(original);
  });

  it('round-trip untuk berbagai jenis teks', () => {
    const samples = [
      'NIK16DigitNumber',
      'email@contoh.com',
      'Teks dengan spasi dan 123 angka!',
      '   spasi di awal dan akhir   ',
      'unicode: áéíóú ñ',
    ];
    for (const text of samples) {
      expect(decrypt(encrypt(text))).toBe(text);
    }
  });

  it('mengembalikan null jika input string kosong', () => {
    expect(decrypt('')).toBeNull();
  });

  it('mengembalikan null jika input null', () => {
    expect(decrypt(null)).toBeNull();
  });

  it('melempar error jika format tidak valid (kurang dari 3 bagian)', () => {
    expect(() => decrypt('hanyasatu')).toThrow('Format teks terenkripsi tidak valid');
    expect(() => decrypt('dua:bagian')).toThrow('Format teks terenkripsi tidak valid');
  });

  it('melempar error jika format terlalu banyak bagian', () => {
    expect(() => decrypt('a:b:c:d')).toThrow('Format teks terenkripsi tidak valid');
  });

  it('melempar error jika ciphertext dimodifikasi (tampered)', () => {
    const encrypted = encrypt('data rahasia');
    const parts = encrypted.split(':');
    parts[2] = parts[2].split('').reverse().join(''); // balik urutan hex
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  it('melempar error jika ENCRYPTION_KEY tidak ada saat decrypt', () => {
    const original = process.env.ENCRYPTION_KEY;
    const encrypted = encrypt('data');
    delete process.env.ENCRYPTION_KEY;
    expect(() => decrypt(encrypted)).toThrow('ENCRYPTION_KEY tidak valid');
    process.env.ENCRYPTION_KEY = original;
  });
});
