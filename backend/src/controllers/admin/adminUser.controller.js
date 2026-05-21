// backend/src/controllers/admin/adminUser.controller.js
import * as adminUserService from '../../services/admin/adminUser.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export async function listAdmins(req, res, next) {
  try {
    const result = await adminUserService.listAdmins();
    return successResponse(res, 'Berhasil mendapatkan daftar admin.', result);
  } catch (error) {
    next(error);
  }
}

export async function createAdmin(req, res, next) {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
    const result = await adminUserService.createAdmin(req.body, req.user.id, ipAddress);
    return successResponse(res, 'Akun admin baru berhasil dibuat.', result, 201);
  } catch (error) {
    next(error);
  }
}

export async function toggleStatus(req, res, next) {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
    const isActive = req.body.is_active === true || req.body.is_active === 'true';
    const result = await adminUserService.toggleAdminStatus(req.params.id, isActive, req.user.id, ipAddress);
    return successResponse(res, `Admin berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}.`, result);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    await adminUserService.resetAdminPasswordByEmail(req.params.id, req.user.id);
    return successResponse(res, 'Password sementara telah dikirim ke email admin.');
  } catch (error) {
    next(error);
  }
}
