/**
 * adminRoutes.js
 * Маршрутизация запросов администратора.
 */

import { Router } from 'express';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js'
import userRoutes from './userRoutes.js';
import equipmentRoutes from './equipmentRoutes.js';

const router = Router();
router.use(verifyToken, isAdmin);

router.use('/users', userRoutes);
router.use('/equipment', equipmentRoutes);

export default router;



