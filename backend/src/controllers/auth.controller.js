// backend/src/controllers/auth.controller.js
import * as authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);
    return successResponse(res, 'Pendaftaran berhasil. Kode OTP telah dikirimkan ke email Anda.', result, 201);
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    await authService.verifyUserOtp(req.body);
    return successResponse(res, 'Akun Anda berhasil diverifikasi. Silakan masuk.', null, 200);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.loginUserOrAdmin(req.body);
    return successResponse(res, 'Masuk berhasil.', result, 200);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return errorResponse(res, 'Refresh token wajib disertakan.', null, 400);
    }
    const result = await authService.rotateSessionToken(refreshToken);
    return successResponse(res, 'Sesi berhasil diperbarui.', result, 200);
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return errorResponse(res, 'Refresh token wajib disertakan.', null, 400);
    }
    await authService.logoutSession(req.token, refreshToken, req.user.id);
    return successResponse(res, 'Keluar berhasil.', null, 200);
  } catch (error) {
    next(error);
  }
}

export async function resendOtp(req, res, next) {
  try {
    await authService.resendOtp(req.body);
    return successResponse(res, 'Kode OTP baru telah dikirimkan ke email Anda.', null, 200);
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPassword(req.body);
    return successResponse(res, 'Jika email terdaftar, link reset password telah dikirimkan.', null, 200);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body);
    return successResponse(res, 'Password berhasil diperbarui. Silakan login dengan password baru.', null, 200);
  } catch (error) {
    next(error);
  }
}
