import db from '../config/db.js';
import { aql } from 'arangojs';

export const getAllRooms = async (req, res) => {
    try {
        const cursor = await db.query(aql`FOR r IN Rooms RETURN r`);
        const rooms = await cursor.all();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getRoomDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const cursor = await db.query(aql`
            FOR r IN Rooms FILTER r._key == ${id}
            LET pcs = (FOR p IN Computers FILTER p.room_id == CONCAT('Rooms/', r._key) RETURN p)
            RETURN { room: r, computers: pcs }
        `);
        const result = await cursor.next();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};