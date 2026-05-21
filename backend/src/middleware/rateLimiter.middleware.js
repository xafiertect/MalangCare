// backend/src/middleware/rateLimiter.middleware.js
import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/apiResponse.js';

// Rate limiter global (100 request per menit per IP)
export const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 100, // Maksimum 100 request
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, 'Terlalu banyak permintaan dari IP Anda. Silakan coba lagi nanti.', null, 429);
  }
});

// Rate limiter untuk endpoint sensitif (seperti login dan registrasi)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 15, // Maksimum 15 request per IP per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, 'Terlalu banyak percobaan masuk/daftar. Silakan coba lagi setelah 15 menit.', null, 429);
  }
});
