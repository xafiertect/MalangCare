// backend/src/routes/notification.routes.js
import { Router } from 'express';
import * as notifCtrl from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', notifCtrl.list);
router.patch('/read-all', notifCtrl.readAll);
router.patch('/:id/read', notifCtrl.readOne);

export default router;
