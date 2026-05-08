import db from '../config/db.js';
import { aql } from 'arangojs';
import asyncHandler from '../utils/asyncHandler.js';

export const getBookingLogs = asyncHandler(async (req, res) => {
    const { 
        dateFrom = "", 
        dateTo = "", 
        status = "", 
        fullName = "", 
        groupCode = "", 
        bookingId = "", 
        email = "", 
        roomName = "", 
        page = 1, 
        limit = 10 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const countLimit = Number(limit);

    const cursor = await db.query(aql`
        LET all_logs = (
            FOR b IN Bookings
                // Подтягиваем связанные документы
                LET user = DOCUMENT(b._from)
                LET computer = DOCUMENT(b._to)
                
                // 1. Фильтр по диапазону дат (сравнение ISO строк)
                FILTER ${dateFrom} == "" OR b.start_at >= ${dateFrom}
                FILTER ${dateTo} == "" OR b.start_at <= ${dateTo + "T23:59:59"}
                
                // 2. Фильтр по статусу
                FILTER ${status} == "" OR b.status == ${status}
                
                // 3. Фильтр по ID бронирования (ключ в ArangoDB)
                FILTER ${bookingId} == "" OR CONTAINS(LOWER(b._key), LOWER(${bookingId}))
                
                // 4. Поиск по данным пользователя
                FILTER ${fullName} == "" OR CONTAINS(LOWER(user.full_name), LOWER(${fullName}))
                FILTER ${email} == "" OR CONTAINS(LOWER(user.email), LOWER(${email}))
                FILTER ${groupCode} == "" OR user.group_code == ${groupCode}
                
                // 5. Поиск по аудитории (из документа компьютера)
                FILTER ${roomName} == "" OR CONTAINS(LOWER(computer.room_id || ""), LOWER(${roomName}))

                // Сортируем: сначала самые свежие записи
                SORT b.start_at DESC
                
                RETURN {
                    id: b._key,
                    date: b.start_at,
                    created_at: b.meta.created_at,
                    status: b.status,
                    // Текстовое описание статуса для фронтенда
                    statusText: b.status == 'finished' ? 'Завершено' : 
                                b.status == 'missed' ? 'Неявка' : 
                                b.status == 'cancelled' ? 'Отменено' :
                                b.status == 'reserved' ? 'Забронировано' : 
                                b.status == 'active' ? 'Активно' : 'Неизвестно',
                    user_name: user.full_name,
                    user_email: user.email,
                    group_code: user.group_code,
                    room_name: computer.room_id || "Не указана",
                    pc_name: computer._key,
                    history: b.history || []
                }
        )

        // Возвращаем общее количество (для пагинации) и нарезанный массив данных
        RETURN {
            total: LENGTH(all_logs),
            data: SLICE(all_logs, ${offset}, ${countLimit})
        }
    `);

    const result = await cursor.next();
    
    res.json(result || { total: 0, data: [] });
});