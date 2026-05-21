// backend/src/routes/map.routes.js
import { Router } from 'express';
import { getMapReports } from '../controllers/map.controller.js';

const router = Router();

// Endpoint publik — diakses guest maupun user (tanpa auth)
router.get('/', getMapReports);

export default router;
