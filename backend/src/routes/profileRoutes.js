import { Router } from 'express';
import userController from '../controllers/userController.js';

const router = Router();

router.get('/me', userController.getMe);

router.patch('/me', userController.updateMe);

export default router;