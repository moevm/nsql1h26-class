import db from '../config/db.js';
import { aql } from 'arangojs';

export const getRoomsWithStats = async () => {
    try {
        const cursor = await db.query(aql`
            FOR r IN Rooms

                LET room_pcs = (
                    FOR p IN Computers 
                    FILTER p.room_id == r._id 
                    RETURN p._id
                )

                LET active_bookings = (
                    FOR b IN Bookings 
                    FILTER b._to IN room_pcs
                    // Учитываем ваши статусы: если статус 'active' или 'reserved'
                    FILTER b.status IN ['active', 'reserved']
                    RETURN b
                )
                
                RETURN {
                    id: r._key,
                    name: r.name,
                    description: r.description,
                    tags: r.tags || [],
                    total_seats: LENGTH(room_pcs),
                    available_seats: LENGTH(room_pcs) - LENGTH(active_bookings)
                }
        `);
        return await cursor.all();
    } catch (err) {
        console.error("ArangoDB Query Error:", err.message);
        throw err;
    }
};