// backend/src/middleware/auth.middleware.js
import { verifyAccessToken } from '../utils/generateToken.js';
import redis from '../config/redis.js';
import prisma from '../config/database.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Middleware untuk memvalidasi JWT Access Token dan mengecek blacklist di Redis.
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Akses ditolak. Token tidak disediakan.', null, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Cek blacklist di Redis (misal setelah logout)
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return errorResponse(res, 'Token sudah dinonaktifkan. Silakan login kembali.', null, 401);
    }

    // 2. Verifikasi token JWT
    const decoded = verifyAccessToken(token);

    // 3. Masukkan data user ke request
    req.user = decoded;
    
    // 4. Periksa apakah user/admin masih aktif di database
    if (decoded.role === 'user') {
      const activeUser = await prisma.user.findUnique({
        where: { id: decoded.id }
      });
      if (!activeUser || !activeUser.is_active || !activeUser.is_verified) {
        return errorResponse(res, 'Akun Anda dinonaktifkan atau belum diverifikasi.', null, 403);
      }
    } else {
      const activeAdmin = await prisma.admin.findUnique({
        where: { id: decoded.id }
      });
      if (!activeAdmin || !activeAdmin.is_active) {
        return errorResponse(res, 'Akun admin dinonaktifkan.', null, 403);
      }
    }

    req.token = token; // Simpan token mentah untuk keperluan blacklist
    next();
  } catch (error) {
    return errorResponse(res, 'Sesi berakhir. Token tidak valid atau kedaluwarsa.', null, 401);
  }
};

/**
 * Middleware otorisasi berdasarkan role pengguna.
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Akses ditolak. Anda tidak memiliki izin.', null, 403);
    }
    next();
  };
};
