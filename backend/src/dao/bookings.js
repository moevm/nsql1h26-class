/**
 * dao/bookings.js
 * Responsible for working with the Bookings collection in ArangoDB
 */

import db from '../config/db.js';
import { aql } from 'arangojs';


class BookingDao {
    constructor() {
        this.collection = db.collection('Bookings');
    }

    /**
     * Method: findAll
     * Получить бронирования пользователя
     */
    async findAll(userId, statuses, filters, { offset, limit }) {
        const fromId = userId.includes('/') ? userId : `Users/${userId}`;

        const dateFrom = filters.dateFrom || "";
        const dateTo = filters.dateTo || "";
        const roomName = filters.roomName || "";
        const startTime = filters.startTime || null;

        const cursor = await db.query(aql`
            LET all_matches = (
                FOR b IN Bookings
                    FILTER b._from == ${fromId}
                    FILTER b.status IN ${statuses}
                    
                    LET pc = DOCUMENT(b._to)
                    LET room = DOCUMENT(pc.room_id)
                    
                    FILTER ${dateFrom} == "" OR b.start_at >= ${dateFrom}
                    FILTER ${dateTo} == "" OR b.start_at <= ${dateTo}
                    
                    FILTER ${roomName} == "" OR CONTAINS(LOWER(room.name || ""), LOWER(${roomName}))
                    
                    // --- Точное совпадение по start_at, вычисленному в сервисе ---
                    FILTER ${startTime} == null OR b.start_at == ${startTime}
                    
                    SORT b.start_at DESC
                    RETURN {
                        id: b._key,
                        start_at: b.start_at,
                        status: b.status,
                        room_name: room ? room.name : "Аудитория",
                        seat_index: pc.seat_index,
                        pc_name: pc.name
                    }
            )
            
            RETURN {
                total: LENGTH(all_matches),
                data: SLICE(all_matches, ${offset}, ${limit})
            }
        `);
        return await cursor.next();
    }

    /**
     * Method: findById
     * Получить бронирование по _key.
     */
    async findById(id) {
        const key = id.includes('/') ? id.split('/').pop() : id;

        const cursor = await db.query(aql`
            FOR b IN Bookings
                FILTER b._key == ${key}
                RETURN b
        `);

        return await cursor.next();
    }

    /**
     * Method: findActiveByPC
     * Найти активные бронирования для ПК на конкретное время.
     */
    async findActiveByPC(pcId, startTime, transaction = null) {
        const toId = pcId.includes('/') ? pcId : `Computers/${pcId}`;

        const queryFn = () => db.query(aql`
            FOR b IN Bookings
                FILTER b._to == ${toId}
                FILTER b.status != 'cancelled'
                FILTER b.start_at == ${startTime}
                RETURN b
        `);

        const cursor = transaction ? await transaction.step(queryFn) : await queryFn();
        return await cursor.all();
    }

    /**
     * Method: findFreePC
     * Найти первый свободный ПК по тегам.
     */
    async findFreePC({ startTime, tagList = [] }, transaction = null) {
        const queryFn = () => db.query(aql`
            FOR p IN Computers
                FILTER p.status == 'active'
                FILTER ${tagList.length} == 0 OR (
                    FOR t IN ${tagList}
                    FILTER t IN p.software OR t IN p.specs.gpu OR t IN p.specs.cpu
                    RETURN t
                ) != []
                LET isOccupied = FIRST(
                    FOR b IN Bookings
                        FILTER b._to == p._id
                        FILTER b.status != 'cancelled'
                        FILTER b.start_at == ${startTime}
                        RETURN b
                )
                FILTER !isOccupied
                LIMIT 1
                RETURN p
        `);

        const cursor = transaction ? await transaction.step(queryFn) : await queryFn();
        return await cursor.next();
    }

    /**
     * Method: insert
     * Создать бронирование.
     */
    async insert(document, transaction = null) {
        const queryFn = () => db.query(aql`
            INSERT ${document} INTO Bookings
            RETURN NEW
        `);

        const cursor = transaction ? await transaction.step(queryFn) : await queryFn();
        return await cursor.next();
    }

    /**
     * Method: update
     * Обновить бронирование.
     */
    async update(key, data, transaction = null) {
        const queryFn = () => db.query(aql`
            FOR b IN Bookings
                FILTER b._key == ${key}
                UPDATE b WITH MERGE(
                    ${data},
                    { meta: MERGE(b.meta, { updated_at: ${new Date().toISOString()} }) }
                ) IN Bookings
                RETURN NEW
        `);

        const cursor = transaction ? await transaction.step(queryFn) : await queryFn();
        return await cursor.next();
    }
}

export default new BookingDao();