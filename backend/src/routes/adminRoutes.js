/**
 * adminRoutes.js
 * Сборник административных маршрутов.
 */

import { Router } from 'express';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js'
import userRoutes from './userRoutes.js';
import equipmentRoutes from './equipmentRoutes.js';
import roomAdminRoutes from './roomAdminRoutes.js';
import logController from '../controllers/logController.js';
import adminController from '../controllers/adminController.js';

const router = Router();

router.use(verifyToken, isAdmin);

router.use('/users', userRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/rooms', roomAdminRoutes);

router.get('/logs', logController.getBookingLogs);

router.get('/export-all', adminController.exportData);
router.post('/import-all', adminController.importData);


export default router;



