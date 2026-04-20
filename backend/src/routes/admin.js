import express from 'express';
import { getAdminUsers, adminCreateUser, getUserById } from '../controllers/userController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js'; 

const router = express.Router();

router.get('/users', verifyToken, isAdmin, getAdminUsers);
router.post('/users', verifyToken, isAdmin, adminCreateUser);
router.get('/users/:id', verifyToken, isAdmin, getUserById);

export default router;