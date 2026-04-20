import express from 'express';
import { getUserBookings, createBooking, quickBook, cancelBooking } from '../controllers/bookingController.js';
import { verifyToken } from '../middleware/auth.js'; 

const router = express.Router();

router.get('/my', verifyToken, getUserBookings);
router.post('/', verifyToken, createBooking);
router.post('/quick', verifyToken, quickBook);
router.patch('/:id/cancel', verifyToken, cancelBooking);

export default router;