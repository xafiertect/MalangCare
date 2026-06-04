// backend/src/middleware/validate.middleware.js

/**
 * Middleware untuk memvalidasi request body, params, atau query menggunakan schema Zod.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    // Masukkan data ter-parse kembali ke request
    // Gunakan ?? agar hanya override jika schema mendefinisikan field tersebut
    req.body = parsed.body ?? req.body;
    req.query = parsed.query ?? req.query;
    req.params = parsed.params ?? req.params;

    next();
  } catch (error) {
    next(error); // Lempar error ke central error handler
  }
};

export default validate;
