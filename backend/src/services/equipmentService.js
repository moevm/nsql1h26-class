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
        return await equipmentDao.findById(id);
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

        const documentToInsert = {
            ...equipmentData,
            status: equipmentData.status || 'active',
            meta: {
                created_at: new Date().toISOString(),
                updated_at: null,
                created_by: equipmentData.created_by || null
            }
        };

        delete documentToInsert.created_by;

        return await equipmentDao.insert(documentToInsert);
    }

    /**
     * Method: update
     * Обновить компьютер.
     */
    async update(id, updateData) {
        const existing = await equipmentDao.findById(id);
        if (!existing) {
            const error = new Error("Компьютер не найден");
            error.status = 404;
            throw error;
        }

        const newMeta = {
            ...existing.meta,
            updated_at: new Date().toISOString()
        };

        // 3. Формируем итоговый документ
        const documentToUpdate = {
            ...updateData,
            meta: newMeta
        };

        return await equipmentDao.update(id, documentToUpdate);
    }

    /**
     * Method: delete
     * Удалить компьютер.
     */
    async delete(id) {
        return await equipmentDao.remove(id);
    }
}

export default new EquipmentService();