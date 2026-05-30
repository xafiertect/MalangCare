import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../validate.middleware.js';

function makeReqRes(body = {}, query = {}, params = {}) {
  const req = { body, query, params };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

const emailAgeSchema = z.object({
  body: z.object({
    email: z.string().email(),
    age: z.coerce.number().min(1),
  }),
});

const withQuerySchema = z.object({
  body: z.object({ name: z.string() }),
  query: z.object({ page: z.coerce.number().default(1) }),
});

const withParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

// ── Happy path ────────────────────────────────────────────────────────────────

describe('validate middleware — valid input', () => {
  it('memanggil next() tanpa argumen saat validasi berhasil', () => {
    const { req, res, next } = makeReqRes({ email: 'test@lapor.id', age: 25 });
    validate(emailAgeSchema)(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('meng-coerce tipe data di body (string → number)', () => {
    const { req, res, next } = makeReqRes({ email: 'test@lapor.id', age: '25' });
    validate(emailAgeSchema)(req, res, next);
    expect(req.body.age).toBe(25);
    expect(typeof req.body.age).toBe('number');
  });

  it('meng-coerce nilai query string dengan default', () => {
    const { req, res, next } = makeReqRes({ name: 'Test' }, {});
    validate(withQuerySchema)(req, res, next);
    expect(req.query.page).toBe(1);
  });

  it('memvalidasi params UUID', () => {
    const { req, res, next } = makeReqRes({}, {}, { id: '550e8400-e29b-41d4-a716-446655440000' });
    validate(withParamsSchema)(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('tidak memanggil res.json() langsung (serahkan ke errorHandler)', () => {
    const { req, res, next } = makeReqRes({ email: 'test@lapor.id', age: 1 });
    validate(emailAgeSchema)(req, res, next);
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ── Error path ────────────────────────────────────────────────────────────────

describe('validate middleware — invalid input', () => {
  it('memanggil next(error) saat validasi gagal', () => {
    const { req, res, next } = makeReqRes({ email: 'bukan-email', age: 25 });
    validate(emailAgeSchema)(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('error yang dikirim ke next adalah ZodError', () => {
    const { req, res, next } = makeReqRes({ email: '', age: -1 });
    validate(emailAgeSchema)(req, res, next);
    expect(next.mock.calls[0][0].name).toBe('ZodError');
  });

  it('tidak memanggil res.json() saat validasi gagal', () => {
    const { req, res, next } = makeReqRes({ email: 'salah' });
    validate(emailAgeSchema)(req, res, next);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('menangkap beberapa error validasi sekaligus', () => {
    const { req, res, next } = makeReqRes({ email: 'x', age: 0 });
    validate(emailAgeSchema)(req, res, next);
    const zodErr = next.mock.calls[0][0];
    expect(zodErr.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('gagal jika params UUID tidak valid', () => {
    const { req, res, next } = makeReqRes({}, {}, { id: 'bukan-uuid' });
    validate(withParamsSchema)(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('body kosong dengan schema wajib → ZodError', () => {
    const { req, res, next } = makeReqRes({});
    validate(emailAgeSchema)(req, res, next);
    expect(next.mock.calls[0][0].name).toBe('ZodError');
  });
});
