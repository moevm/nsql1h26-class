import db from '../config/db.js';

class AdminService {
    collections = ['Users', 'Rooms', 'Computers', 'Bookings'];

    // Обязательные поля для коллекций
    schema = {
        Users: ['email', 'full_name', 'is_admin', 'password', 'meta'],
        Rooms: ['name', 'grid', 'description', 'tags'],
        Computers: ['room_id', 'status', 'seat_index', 'inv_number', 'mac_address', 'status', 'software', 'specs', 'meta'],
        Bookings: ['_from', '_to', 'start_at', 'end_at', 'status', 'meta', 'history']
    };

    validateData(data) {
        if (!data || typeof data !== 'object') throw new Error("Некорректный формат JSON");

        for (const colName of this.collections) {
            const items = data[colName];
            if (!items) continue;
            if (!Array.isArray(items)) throw new Error(`Поле ${colName} должно быть массивом`);

            const requiredFields = this.schema[colName];
            for (const [index, item] of items.entries()) {
                const missing = requiredFields.filter(field => !(field in item));
                if (missing.length > 0) {
                    throw new Error(`Ошибка в коллекции ${colName} (объект #${index + 1}): отсутствуют поля [${missing.join(', ')}]`);
                }
            }
        }
        return true;
    }

    async importAllData(data) {
        this.validateData(data);

        for (const colName of this.collections) {
            if (!data[colName]) continue;
            console.log(`Импорт коллекции ${colName} (${data[colName].length} записей)...`);
            const collection = db.collection(colName);
            if (await collection.exists()) {
                await collection.truncate();
                await collection.import(data[colName]);
            }
        }
        return { message: "Данные успешно импортированы" };
    }

    async exportAllData() {
        const fullDump = {};
        for (const colName of this.collections) {
            const collection = db.collection(colName);
            if (await collection.exists()) {
                const cursor = await db.query(`FOR d IN @@col RETURN d`, { '@col': colName });
                fullDump[colName] = await cursor.all();
            }
        }
        return fullDump;
    }
}

export default new AdminService();