/**
 * services/roomService.js
 * Бизнес-логика для работы с аудиториями.
 */

import db from '../config/db.js';
import roomDao from '../dao/rooms.js';
import equipmentDao from '../dao/equipments.js';
import getPairInterval from '../utils/pairInterval.js';
import withTransaction from '../utils/withTransaction.js';


/**
 * Функции для валидации
 */

const extractKey = (id) => id.includes('/') ? id.split('/').pop() : id;

const toFullId = (id, collection = 'Rooms') =>
    id.startsWith(`${collection}/`) ? id : `${collection}/${id}`;

const assertStringId = (id, name = "ID") => {
    if (!id) {
        const e = new Error(`${name} обязателен`);
        e.status = 400;
        throw e;
    }
};

const validateDatePair = (date, pair) => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const e = new Error("Дата обязательна и должна быть в формате YYYY-MM-DD");
        e.status = 400;
        throw e;
    }
    const p = Number(pair);
    if (!Number.isInteger(p) || p < 1 || p > 7) {
        const e = new Error("Номер пары должен быть целым числом от 1 до 7");
        e.status = 400;
        throw e;
    }
    return { targetDate: date, targetPair: p };
};

/**
 * Нормализует плоские grid_x/grid_y во вложенный объект grid.
 */
const normalizeGrid = (grid_x, grid_y) => ({
    rows: Number(grid_y) || 1,
    cols: Number(grid_x) || 1
});

const validateGrid = (grid_x, grid_y) => {
    const rows = Number(grid_y);
    const cols = Number(grid_x);
    if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(cols) || cols < 1) {
        const e = new Error("grid_x и grid_y должны быть положительными целыми числами");
        e.status = 400;
        throw e;
    }
    return normalizeGrid(grid_x, grid_y);
};


const validateLayout = async (layout, checkExists = true) => {
    if (!Array.isArray(layout)) {
        const e = new Error("layout должен быть массивом");
        e.status = 400;
        throw e;
    }
    for (const item of layout) {
        if (!item.pc_id || item.seat_index === undefined) {
            const e = new Error("Каждый элемент layout должен содержать pc_id и seat_index");
            e.status = 400;
            throw e;
        }
        const idx = Number(item.seat_index);
        if (!Number.isInteger(idx) || idx < 0) {
            const e = new Error("seat_index должен быть неотрицательным целым числом");
            e.status = 400;
            throw e;
        }
        if (checkExists) {
            const pc = await equipmentDao.findById(extractKey(item.pc_id));
            if (!pc) {
                const e = new Error(`Компьютер ${item.pc_id} не найден`);
                e.status = 404;
                throw e;
            }
        }
    }
};

class RoomService {

    /**
     * Админский список аудиторий с фильтрами и пагинацией.
     * Только чтение.
     */
    async getAll(filters) {
        const { page = 1, limit = 8, ...filterFields } = filters;

        if (!Number.isInteger(Number(page)) || Number(page) < 1) {
            const error = new Error("page должен быть положительным целым числом");
            error.status = 400;
            throw error;
        }

        if (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100) {
            const error = new Error("limit должен быть от 1 до 100");
            error.status = 400;
            throw error;
        }

        return await roomDao.findAll({
            ...filterFields,
            page: Number(page),
            limit: Number(limit)
        });
    }

    /**
     * Публичный список аудиторий с подсчётом свободных мест.
     * Только чтение.
     */
    async getAllPublic(date, pair) {
        const { targetDate, targetPair } = validateDatePair(
            date || new Date().toISOString().slice(0, 10),
            pair || 1
        );

        return await roomDao.findAllPublic(targetDate, targetPair);
    }

    /**
     * Детали аудитории + список ПК со статусом занятости.
     * Только чтение.
     */
    async getById(id, date, pair) {

        assertStringId(id, "ID аудитории");

        const { targetDate, targetPair } = validateDatePair(
            date || new Date().toISOString().slice(0, 10),
            pair || 1
        );

        const interval = getPairInterval(targetDate, targetPair);
        const result = await roomDao.findById(id, interval.start);

        if (!result || !result.room) {
            const error = new Error("Аудитория не найдена");
            error.status = 404;
            throw error;
        }

        return result;
    }

    /**
     * ПК, не привязанные к аудитории.
     * Только чтение.
     */
    async getAvailablePCs() {
        return await roomDao.findAvailablePCs();
    }

    /**
     * Привязать один ПК к аудитории.
     */
    async assignPC(pcKey, roomId, seatIndex) {
        if (!pcKey || !roomId || seatIndex === undefined) {
            const error = new Error("pc_key, room_id и seat_index обязательны");
            error.status = 400;
            throw error;
        }

        const idx = Number(seatIndex);
        if (!Number.isInteger(idx) || idx < 0) {
            const error = new Error("seat_index должен быть неотрицательным целым числом");
            error.status = 400;
            throw error;
        }

        const pcId = extractKey(pcKey);
        const pc = await equipmentDao.findById(pcId);
        if (!pc) {
            const error = new Error("Компьютер не найден");
            error.status = 404;
            throw error;
        }

        const roomKey = extractKey(roomId);
        const exists = await roomDao.exists(roomKey);
        if (!exists) {
            const error = new Error("Аудитория не найдена");
            error.status = 404;
            throw error;
        }

        await roomDao.assignPC(pcId, toFullId(roomId), idx);
        return { message: "Устройство привязано" };
    }

    /**
     * Отвязать один ПК от аудитории.
     */
    async unassignPC(pcKey) {
        if (!pcKey) {
            const error = new Error("pc_key обязателен");
            error.status = 400;
            throw error;
        }

        const key = extractKey(pcKey);
        const pc = await equipmentDao.findById(key);
        if (!pc) {
            const error = new Error("Компьютер не найден");
            error.status = 404;
            throw error;
        }

        await roomDao.unassignPC(pcKey);

        return { message: "Устройство отвязано" };
    }

    /**
     * Создать аудиторию + привязать ПК по layout.
     */
    async create(roomData, layout) {
        const { name, description, tags, grid_x, grid_y } = roomData;

        // --- Валидация ---
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            const e = new Error("Название аудитории обязательно");
            e.status = 400;
            throw e;
        }
        if (grid_x === undefined || grid_y === undefined) {
            const e = new Error("grid_x и grid_y обязательны при создании");
            e.status = 400;
            throw e;
        }

        const grid = validateGrid(grid_x, grid_y);

        if (tags !== undefined && !Array.isArray(tags)) {
            const e = new Error("tags должен быть массивом строк");
            e.status = 400;
            throw e;
        }

        if (layout && layout.length > 0) {
            await validateLayout(layout, true);
        }

        // --- Транзакция ---
        return withTransaction(db, { write: ['Rooms', 'Computers'] }, async (transaction) => {

            const documentToInsert = {
                name: name.trim(),
                description: description || "",
                grid,
                tags: tags || [],
                meta: { created_at: new Date().toISOString() }
            };

            const newRoom = await roomDao.insert(documentToInsert, transaction);
            const newRoomId = newRoom._id;

            if (layout && layout.length > 0) {
                for (const item of layout) {
                    await roomDao.assignPC(extractKey(item.pc_id), newRoomId, item.seat_index, transaction);
                }
            }

            return { message: "Аудитория создана", _key: newRoom._key };
        });
    }

    /**
     * Обновить аудиторию + перепривязать ПК по layout.
     */
    async update(id, roomData, layout) {
        // --- Валидация ---
        assertStringId(id, "ID аудитории");

        const roomKey = extractKey(id);
        if (!await roomDao.exists(roomKey)) {
            const e = new Error("Аудитория не найдена");
            e.status = 404;
            throw e;
        }

        // Деструктуризация — IDE знает про все переменные
        const { name, description, tags, grid_x, grid_y } = roomData;

        // Собираем updateData явно (как в userService)
        const updateData = {};

        if (name !== undefined) {
            if (name.trim().length === 0) {
                const e = new Error("Название аудитории не может быть пустым");
                e.status = 400;
                throw e;
            }
            updateData.name = name.trim();
        }

        if (description !== undefined) updateData.description = description;

        if (tags !== undefined) {
            if (!Array.isArray(tags)) {
                const e = new Error("tags должен быть массивом строк");
                e.status = 400;
                throw e;
            }
            updateData.tags = tags;
        }

        if (grid_x !== undefined || grid_y !== undefined) {
            updateData.grid = validateGrid(grid_x, grid_y);
        }

        if (layout) {
            await validateLayout(layout, true);
        }

        if (Object.keys(updateData).length === 0 && (!layout || layout.length === 0)) {
            const e = new Error("Нет данных для обновления");
            e.status = 400;
            throw e;
        }


        // --- Транзакция ---
        return withTransaction(db, { write: ['Rooms', 'Computers'] }, async (transaction) => {
            const fullRoomId = toFullId(id);

            if (Object.keys(updateData).length > 0) {
                await roomDao.update(roomKey, updateData, transaction);
            }

            if (layout) {
                await roomDao.unassignAllPCs(fullRoomId, transaction);

                for (const item of layout) {
                    await roomDao.assignPC(extractKey(item.pc_id), fullRoomId, item.seat_index, transaction);
                }
            }

            return { message: "Аудитория и оборудование успешно обновлены" };
        });
    }

    /**
     * Удалить аудиторию + отвязать все её ПК.
     */
    async delete(id) {
        // --- Валидация ---
        const roomKey = extractKey(id);

        if (!await roomDao.exists(roomKey)) {
            const e = new Error("Аудитория не найдена");
            e.status = 404;
            throw e;
        }

        // --- Транзакция ---
        return withTransaction(db, { write: ['Rooms', 'Computers'] }, async (transaction) => {
            const fullRoomId = toFullId(id);
            await roomDao.unassignAllPCs(fullRoomId, transaction);
            await roomDao.remove(roomKey, transaction);

            return { message: "Аудитория удалена" };
        });
    }
}

export default new RoomService();