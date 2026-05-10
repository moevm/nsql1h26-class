/**
 * services/logService.js
 * Бизнес-логика для логов бронирований.
 */

import LogDao from '../dao/logs.js';
import { validatePagination } from '../utils/validators.js';

class LogService {
    /**
     * Method: getAll
     * Получить логи бронирований с фильтрами и пагинацией.
     * Нормализует dateTo (добавляет конец дня, если передана только дата).
     */
    async getAll(query) {
        const {
            dateFrom = '',
            dateTo = '',
            status = '',
            bookingId = '',
            fullName = '',
            email = '',
            groupCode = '',
            roomName = '',
            page = 1,
            limit = 10
        } = query;

        const pagination = validatePagination(page, limit);
        const offset = (pagination.page - 1) * pagination.limit;

        // Нормализация dateTo: если передана дата без времени — добавляем конец дня
        let normalizedDateTo = dateTo;
        if (dateTo && !dateTo.includes('T')) {
            normalizedDateTo = `${dateTo}T23:59:59Z`;
        }

        const filters = {
            dateFrom,
            dateTo: normalizedDateTo,
            status,
            bookingId,
            fullName,
            email,
            groupCode,
            roomName
        };

        return await LogDao.findAll(filters, { offset, limit: pagination.limit });
    }
}

export default new LogService();