import db from '../config/db.js';
import { aql } from 'arangojs';

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

export const getAllRooms = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


export const getAdminRooms = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getRoomDetails = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAvailablePCs = async (req, res) => {
    try {
        const cursor = await db.query(aql`
            FOR p IN Computers
            FILTER p.room_id == null || p.room_id == ""
            RETURN p
        `);
        const result = await cursor.all();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const assignPCToRoom = async (req, res) => {
    try {
        const { pc_key, room_id, seat_index } = req.body;
        const pcColl = db.collection('Computers');
        const fullRoomId = room_id.startsWith('Rooms/') ? room_id : `Rooms/${room_id}`;
        
        await pcColl.update(pc_key, { 
            room_id: fullRoomId,
            seat_index: seat_index 
        });
        
        res.json({ message: "Устройство привязано" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const unassignPC = async (req, res) => {
    try {
        const { pc_key } = req.params;
        const pcColl = db.collection('Computers');
        await pcColl.update(pc_key, { 
            room_id: null,
            seat_index: null 
        });
        res.json({ message: "Устройство отвязано" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createRoom = async (req, res) => {
    try {
        const { layout, ...roomData } = req.body;
        const roomsColl = db.collection('Rooms');
        const pcsColl = db.collection('Computers');

        delete roomData._key;

        const newRoom = { 
            ...roomData, 
            meta: { created_at: new Date().toISOString() } 
        };
        
        const result = await roomsColl.save(newRoom);
        const newRoomId = result._id;

        if (layout && layout.length > 0) {
            for (const item of layout) {
                const pcKey = item.pc_id.split('/').pop();
                await pcsColl.update(pcKey, {
                    room_id: newRoomId,
                    seat_index: item.seat_index
                });
            }
        }

        res.status(201).json({ message: "Аудитория создана", _key: result._key });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { layout, ...roomData } = req.body; 
        const roomsColl = db.collection('Rooms');
        const pcsColl = db.collection('Computers');

        await roomsColl.update(id, roomData);

        if (layout) {
            const fullRoomId = id.startsWith('Rooms/') ? id : `Rooms/${id}`;

            await db.query(aql`
                FOR p IN Computers
                FILTER p.room_id == ${fullRoomId} || p.room_id == ${id}
                UPDATE p WITH { room_id: null, seat_index: null } IN Computers
            `);

            for (const item of layout) {
                const pcKey = item.pc_id.split('/').pop();
                await pcsColl.update(pcKey, {
                    room_id: fullRoomId,
                    seat_index: item.seat_index
                });
            }
        }

        res.json({ message: "Аудитория и оборудование обновлены" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(aql`
            FOR p IN Computers
            FILTER p.room_id == CONCAT("Rooms/", ${id}) || p.room_id == ${id}
            UPDATE p WITH { room_id: null, seat_index: null } IN Computers
        `);
        const roomsColl = db.collection('Rooms');
        await roomsColl.remove(id);
        res.json({ message: "Аудитория удалена" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};