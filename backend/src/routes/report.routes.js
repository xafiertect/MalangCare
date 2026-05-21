// backend/src/routes/report.routes.js
import { Router } from 'express';
import * as reportCtrl from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadImages } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createReportSchema, reportRatingSchema } from '../validators/report.validator.js';

const router = Router();

// Endpoint publik — tidak butuh auth
router.get('/public', reportCtrl.getPublicReports);

// Seluruh endpoint di bawah butuh auth
router.use(authenticate);

router.post('/', uploadImages, validate(createReportSchema), reportCtrl.create);
router.get('/my', reportCtrl.getMyReports);
router.get('/:id', reportCtrl.getDetails);
router.post('/:id/rate', validate(reportRatingSchema), reportCtrl.rate);

export default router;
