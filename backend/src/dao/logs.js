/**
 * dao/logs.js
 * Read-only агрегация бронирований для админ-панели
 */

import db from '../config/db.js';
import { aql } from 'arangojs';

class LogDao {
    constructor() {
        this.collection = db.collection('Bookings');
    }

    /**
     * Method: findAll
     * Получить логи бронирований с фильтрами и пагинацией.
     */
    async findAll(filters, { offset, limit }) {
        const {
            dateFrom = '',
            dateTo = '',
            status = '',
            bookingId = '',
            fullName = '',
            email = '',
            groupCode = '',
            roomName = ''
        } = filters;

        const cursor = await db.query(aql`
            LET all_logs = (
                FOR b IN Bookings
                    LET user = DOCUMENT(b._from)
                    LET computer = DOCUMENT(b._to)
                    
                    FILTER ${dateFrom} == "" OR b.start_at >= ${dateFrom}
                    FILTER ${dateTo} == "" OR b.start_at <= ${dateTo}
                    FILTER ${status} == "" OR b.status == ${status}
                    FILTER ${bookingId} == "" OR CONTAINS(LOWER(b._key), LOWER(${bookingId}))
                    FILTER ${fullName} == "" OR CONTAINS(LOWER(user.full_name), LOWER(${fullName}))
                    FILTER ${email} == "" OR CONTAINS(LOWER(user.email), LOWER(${email}))
                    FILTER ${groupCode} == "" OR user.group_code == ${groupCode}
                    FILTER ${roomName} == "" OR CONTAINS(LOWER(computer.room_id || ""), LOWER(${roomName}))
                    
                    SORT b.start_at DESC
                    
                    RETURN {
                        id: b._key,
                        date: b.start_at,
                        created_at: b.meta.created_at,
                        status: b.status,
                        statusText: b.status == 'finished' ? 'Завершено' 
                                  : b.status == 'missed' ? 'Неявка' 
                                  : b.status == 'cancelled' ? 'Отменено'
                                  : b.status == 'reserved' ? 'Забронировано' 
                                  : b.status == 'active' ? 'Активно' 
                                  : 'Неизвестно',
                        user_name: user.full_name,
                        user_email: user.email,
                        group_code: user.group_code,
                        room_name: computer.room_id || "Не указана",
                        pc_name: computer._key,
                        history: b.history || []
                    }
            )
            
            RETURN {
                total: LENGTH(all_logs),
                data: SLICE(all_logs, ${offset}, ${limit})
            }
        `);

        return await cursor.next();
    }
}

export default new LogDao();