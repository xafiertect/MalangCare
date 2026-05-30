// backend/src/routes/auth.routes.js
import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema, verifyOtpSchema } from '../validators/auth.validator.js';
import { forgotPasswordSchema, resetPasswordSchema, resendOtpSchema } from '../validators/admin.validator.js';
import { authRateLimiter } from '../middleware/rateLimiter.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authCtrl.register);
router.post('/verify-otp', validate(verifyOtpSchema), authCtrl.verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), authCtrl.resendOtp);
router.post('/login', authRateLimiter, validate(loginSchema), authCtrl.login);
router.post('/refresh', authCtrl.refresh);
router.post('/logout', authenticate, authCtrl.logout);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authCtrl.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authCtrl.resetPassword);
router.post('/google', authRateLimiter, authCtrl.googleLogin);

export default router;
