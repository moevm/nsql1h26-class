/**
 * routes/bookingRoutes.js
 * Маршруты для бронирований.
 */

import { Router } from 'express';
import bookingController from '../controllers/bookingController.js';


const router = Router();

router.get('/', bookingController.getUserBookings);
router.post('/', bookingController.createBooking);
router.post('/quick', bookingController.quickBook);
router.delete('/:id', bookingController.cancelBooking);
router.get('/mybookings', bookingController.getUserBookingsPaged);

export default router;