/**
 * routes/roomAdminRoutes.js
 * Маршруты администратора для аудиторий.
 */

import { Router } from 'express';
import roomController from '../controllers/roomController.js';

const router = Router();

router.get('/list', roomController.getAdminRooms);
router.post('/create', roomController.createRoom);
router.put('/update/:id', roomController.updateRoom);
router.delete('/delete/:id', roomController.deleteRoom);

router.post('/assign-pc', roomController.assignPCToRoom);
router.delete('/unassign-pc/:pc_key', roomController.unassignPC);

export default router;