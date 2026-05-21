// backend/src/routes/user.routes.js
import { Router } from 'express';
import * as userCtrl from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadAvatar } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/profile', userCtrl.getProfile);
router.patch('/profile', userCtrl.updateProfile);
router.post('/profile/avatar', uploadAvatar, userCtrl.uploadAvatar);

export default router;
