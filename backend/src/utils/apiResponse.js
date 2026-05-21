// backend/src/utils/apiResponse.js

/**
 * Kirim response sukses terstandarisasi.
 */
export const successResponse = (res, message = 'Sukses', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Kirim response error terstandarisasi.
 */
export const errorResponse = (res, message = 'Terjadi kesalahan', errors = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
