/**
 * controllers/bookingController.js
 * Обработка запросов для бронирований
 */

import asyncHandler from '../utils/asyncHandler.js';
import bookingService from '../services/bookingService.js';


class BookingController {

    /**
     * Method: getUserBookings
     * Получить бронирования пользователя.
     */
    getUserBookings = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const result = await bookingService.getAll(userId, req.query);
        res.json(result);
    });


    /**
     * Method: createBooking
     * Создать бронирование.
     */
    createBooking = asyncHandler(async (req, res) => {
        const { pc_id, date, pair } = req.body;
        const userId = req.user.id;

        const created = await bookingService.create(userId, pc_id, date, pair);
        res.status(201).json(created);
    });

    /**
     * Method: cancelBooking
     * Отменить бронирование.
     */
    cancelBooking = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { id: userId, is_admin: isAdmin } = req.user;

        await bookingService.cancel(userId, isAdmin, id);
        res.json({ message: "Успешно отменено" });
    });

    /**
     * Method: quickBook
     * Быстрое бронирование.
     */
    quickBook = asyncHandler(async (req, res) => {
        const { date, pair, tags } = req.body;
        const userId = req.user.id;

        const result = await bookingService.quickBook(userId, date, pair, tags);
        res.status(201).json(result);
    });
}

export default new BookingController();