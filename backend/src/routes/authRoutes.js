/**
 * authRoutes.js
 * Маршрутизация аутентификации.
 */

import { Router } from 'express';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';
import authController from '../controllers/authController.js';

const router = Router();

/**
 * Публичные роуты, доступные всем
 */
// router.post('/register', authController.register);
router.post('/login', authController.login);


export default router;
