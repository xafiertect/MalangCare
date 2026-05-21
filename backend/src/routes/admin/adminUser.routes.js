// backend/src/routes/admin/adminUser.routes.js
import { Router } from 'express';
import * as adminUserCtrl from '../../controllers/admin/adminUser.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createAdminSchema } from '../../validators/admin.validator.js';

const router = Router();

// Hanya super_admin
router.use(authenticate);
router.use(requireRole(['super_admin']));

router.get('/', adminUserCtrl.listAdmins);
router.post('/', validate(createAdminSchema), adminUserCtrl.createAdmin);
router.patch('/:id/status', adminUserCtrl.toggleStatus);
router.post('/:id/reset-password', adminUserCtrl.resetPassword);

export default router;
