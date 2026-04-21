/**
 * equipmentRoutes.js
 * Маршрутизация запросов администратор для оборудования.
 */

import { Router } from 'express';
import {
    getAllEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment
} from '../controllers/equipmentController.js';

const router = Router();

router.get('/', getAllEquipment);
router.post('/', createEquipment);

router.get('/:id', getEquipmentById);
router.patch('/:id', updateEquipment);
router.delete('/:id', deleteEquipment);

export default router;