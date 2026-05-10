/**
 * dao/rooms.js
 * Responsible for working with the Rooms and Computers collections in ArangoDB
 */

import db from '../config/db.js';
import { aql } from 'arangojs';

class RoomDao {
    constructor() {
        this.collection = db.collection('Rooms');
    }

    /**
     * Админский список аудиторий с фильтрами и пагинацией.
     */
    async findAll({ name = '', description = '', tag = '', page = 1, limit = 8 }) {
        const offset = (page - 1) * limit;

        const cursor = await db.query(aql`
            LET all_filtered = (
                FOR r IN Rooms
                    FILTER ${name} == "" || CONTAINS(LOWER(r.name), LOWER(${name}))
                    FILTER ${description} == "" || CONTAINS(LOWER(r.description), LOWER(${description}))
                    FILTER ${tag} == "" || ${tag} IN r.tags
                    SORT r.name ASC
                    RETURN r
            )
            RETURN {
                total: LENGTH(all_filtered),
                data: SLICE(all_filtered, ${offset}, ${limit})
            }
        `);

        return await cursor.next();
    }

    /**
     * Публичный список аудиторий с подсчётом свободных мест.
     */
    async findAllPublic({ targetDate, targetPair, page = 1, limit = 8 }) {
        const offset = (page - 1) * limit;
        const timings = { 1: "08:00", 2: "09:50", 3: "11:40", 4: "13:40", 5: "15:30", 6: "17:20", 7: "19:00" };
        const startTime = `${targetDate}T${timings[targetPair] || "08:00"}:00Z`;

        const cursor = await db.query(aql`
            LET all_rooms = (
                FOR r IN Rooms
                    LET room_pcs = (
                        FOR p IN Computers 
                        FILTER p.room_id == r._id || p.room_id == r._key
                        RETURN p._id
                    )
                    LET broken_pcs = (
                        FOR p IN Computers
                        FILTER p.room_id == r._id || p.room_id == r._key
                        FILTER p.status != "active"
                        RETURN p._id
                    )
                    LET active_bookings = (
                        FOR b IN Bookings 
                        FILTER b._to IN room_pcs
                        FILTER b.status IN ['active', 'reserved']
                        FILTER b.start_at == ${startTime}
                        RETURN b
                    )
                    RETURN {
                        id: r._key,
                        name: r.name,
                        description: r.description,
                        tags: r.tags || [],
                        grid: r.grid || { rows: null, cols: null },
                        total_seats: LENGTH(room_pcs),
                        available_seats: LENGTH(room_pcs) - LENGTH(active_bookings) - LENGTH(broken_pcs)
                    }
            )
            
            RETURN {
                total: LENGTH(all_rooms),
                data: SLICE(all_rooms, ${offset}, ${limit})
            }
        `);

        return await cursor.next();
    }

    /**
     * Детали аудитории + список ПК со статусом занятости.
     */
    async findById(id, startTime) {
        const cursor = await db.query(aql`
            LET room = DOCUMENT(CONCAT("Rooms/", ${id}))
            LET pcs = (
                FOR p IN Computers
                FILTER p.room_id == room._id || p.room_id == room._key || p.room_id == CONCAT("Rooms/", ${id})
                LET has_booking = FIRST(
                    FOR b IN Bookings
                    FILTER b._to == p._id
                    FILTER b.status IN ['active', 'reserved', 'finished']
                    FILTER b.start_at == ${startTime}
                    RETURN b
                )
                RETURN MERGE(p, { 
                    status: has_booking ? "no" : (p.status || "active"),
                    id: p._key 
                })
            )
            RETURN { room, pcs }
        `);

        return await cursor.next();
    }

    /**
     * ПК, не привязанные к аудитории.
     */
    async findAvailablePCs() {
        const cursor = await db.query(aql`
            FOR p IN Computers
            FILTER (p.room_id == null || p.room_id == "") && p.status == "active"
            RETURN p
        `);
        return await cursor.all();
    }

    /**
     * Создать аудиторию.
     * Если передан transaction — выполняется внутри него.
     */
    async insert(document, transaction = null) {
        const queryFn = () => db.query(aql`
            INSERT ${document} INTO Rooms
            RETURN NEW
        `);

        const cursor = transaction ? await transaction.step(queryFn) : await queryFn();
        return await cursor.next();
    }

    /**
     * Обновить аудиторию.
     */
    async update(key, data, transaction = null) {
        const queryFn = () => db.query(aql`
            FOR r IN Rooms
                FILTER r._key == ${key}
                UPDATE r WITH MERGE(
                    ${data},
                    { meta: MERGE(r.meta, { updated_at: ${new Date().toISOString()} }) }
                ) IN Rooms
                RETURN NEW
        `);

        const cursor = transaction ? await transaction.step(queryFn) : await queryFn();
        return await cursor.next();
    }

    /**
     * Удалить аудиторию.
     */
    async remove(key, transaction = null) {
        const queryFn = () => db.query(aql`
            FOR r IN Rooms
                FILTER r._key == ${key}
                REMOVE r IN Rooms
                RETURN OLD
        `);

        const cursor = transaction ? await transaction.step(queryFn) : await queryFn();
        return await cursor.next();
    }

    /**
     * Отвязать ВСЕ ПК от аудитории.
     */
    async unassignAllPCs(roomId, transaction = null) {
        const queryFn = () => db.query(aql`
            FOR p IN Computers
            FILTER p.room_id == ${roomId} || p.room_id == ${roomId.split('/').pop()}
            UPDATE p WITH { room_id: null, seat_index: null } IN Computers
        `);

        if (transaction) {
            await transaction.step(queryFn);
        } else {
            await queryFn();
        }
    }

    /**
     * Привязать один ПК к аудитории.
     */
    async assignPC(pcKey, roomId, seatIndex, transaction = null) {
        const queryFn = () => db.query(aql`
            FOR p IN Computers
            FILTER p._key == ${pcKey}
            UPDATE p WITH { room_id: ${roomId}, seat_index: ${seatIndex} } IN Computers
        `);

        if (transaction) {
            await transaction.step(queryFn);
        } else {
            await queryFn();
        }
    }


    /**
     * Отвязать один ПК.
     */
    async unassignPC(pcKey, transaction = null) {
        const queryFn = () => db.query(aql`
            FOR p IN Computers
            FILTER p._key == ${pcKey}
            UPDATE p WITH { room_id: null, seat_index: null } IN Computers
        `);

        if (transaction) {
            await transaction.step(queryFn);
        } else {
            await queryFn();
        }
    }

    async exists(key) {
        return await this.collection.documentExists(key);
    }
}

export default new RoomDao();