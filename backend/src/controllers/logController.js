/**
 * controllers/logController.js
 * Обработка запросов для логов бронирований (admin only).
 */

import asyncHandler from '../utils/asyncHandler.js';
import logService from '../services/logService.js';

class LogController {

    /**
     * Method: getBookingLogs
     * Получить логи бронирований.
     */
    getBookingLogs = asyncHandler(async (req, res) => {
        const result = await logService.getAll(req.query);
        res.json(result || { total: 0, data: [] });
    });
}

export default new LogController();