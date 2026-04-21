/**
 * equipmentRoutes.js
 * Маршрутизация запросов администратор для оборудования.
 */

import { Router } from 'express';
import equipmentController from '../controllers/equipmentController.js';

const router = Router();

router.get('/', equipmentController.getAllEquipment);
router.post('/', equipmentController.createEquipment);

router.get('/:id', equipmentController.getEquipmentById);
router.patch('/:id', equipmentController.updateEquipment);
router.delete('/:id', equipmentController.deleteEquipment);

export default router;