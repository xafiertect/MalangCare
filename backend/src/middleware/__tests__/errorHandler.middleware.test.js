import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

vi.mock('../../utils/logger.js', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import errorHandler from '../errorHandler.middleware.js';

function makeReqRes() {
  const req = { method: 'POST', url: '/api/test', user: { id: 'u1' } };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

// Helper: simulasi createError dari auth.service.js
const createError = (message, statusCode) =>
  Object.assign(new Error(message), { statusCode });

describe('errorHandler — Zod & Validasi', () => {
  beforeEach(() => { process.env.NODE_ENV = 'development'; });

  it('menangani ZodError dengan status 400', () => {
    const { req, res, next } = makeReqRes();
    let zodErr;
    try { z.string().email().parse('bukan-email'); } catch (e) { zodErr = e; }
    errorHandler(zodErr, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('Validasi input gagal');
    expect(Array.isArray(payload.errors)).toBe(true);
  });

  it('menyertakan daftar errors dari ZodError', () => {
    const { req, res, next } = makeReqRes();
    let zodErr;
    try { z.object({ email: z.string().email(), age: z.number() }).parse({ email: 'x', age: 'y' }); }
    catch (e) { zodErr = e; }
    errorHandler(zodErr, req, res, next);
    expect(res.json.mock.calls[0][0].errors.length).toBeGreaterThan(0);
  });
});

describe('errorHandler — Prisma Errors', () => {
  it('P2002 (unique constraint) → 409', () => {
    const { req, res, next } = makeReqRes();
    errorHandler({ code: 'P2002', meta: { target: ['email'] } }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toContain('duplikat');
  });

  it('P2025 (record not found) → 404', () => {
    const { req, res, next } = makeReqRes();
    errorHandler({ code: 'P2025' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('Prisma error lain tidak masuk ke handler khusus, fallback statusCode', () => {
    const { req, res, next } = makeReqRes();
    errorHandler({ code: 'P1001', message: 'DB unreachable', statusCode: 503 }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
  });
});

describe('errorHandler — JWT Errors', () => {
  it('JsonWebTokenError → 401', () => {
    const { req, res, next } = makeReqRes();
    errorHandler({ name: 'JsonWebTokenError', message: 'invalid signature' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toContain('Token tidak valid');
  });

  it('TokenExpiredError → 401', () => {
    const { req, res, next } = makeReqRes();
    errorHandler({ name: 'TokenExpiredError', message: 'jwt expired' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toContain('kedaluwarsa');
  });
});

describe('errorHandler — Multer Errors', () => {
  it('LIMIT_FILE_SIZE → 400 dengan pesan 5MB', () => {
    const { req, res, next } = makeReqRes();
    errorHandler({ code: 'LIMIT_FILE_SIZE' }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toContain('5MB');
  });
});

describe('errorHandler — createError (statusCode dari service)', () => {
  beforeEach(() => { process.env.NODE_ENV = 'development'; });

  it('401 — email atau password salah', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(createError('Email atau password salah.', 401), req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toBe('Email atau password salah.');
  });

  it('403 — akun belum diverifikasi', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(createError('Akun Anda belum diverifikasi.', 403), req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('403 — akun dinonaktifkan', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(createError('Akun Anda dinonaktifkan.', 403), req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('409 — email sudah terdaftar', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(createError('Email sudah terdaftar.', 409), req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('423 — akun terkunci', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(createError('Akun Anda terkunci karena terlalu banyak percobaan.', 423), req, res, next);
    expect(res.status).toHaveBeenCalledWith(423);
  });

  it('400 — OTP tidak cocok', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(createError('Kode OTP tidak cocok atau sudah digunakan.', 400), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 — token reset tidak valid', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(createError('Token reset tidak valid atau sudah digunakan.', 400), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('501 — Google OAuth belum dikonfigurasi', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(createError('Google OAuth belum dikonfigurasi di server.', 501), req, res, next);
    expect(res.status).toHaveBeenCalledWith(501);
  });
});

describe('errorHandler — Fallback & Environment', () => {
  it('fallback ke 500 jika tidak ada statusCode', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(new Error('Unknown error'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('di production menyembunyikan pesan error internal', () => {
    process.env.NODE_ENV = 'production';
    const { req, res, next } = makeReqRes();
    errorHandler(new Error('Detail sensitif DB'), req, res, next);
    const payload = res.json.mock.calls[0][0];
    expect(payload.message).not.toContain('Detail sensitif DB');
    expect(payload.message).toContain('internal');
  });

  it('di production tidak menyembunyikan error dengan statusCode (error terencana)', () => {
    process.env.NODE_ENV = 'production';
    const { req, res, next } = makeReqRes();
    errorHandler(createError('Email sudah terdaftar.', 409), req, res, next);
    // Error terencana (statusCode set) → pesan tetap tampil di production
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('response selalu punya shape: { success, message, errors }', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(new Error('test'), req, res, next);
    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty('success', false);
    expect(payload).toHaveProperty('message');
    expect(payload).toHaveProperty('errors');
  });

  it('tidak memanggil next()', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(new Error('test'), req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});
