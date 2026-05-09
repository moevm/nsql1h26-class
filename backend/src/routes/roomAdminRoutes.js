/**
 * routes/roomAdminRoutes.js
 * Маршруты администратора для аудиторий.
 */

import { Router } from 'express';
import roomController from '../controllers/roomController.js';

const router = Router();

router.patch('/pcs/:pc_key', roomController.assignPCToRoom);
router.delete('/pcs/:pc_key', roomController.unassignPC);

router.get('/', roomController.getAdminRooms);
router.post('/', roomController.createRoom);
router.put('/:id', roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);


export default router;