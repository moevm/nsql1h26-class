/**
 * equipmentService.js
 * Бизнес-логика для работы с оборудованием.
 */

import equipmentDao from '../dao/equipments.js';


class EquipmentService {

    /**
     * Method: getAll
     * Получить список компьютеров с фильтрами и пагинацией.
     */
    async getAll(filters) {
        return await equipmentDao.findAll(filters);
    }

    /**
     * Method: getById
     * Получить один компьютер по ID.
     */
    async getById(id) {
        const equipment = await equipmentDao.findById(id);

        if (!equipment) {
            const error = new Error("Компьютер не найден");
            error.status = 404;
            throw error;
        }

        return equipment;
    }

    /**
     * Method: create
     * Создать новый компьютер.
     */
    async create(equipmentData) {
        // equipmentData от контроллера:
        // {
        //     inv_number: "INV-2024-2001",
        //     room_id: "Rooms/room_101",
        //     seat_index: 3,
        //     mac_address: "...",
        //     specs: {...},
        //     software: [...],
        //     admin_notes: "...",
        //     created_by: "Users/admin_vasya"
        // }

        const { created_by, ...dataWithoutCreatedBy } = equipmentData;

        if (!dataWithoutCreatedBy.inv_number || !dataWithoutCreatedBy.room_id) {
            const error = new Error("Инвентарный номер и аудитория обязательны");
            error.status = 400;
            throw error;
        }

        const documentToInsert = {
            ...dataWithoutCreatedBy,
            status: equipmentData.status || 'active',
            meta: {
                created_at: new Date().toISOString(),
                updated_at: null,
                created_by: created_by || null
            }
        };

        delete documentToInsert.created_by;

        return await equipmentDao.insert(documentToInsert);
    }

    /**
     * Method: update
     * Обновить компьютер.
     */
    async update(id, body) {
        const allowedFields = ['status', 'admin_notes', 'software', 'specs', 'mac_address', 'seat_index', 'room_id'];
        const updateData = {};

        for (const key of allowedFields) {
            if (body[key] !== undefined) updateData[key] = body[key];
        }

        if (Object.keys(updateData).length === 0) {
            const error = new Error("Нет данных для обновления");
            error.status = 400;
            throw error;
        }

        const updated = await equipmentDao.update(id, updateData);

        if (!updated) {
            const error = new Error("Компьютер не найден");
            error.status = 404;
            throw error;
        }

        return updated;
    }

    /**
     * Method: delete
     * Удалить компьютер.
     */
    async delete(id) {
        const deleted = await equipmentDao.remove(id);

        if (!deleted) {
            const error = new Error("Компьютер не найден");
            error.status = 404;
            throw error;
        }

        return deleted;
    }
}

export default new EquipmentService();