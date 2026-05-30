import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, verifyOtpSchema } from '../auth.validator.js';

// ── registerSchema ────────────────────────────────────────────────────────────

describe('registerSchema', () => {
  const valid = {
    body: {
      name: 'Budi Santoso',
      email: 'budi@lapor.id',
      password: 'Password123',
      confirmPassword: 'Password123',
    },
  };

  it('lolos untuk input valid (tanpa NIK dan nomor telepon)', () => {
    expect(() => registerSchema.parse(valid)).not.toThrow();
  });

  it('data yang di-parse dikembalikan dengan benar', () => {
    const result = registerSchema.parse(valid);
    expect(result.body.name).toBe('Budi Santoso');
    expect(result.body.email).toBe('budi@lapor.id');
  });

  // name
  it('gagal jika name kurang dari 3 karakter', () => {
    expect(() => registerSchema.parse({ body: { ...valid.body, name: 'Bu' } }))
      .toThrow('minimal 3 karakter');
  });

  it('gagal jika name kosong', () => {
    expect(() => registerSchema.parse({ body: { ...valid.body, name: '' } })).toThrow();
  });

  it('lolos untuk name tepat 3 karakter', () => {
    expect(() => registerSchema.parse({ body: { ...valid.body, name: 'Ali' } })).not.toThrow();
  });

  // email
  it('gagal jika email tidak mengandung @', () => {
    expect(() => registerSchema.parse({ body: { ...valid.body, email: 'bukanEmail' } })).toThrow();
  });

  it('gagal jika email tidak mengandung domain', () => {
    expect(() => registerSchema.parse({ body: { ...valid.body, email: 'user@' } })).toThrow();
  });

  it('lolos untuk berbagai format email valid', () => {
    const emails = ['a@b.co', 'user.name+tag@example.org', 'test123@lapor.id'];
    for (const email of emails) {
      expect(() => registerSchema.parse({ body: { ...valid.body, email } })).not.toThrow();
    }
  });

  // password
  it('gagal jika password kurang dari 8 karakter', () => {
    expect(() => registerSchema.parse({ body: { ...valid.body, password: 'abc1234', confirmPassword: 'abc1234' } }))
      .toThrow('minimal 8 karakter');
  });

  it('lolos untuk password tepat 8 karakter', () => {
    expect(() => registerSchema.parse({ body: { ...valid.body, password: 'Pass1234', confirmPassword: 'Pass1234' } }))
      .not.toThrow();
  });

  // confirmPassword
  it('gagal jika password dan konfirmasi tidak cocok', () => {
    expect(() => registerSchema.parse({ body: { ...valid.body, confirmPassword: 'BerbedaPassword' } }))
      .toThrow('Konfirmasi password tidak cocok');
  });

  it('lolos jika password dan konfirmasi cocok persis', () => {
    const pw = 'SamaSama123!';
    expect(() => registerSchema.parse({ body: { ...valid.body, password: pw, confirmPassword: pw } }))
      .not.toThrow();
  });
});

// ── loginSchema ───────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  const valid = {
    body: { email: 'budi@lapor.id', password: 'Password123' },
  };

  it('lolos untuk input valid', () => {
    expect(() => loginSchema.parse(valid)).not.toThrow();
  });

  it('gagal jika email bukan format email valid', () => {
    expect(() => loginSchema.parse({ body: { ...valid.body, email: 'bukanEmail' } })).toThrow();
  });

  it('gagal jika password kosong', () => {
    expect(() => loginSchema.parse({ body: { ...valid.body, password: '' } })).toThrow();
  });

  it('lolos meski password hanya 1 karakter (login tidak batasi panjang)', () => {
    expect(() => loginSchema.parse({ body: { ...valid.body, password: 'x' } })).not.toThrow();
  });

  it('gagal jika email tidak disertakan', () => {
    expect(() => loginSchema.parse({ body: { password: 'Pass123' } })).toThrow();
  });

  it('gagal jika password tidak disertakan', () => {
    expect(() => loginSchema.parse({ body: { email: 'budi@lapor.id' } })).toThrow();
  });
});

// ── verifyOtpSchema ───────────────────────────────────────────────────────────

describe('verifyOtpSchema', () => {
  const valid = {
    body: { userId: '550e8400-e29b-41d4-a716-446655440000', token: '123456' },
  };

  it('lolos untuk input valid', () => {
    expect(() => verifyOtpSchema.parse(valid)).not.toThrow();
  });

  it('gagal jika userId bukan UUID valid', () => {
    expect(() => verifyOtpSchema.parse({ body: { ...valid.body, userId: 'bukan-uuid' } }))
      .toThrow('User ID tidak valid');
  });

  it('gagal jika userId kosong', () => {
    expect(() => verifyOtpSchema.parse({ body: { ...valid.body, userId: '' } })).toThrow();
  });

  it('gagal jika OTP kurang dari 6 karakter', () => {
    expect(() => verifyOtpSchema.parse({ body: { ...valid.body, token: '12345' } }))
      .toThrow('6 digit');
  });

  it('gagal jika OTP lebih dari 6 karakter', () => {
    expect(() => verifyOtpSchema.parse({ body: { ...valid.body, token: '1234567' } })).toThrow();
  });

  it('lolos untuk OTP tepat 6 karakter', () => {
    expect(() => verifyOtpSchema.parse({ body: { ...valid.body, token: '000000' } })).not.toThrow();
  });
});
