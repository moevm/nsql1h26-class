import { Router } from 'express';
import authController from '../controllers/authController.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Временная проверка для браузера
router.get('/debug-users', authController.getDebugUsers);

export default router;
