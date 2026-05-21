// backend/src/controllers/notification.controller.js
import * as notifService from '../services/notification.service.js';
import { successResponse } from '../utils/apiResponse.js';

export async function list(req, res, next) {
  try {
    const result = await notifService.getUserNotifications(req.user.id);
    return successResponse(res, 'Berhasil mendapatkan daftar notifikasi.', result, 200);
  } catch (error) {
    next(error);
  }
}

export async function readOne(req, res, next) {
  try {
    await notifService.markAsRead(req.params.id, req.user.id);
    return successResponse(res, 'Notifikasi telah ditandai sebagai dibaca.', null, 200);
  } catch (error) {
    next(error);
  }
}

export async function readAll(req, res, next) {
  try {
    await notifService.markAllAsRead(req.user.id);
    return successResponse(res, 'Seluruh notifikasi telah ditandai sebagai dibaca.', null, 200);
  } catch (error) {
    next(error);
  }
}
