// backend/src/middleware/errorHandler.middleware.js
import logger from '../utils/logger.js';
import { errorResponse } from '../utils/apiResponse.js';

export default function errorHandler(err, req, res, next) {
  logger.error('Terjadi uncaught exception:', err);

  // Zod Validation Errors
  if (err.name === 'ZodError') {
    return errorResponse(res, 'Validasi input gagal', err.errors, 400);
  }

  // Prisma Errors
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      return errorResponse(res, 'Input tidak boleh duplikat', { fields: err.meta?.target }, 409);
    }
    if (err.code === 'P2025') {
      return errorResponse(res, 'Resource tidak ditemukan', null, 404);
    }
  }

  // Multer Error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 'Ukuran file melebihi batas maksimum 5MB', null, 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Token tidak valid. Silakan login kembali.', null, 401);
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token kedaluwarsa. Silakan lakukan refresh.', null, 401);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan internal pada server' : err.message;

  return errorResponse(res, message, null, statusCode);
}
