import { describe, it, expect, vi } from 'vitest';
import { successResponse, errorResponse } from '../apiResponse.js';

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('successResponse', () => {
  it('mengirim status 200 dan success:true secara default', () => {
    const res = mockRes();
    successResponse(res, 'Sukses', { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Sukses',
      data: { id: 1 },
    });
  });

  it('menggunakan statusCode custom', () => {
    const res = mockRes();
    successResponse(res, 'Dibuat', null, 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Dibuat',
      data: null,
    });
  });

  it('mengirim data null jika tidak disediakan', () => {
    const res = mockRes();
    successResponse(res);
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.data).toBeNull();
  });
});

describe('errorResponse', () => {
  it('mengirim status 500 dan success:false secara default', () => {
    const res = mockRes();
    errorResponse(res, 'Ada error', null);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Ada error',
      errors: null,
    });
  });

  it('menggunakan statusCode 400 untuk validasi', () => {
    const res = mockRes();
    errorResponse(res, 'Input tidak valid', [{ field: 'email' }], 400);
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.errors).toEqual([{ field: 'email' }]);
  });

  it('menggunakan statusCode 401 untuk unauthorized', () => {
    const res = mockRes();
    errorResponse(res, 'Token tidak valid', null, 401);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('menggunakan statusCode 404 untuk not found', () => {
    const res = mockRes();
    errorResponse(res, 'Data tidak ditemukan', null, 404);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
