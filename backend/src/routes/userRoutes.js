import { Router } from 'express';
import { getAdminUsers, adminCreateUser, getUserById } from '../controllers/userController.js';

const router = Router();

router.get('/', getAdminUsers);
router.post('/', adminCreateUser);
router.get('/:id', getUserById);

export default router;