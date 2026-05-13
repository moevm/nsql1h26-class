/**
 * services/bookingService.js
 * Бизнес-логика для работы с бронированиями.
 */

import BookingDao from '../dao/bookings.js';
import EquipmentDao from '../dao/equipments.js';
import withTransaction from '../utils/withTransaction.js';
import { assertStringId, validateDatePair } from '../utils/validators.js';


class BookingService {

    /**
     * Method: getAll
     * Получить список бронирований пользователя.
     * Только чтение
     */
    async getAll(userId, query = {}) {
        const {
            type = 'all',
            page = 1,
            limit = 10,
            dateFrom = '',
            dateTo = '',
            pairNumber = '',
            roomName = ''
        } = query;

        const offset = (Number(page) - 1) * Number(limit);

        // Статусы в зависимости от типа
        let statuses;
        if (type === 'active') {
            statuses = ['reserved', 'active'];
        } else if (type === 'archive') {
            statuses = ['finished', 'cancelled', 'missed'];
        } else {
            // 'all' — максимально близко к старому поведению findAll (всё, кроме cancelled)
            statuses = ['reserved', 'active', 'finished', 'missed'];
        }

        const filters = { dateFrom, dateTo, pairNumber, roomName };

        return await BookingDao.findAll(userId, statuses, filters, {
            offset,
            limit: Number(limit)
        });
    }

    /**
     * Method: getById
     * Получить бронирование по ID.
     * Только чтение
     */
    async getById(id) {
        assertStringId(id, "ID бронирования");

        const booking = await BookingDao.findById(id);
        if (!booking) {
            const e = new Error("Бронирование не найдено");
            e.status = 404;
            throw e;
        }
        return booking;
    }

    /**
     * Method: create
     * Создать бронирование.
     */
    async create(userId, pcId, date, pair) {
        assertStringId(pcId, "ID компьютера");

        const interval = validateDatePair(date, pair);

        const pcKey = pcId.includes('/') ? pcId.split('/').pop() : pcId;
        const pc = await EquipmentDao.findById(pcKey);

        if (!pc) {
            const e = new Error("Компьютер не найден");
            e.status = 404;
            throw e;
        }
        if (pc.status !== 'active') {
            const e = new Error("Компьютер неактивен или на обслуживании");
            e.status = 400;
            throw e;
        }

        const fromId = `Users/${userId}`;
        const toId = pcId.includes('/') ? pcId : `Computers/${pcId}`;

        return withTransaction({ write: ['Bookings'], read: ['Computers'] }, async (transaction) => {
            const existing = await BookingDao.findActiveByPC(toId, interval.start, transaction);
            if (existing.length > 0) {
                const e = new Error("Это место уже забронировано");
                e.status = 409;
                throw e;
            }

            const now = new Date().toISOString();
            const document = {
                _from: fromId,
                _to: toId,
                start_at: interval.start,
                end_at: interval.end,
                status: 'reserved',
                total_work_time_minutes: 0,
                meta: { created_at: now },
                history: [{
                    old_status: null,
                    new_status: 'reserved',
                    changed_at: now,
                    changed_by: fromId
                }]
            };

            return await BookingDao.insert(document, transaction);
        });
    }

    /**
     * Method: cancel
     * Отменить бронирование.
     */
    async cancel(userId, isAdmin, bookingId) {
        assertStringId(bookingId, "ID бронирования");

        const booking = await this.getById(bookingId);
        const ownerId = booking._from.split('/').pop();

        if (!isAdmin && ownerId !== userId) {
            const e = new Error("Нет прав на отмену этого бронирования");
            e.status = 403;
            throw e;
        }

        if (booking.status === 'cancelled') {
            const e = new Error("Бронирование уже отменено");
            e.status = 400;
            throw e;
        }

        const now = new Date().toISOString();
        const fromId = `Users/${userId}`;

        const updateData = {
            status: 'cancelled',
            history: [
                ...(booking.history || []),
                {
                    old_status: booking.status,
                    new_status: 'cancelled',
                    changed_at: now,
                    changed_by: fromId
                }
            ]
        };

        return await BookingDao.update(bookingId, updateData);
    }

    /**
     * Method: quickBook
     * Быстрое бронирование.
     */
    async quickBook(userId, date, pair, tags) {
        const interval = validateDatePair(date, pair);
        const tagList = tags ? tags.split(',').map(t => t.trim().toLowerCase()) : [];
        const fromId = `Users/${userId}`;

        return withTransaction({ read: ['Computers'], write: ['Bookings'] }, async (transaction) => {
            const freePC = await BookingDao.findFreePC({ startTime: interval.start, tagList }, transaction);
            if (!freePC) {
                const e = new Error("Нет свободных ПК по вашему запросу");
                e.status = 404;
                throw e;
            }

            const now = new Date().toISOString();
            const document = {
                _from: fromId,
                _to: freePC._id,
                start_at: interval.start,
                end_at: interval.end,
                status: 'reserved',
                total_work_time_minutes: 0,
                meta: { created_at: now },
                history: [{
                    old_status: null,
                    new_status: 'reserved',
                    changed_at: now,
                    changed_by: fromId
                }]
            };

            await BookingDao.insert(document, transaction);
            return { message: "Успешно забронировано!", pc_name: freePC.name };
        });
    }
}

export default new BookingService();