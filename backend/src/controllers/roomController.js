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
        const interval = getPairInterval(targetDate, targetPair);

        const cursor = await db.query(aql`
            FOR r IN Rooms
                // 1. Все ПК в аудитории
                LET all_pcs = (
                    FOR p IN Computers 
                    FILTER p.room_id == r._id 
                    RETURN p
                )
                
                // 2. Исправные ПК
                LET active_pcs_ids = (
                    FOR p IN all_pcs 
                    FILTER p.status == 'active' 
                    RETURN p._id
                )

                // 3. Занятые ПК на это время (есть бронь)
                LET booked_pcs_count = LENGTH(
                    FOR b IN Bookings
                    FILTER b._to IN active_pcs_ids
                    FILTER b.status != 'cancelled'
                    FILTER b.start_at == ${interval.start}
                    RETURN b._to
                )

                RETURN MERGE(r, { 
                    total_seats: LENGTH(all_pcs),
                    // Свободно = Исправные минус Забронированные
                    available_seats: LENGTH(active_pcs_ids) - booked_pcs_count
                })
        `);
        const rooms = await cursor.all();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getRoomDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, pair } = req.query;
        const roomFullId = `Rooms/${id}`; 
        const interval = getPairInterval(date, Number(pair));

        const cursor = await db.query(aql`
            FOR p IN Computers 
                FILTER p.room_id == ${roomFullId}
                
                LET currentBooking = FIRST(
                    FOR b IN Bookings 
                        FILTER b._to == p._id 
                        FILTER b.status != 'cancelled'
                        FILTER b.start_at == ${interval.start}
                        RETURN b
                )
                
                SORT p.seat_index ASC
                RETURN {
                    id: p._key,
                    fullId: p._id,
                    name: p.name || p._key,
                    status: currentBooking ? 'occupied' : p.status,
                    seat_index: p.seat_index,
                    specs: p.specs,
                    software: p.software
                }
        `);

        const computers = await cursor.all();
        const roomResult = await db.query(aql`FOR r IN Rooms FILTER r._key == ${id} RETURN r`);
        const room = await roomResult.next();

        res.json({ room, computers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};