// backend/src/controllers/user.controller.js
import * as userService from '../services/user.service.js';
import { successResponse } from '../utils/apiResponse.js';

export async function getProfile(req, res, next) {
  try {
    const result = await userService.getProfile(req.user.id);
    return successResponse(res, 'Berhasil mendapatkan profil.', result);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const result = await userService.updateProfile(req.user.id, req.body);
    return successResponse(res, 'Profil berhasil diperbarui.', result);
  } catch (error) {
    next(error);
  }
}

export async function uploadAvatar(req, res, next) {
  try {
    const result = await userService.uploadAvatar(req.user.id, req.file);
    return successResponse(res, 'Foto profil berhasil diperbarui.', result);
  } catch (error) {
    next(error);
  }
}
