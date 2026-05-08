/**
 * routes/userRoutes.js
 * Маршрутизация запросов администратора для пользователей.
 */

import { Router } from 'express';
import userController from '../controllers/userController.js';

const router = Router();

router.get('/', userController.getAdminUsers);
router.post('/', userController.createUser);

router.get('/:id', userController.getUserById);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
