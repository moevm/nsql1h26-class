import { Router } from 'express';
import userController from '../controllers/userController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await userController.getMe(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/me', verifyToken, userController.updateMe);

export default router;