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

export const getAllRooms = asyncHandler(async (req, res) => {
    const { date, pair } = req.query;
    const targetDate = date || new Date().toISOString().substr(0, 10);
    const targetPair = Number(pair) || 1;
    
    const timings = { 1: "08:00", 2: "09:50", 3: "11:40", 4: "13:40", 5: "15:30", 6: "17:20", 7: "19:00" };
    const startTime = `${targetDate}T${timings[targetPair] || "08:00"}:00Z`;

    const cursor = await db.query(aql`
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
                grid_x: r.grid_x,
                grid_y: r.grid_y,
                total_seats: LENGTH(room_pcs),
                available_seats: LENGTH(room_pcs) - LENGTH(active_bookings) - LENGTH(broken_pcs)
            }
    `);
    const result = await cursor.all();
    res.json(result);

});


export const getAdminRooms = asyncHandler(async (req, res) => {
    const { name = '', description = '', tag = '', page = 1, limit = 8 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const countLimit = Number(limit);

    const query = aql`
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
            data: SLICE(all_filtered, ${offset}, ${countLimit})
        }
    `;

    const cursor = await db.query(query);
    const result = await cursor.next();
    res.json(result);

});

export const getRoomDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date, pair } = req.query; 

    const timings = {
        1: "08:00", 2: "09:50", 3: "11:40", 
        4: "13:40", 5: "15:30", 6: "17:20", 7: "19:00"
    };
    const startTime = `${date}T${timings[pair] || "08:00"}:00Z`;

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

    const result = await cursor.next();
    if (!result.room) return res.status(404).json({ error: "Аудитория не найдена" });
    res.json(result);

});

export const getAvailablePCs = asyncHandler(async (req, res) => {
    const cursor = await db.query(aql`
        FOR p IN Computers
        FILTER p.room_id == null || p.room_id == ""
        RETURN p
    `);
    const result = await cursor.all();
    res.json(result);

});

export const assignPCToRoom = asyncHandler(async (req, res) => {
    const { pc_key, room_id, seat_index } = req.body;
    const pcColl = db.collection('Computers');
    const fullRoomId = room_id.startsWith('Rooms/') ? room_id : `Rooms/${room_id}`;
    
    await pcColl.update(pc_key, { 
        room_id: fullRoomId,
        seat_index: seat_index 
    });
    
    res.json({ message: "Устройство привязано" });

});

export const unassignPC = asyncHandler(async (req, res) => {
    const { pc_key } = req.params;
    const pcColl = db.collection('Computers');
    await pcColl.update(pc_key, { 
        room_id: null,
        seat_index: null 
    });
    res.json({ message: "Устройство отвязано" });

});

export const createRoom = asyncHandler(async (req, res) => {
    const { layout, ...roomData } = req.body;

    const transaction = await db.beginTransaction({
        write: ['Rooms', 'Computers']
    });

    try {
        const roomsColl = db.collection('Rooms');
        const pcsColl = db.collection('Computers');

        delete roomData._key;

        const newRoom = { 
            ...roomData, 
            meta: { created_at: new Date().toISOString() } 
        };
        
        const saveResult = await roomsColl.save(newRoom, { transaction });
        const newRoomId = saveResult._id;

        if (layout && layout.length > 0) {
            for (const item of layout) {
                const pcKey = item.pc_id.split('/').pop();
                await pcsColl.update(pcKey, {
                    room_id: newRoomId,
                    seat_index: item.seat_index
                }, { transaction });
            }
        }

        await transaction.commit();
        res.status(201).json({ message: "Аудитория создана", _key: saveResult._key });

    } catch (error) {
        await transaction.abort();
        res.status(500).json({ 
            error: "Ошибка при создании аудитории", 
            details: error.message 
        });
    }
});

export const updateRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { layout, ...roomData } = req.body; 

    // Открываем транзакцию
    const transaction = await db.beginTransaction({
        write: ['Rooms', 'Computers']
    });

    try {
        const roomsColl = db.collection('Rooms');
        const pcsColl = db.collection('Computers');

        const fullRoomId = id.includes('/') ? id : `Rooms/${id}`;
        const roomKey = id.split('/').pop();


        await roomsColl.update(roomKey, roomData, { transaction });

        if (layout) {

            await db.query(aql`
                FOR p IN Computers
                FILTER p.room_id == ${fullRoomId} || p.room_id == ${id}
                UPDATE p WITH { room_id: null, seat_index: null } IN Computers
            `, {}, { transaction });

            for (const item of layout) {
                const pcKey = item.pc_id.split('/').pop();
                await pcsColl.update(pcKey, {
                    room_id: fullRoomId,
                    seat_index: item.seat_index
                }, { transaction });
            }
        }

        await transaction.commit();
        res.json({ message: "Аудитория и оборудование успешно обновлены" });

    } catch (error) {
        // откатываем всё
        await transaction.abort();
        throw error; // asyncHandler отправит ошибку
    }
});

export const deleteRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const transaction = await db.beginTransaction({
        write: ['Rooms', 'Computers']
    });

    try {
        const roomsColl = db.collection('Rooms');
        const fullRoomId = id.includes('/') ? id : `Rooms/${id}`;

        await db.query(aql`
            FOR p IN Computers
            FILTER p.room_id == ${fullRoomId} || p.room_id == ${id}
            UPDATE p WITH { room_id: null, seat_index: null } IN Computers
        `, {}, { transaction });

        await roomsColl.remove(id, { transaction });

        await transaction.commit();
        res.json({ message: "Аудитория удалена" });

    } catch (error) {
        await transaction.abort();
        throw error;
    }
});