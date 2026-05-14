/**
 * dao/equipments.js
 * Responsible for working with the Computers collection in ArangoDB
 */

import db from '../config/db.js';
import { aql } from 'arangojs';

class EquipmentDao {
    constructor() {
        // Ссылка на коллекцию Computers
        this.collection = db.collection('Computers');
    }

    /**
     * Method: findAll
     * Получить список компьютеров с фильтрами и пагинацией.
     */
    async findAll({ search = "", status = "", room_id = "", software = "", page = 1, limit = 8 }) {
        const offset = (page - 1) * limit;

        const cursor = await db.query(aql`
            LET swParts = ${software} == "" ? [] : SPLIT(LOWER(${software}), ",")
            LET filtered = (
                FOR c IN Computers
                    FILTER ${status} == "" OR c.status == ${status}
                    FILTER ${room_id} == "" OR c.room_id == ${room_id}
                    FILTER ${search} == "" OR (
                        CONTAINS(LOWER(c.inv_number), LOWER(${search})) OR
                        CONTAINS(LOWER(c.mac_address), LOWER(${search})) OR
                        ${search} IN c.software
                    )
                    FILTER LENGTH(swParts) == 0 OR LENGTH(swParts) == LENGTH(
                        FOR p IN swParts
                            FILTER p != ""
                            FILTER LENGTH(FOR s IN c.software FILTER CONTAINS(LOWER(s), TRIM(p)) RETURN s) > 0
                        RETURN p
                    )
                    LET room = DOCUMENT(c.room_id)
                    SORT c.inv_number ASC
                    RETURN {
                        id: c._key,
                        inv_number: c.inv_number,
                        seat_index: c.seat_index,
                        mac_address: c.mac_address,
                        status: c.status,
                        software: c.software,
                        specs: c.specs,
                        admin_notes: c.admin_notes,
                        room_name: room.name,
                        room_id: c.room_id,
                        meta: c.meta
                    }
            )
            
            RETURN {
                total: LENGTH(filtered),
                data: SLICE(filtered, ${offset}, ${limit})
            }
        `);

        return await cursor.next();
    }

    /**
     * Method: findById
     * Получить один компьютер по id (_key).
     */
    async findById(id) {
        const cursor = await db.query(aql`
            FOR c IN Computers
                FILTER c._key == ${id}
                LET room = DOCUMENT(c.room_id)
                RETURN {
                    id: c._key,
                    inv_number: c.inv_number,
                    seat_index: c.seat_index,
                    mac_address: c.mac_address,
                    status: c.status,
                    software: c.software,
                    specs: c.specs,
                    admin_notes: c.admin_notes,
                    room: room,
                    meta: c.meta
                }
        `);

        return await cursor.next();
    }

    /**
     * Method: insert
     * Вставить новый документ в коллекцию.
     */
    async insert(document) {
        const cursor = await db.query(aql`
            INSERT ${document} INTO Computers
            RETURN NEW
        `);

        return await cursor.next();
    }

    /**
     * Method: update
     * Обновить существующий документ.
     */
    async update(id, document) {
        const cursor = await db.query(aql`
            FOR c IN Computers
                FILTER c._key == ${id}
                UPDATE c WITH MERGE(
                    ${document},
                    { meta: MERGE(c.meta, { updated_at: ${new Date().toISOString()} }) }
                ) IN Computers
                RETURN NEW
        `);
        return await cursor.next();
    }

    /**
     * Method: remove
     * Удалить документ.
     */
    async remove(id) {
        const cursor = await db.query(aql`
            FOR c IN Computers
                FILTER c._key == ${id}
                REMOVE c IN Computers
                RETURN OLD
        `);

        return await cursor.next();
    }
}

export default new EquipmentDao();