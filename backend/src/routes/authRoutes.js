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

/**
 * Защищенный роут для отладки.
 * Сначала проверяем токен (verifyToken),
 * потом проверяем, что это Админ (isAdmin).
 */
router.get('/debug-users', verifyToken, isAdmin, authController.getDebugUsers);

export default router;
