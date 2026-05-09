/**
 * adminRoutes.js
 * Сборник административных маршрутов.
 */

import { Router } from 'express';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js'
import userRoutes from './userRoutes.js';
import equipmentRoutes from './equipmentRoutes.js';
import roomAdminRoutes from './roomAdminRoutes.js';
import { getBookingLogs } from '../controllers/logController.js';

const router = Router();

router.use(verifyToken, isAdmin);

router.use('/users', userRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/rooms', roomAdminRoutes);

router.get('/logs', getBookingLogs);


export default router;



