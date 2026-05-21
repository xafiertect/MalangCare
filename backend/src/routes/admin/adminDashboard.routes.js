// backend/src/routes/admin/adminDashboard.routes.js
import { Router } from 'express';
import * as dashboardCtrl from '../../controllers/admin/adminDashboard.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['admin', 'super_admin']));

router.get('/stats', dashboardCtrl.getStats);

export default router;
