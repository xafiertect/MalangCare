// backend/src/routes/admin/adminReport.routes.js
import { Router } from 'express';
import * as adminReportCtrl from '../../controllers/admin/adminReport.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { uploadImages, uploadSingleImage } from '../../middleware/upload.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { updateReportStatusSchema } from '../../validators/report.validator.js';
import { addAdminNoteSchema } from '../../validators/admin.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['admin', 'super_admin']));

router.get('/export', adminReportCtrl.exportCsv);
router.get('/', adminReportCtrl.listReports);
router.get('/:id', adminReportCtrl.getReportDetail);
router.patch('/:id/status', validate(updateReportStatusSchema), adminReportCtrl.updateStatus);
router.post('/:id/evidence', uploadImages, adminReportCtrl.uploadEvidence);
router.post('/:id/notes', validate(addAdminNoteSchema), adminReportCtrl.addNote);

export default router;
