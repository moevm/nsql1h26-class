/**
 * routes/roomRoutes.js
 * Публичные маршруты для аудиторий.
 */

import { Router } from 'express';
import roomController from '../controllers/roomController.js';

const router = Router();

router.get('/pcs/available', roomController.getAvailablePCs);

router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomDetails);


export default router;