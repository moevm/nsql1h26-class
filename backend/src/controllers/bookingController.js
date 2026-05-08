import db from '../config/db.js';
import { aql } from 'arangojs';
import asyncHandler from '../utils/asyncHandler.js';

const getPairInterval = (date, pair) => {
    const timings = {
        1: { s: "08:00", e: "09:30" },
        2: { s: "09:50", e: "11:20" },
        3: { s: "11:40", e: "13:10" },
        4: { s: "13:40", e: "15:10" },
        5: { s: "15:30", e: "17:00" },
        6: { s: "17:20", e: "18:50" },
        7: { s: "19:00", e: "20:30" }
    };
    const t = timings[pair] || timings[1];
    return {
        start: `${date}T${t.s}:00Z`,
        end: `${date}T${t.e}:00Z`
    };
};

export const createBooking = asyncHandler(async (req, res) => {
    const { pc_id, date, pair } = req.body;
    const userId = req.user.id;
    const interval = getPairInterval(date, pair);

    const fromId = `Users/${userId}`;
    const toId = pc_id.includes('/') ? pc_id : `Computers/${pc_id}`;

    const transaction = await db.beginTransaction({
        write: ['Bookings'],
        read: ['Computers']
    });

    try {
        const checkCursor = await db.query(aql`
            FOR b IN Bookings
            FILTER b._to == ${toId}
            FILTER b.status != 'cancelled'
            FILTER b.start_at == ${interval.start}
            RETURN b
        `, {}, { transaction });
        
        if ((await checkCursor.all()).length > 0) {
            await transaction.abort();
            return res.status(409).json({ error: "Это место уже забронировано" });
        }

        const now = new Date().toISOString();

        const newBooking = {
            _from: fromId, 
            _to: toId,     
            start_at: interval.start,
            end_at: interval.end,
            status: 'reserved',
            meta: { created_at: now },
            history: [{
                old_status: null,
                new_status: 'reserved',
                changed_at: now,
                changed_by: fromId
            }]
        };

        // Вставляем через транзакцию
        const result = await db.query(aql`
            INSERT ${newBooking} INTO Bookings 
            RETURN NEW
        `, {}, { transaction });
        
        const created = await result.next();
        await transaction.commit();
        
        res.status(201).json(created);
    } catch (error) {
        await transaction.abort();
        throw error;
    }
});

export const getUserBookings = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const cursor = await db.query(aql`
        FOR b IN Bookings
        FILTER b._from == CONCAT('Users/', ${userId})
        FILTER b.status != 'cancelled'
        SORT b.start_at ASC
        LET pc = DOCUMENT(b._to)
        LET room = DOCUMENT(pc.room_id)
        RETURN {
            booking_id: b._key,
            start_at: b.start_at,
            end_at: b.end_at,
            pair: b.pair,
            status: b.status,
            pc_name: pc.name,
            seat_index: pc.seat_index,
            room_name: room ? room.name : "Аудитория"
        }
    `);
    res.json(await cursor.all());

});

export const cancelBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    console.log(`[DEBUG] Попытка отмены бронирования. Входящий ID: ${id}`);
    
    if (!id || id === 'undefined') {
        return res.status(400).json({ error: "Некорректный ID бронирования" });
    }

    const bookingKey = id.includes('/') ? id : `${id}`;
    console.log(`[DEBUG] Сформированный полный путь ArangoDB: ${bookingKey}`);

    const collection = db.collection('Bookings');
    const exists = await collection.documentExists(bookingKey);

    if (!exists) {
        console.error(`[DEBUG] ОШИБКА: Документ ${bookingKey} НЕ НАЙДЕН в коллекции Bookings`);
        return res.status(404).json({ error: `Бронирование ${id} не найдено в базе данных` });
    }

    await db.query(aql`
        UPDATE ${bookingKey} WITH { status: 'cancelled' } IN Bookings`);
    
    console.log(`[DEBUG] Бронирование ${bookingKey} успешно отменено.`);
    res.json({ message: "Успешно отменено" });
});

export const quickBook = asyncHandler(async (req, res) => {
    const { date, pair, tags } = req.body;
    const userId = req.user.id;
    const interval = getPairInterval(date, pair);
    const tagList = tags ? tags.split(',').map(t => t.trim().toLowerCase()) : [];

    // Открываем транзакцию. 
    const transaction = await db.beginTransaction({
        read: ['Computers'],
        write: ['Bookings']
    });

    try {
        // Ищем свободный ПК внутри транзакции
        const cursor = await db.query(aql`
            FOR p IN Computers
                FILTER p.status == 'active'
                
                // Фильтр по софту/тегам
                FILTER ${tagList.length} == 0 OR (
                    FOR t IN ${tagList} 
                    FILTER t IN p.software OR t IN p.specs.gpu OR t IN p.specs.cpu
                    RETURN t
                ) != []

                // Проверка занятости (важно делать это внутри транзакции!)
                LET isOccupied = FIRST(
                    FOR b IN Bookings
                    FILTER b._to == p._id
                    FILTER b.status != 'cancelled'
                    FILTER b.start_at == ${interval.start}
                    RETURN b
                )
                FILTER !isOccupied
                
                LIMIT 1
                RETURN p
        `, {}, { transaction });

        const freePC = await cursor.next();

        if (!freePC) {
            await transaction.abort();
            return res.status(404).json({ error: "Нет свободных ПК по вашему запросу" });
        }

        const now = new Date().toISOString();
        const fromId = `Users/${userId}`;
        const toId = freePC._id;

        const newBooking = {
            _from: fromId,
            _to: toId,
            start_at: interval.start,
            end_at: interval.end,
            status: 'reserved',
            total_work_time_minutes: 0,
            meta: { created_at: now },
            history: [
                {
                    old_status: null,
                    new_status: 'reserved',
                    changed_at: now,
                    changed_by: fromId
                }
            ]
        };

        // Вставляем запись
        await db.query(aql`
            INSERT ${newBooking} INTO Bookings
        `, {}, { transaction });

        // Фиксируем транзакцию
        await transaction.commit();

        res.status(201).json({ 
            message: "Успешно забронировано!", 
            pc_name: freePC.name 
        });

    } catch (error) {
        await transaction.abort();
        throw error;
    }
});