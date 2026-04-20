import express from 'express';
import { getAllRooms, getRoomDetails } from '../controllers/roomController.js';

const router = express.Router();

router.get('/', getAllRooms);
router.get('/:id', getRoomDetails);

export default router;