/**
 * EquipmentController.js
 * Обработка запросов оборудования
 */

import equipmentService from '../services/equipmentService.js';
import asyncHandler from '../services/asyncHandler.js';

class EquipmentController {
    /**
     * Method: handleError
     * Вспомогательный метод для формирования ответа при ошибке
     */
    handleError(res, error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ message: error.message });
    }

    /**
     * Method: getAllEquipment
     * Получить список компьютеров с фильтрами и пагинацией
     */
    getAllEquipment = asyncHandler(async (req, res) => {
        const {
            search = "",
            status = "",
            room_id = "",
            page = 1,
            limit = 8
        } = req.query;

        const result = await equipmentService.getAll({
            search,
            status,
            room_id,
            page: Number(page),
            limit: Number(limit)
        });

        res.status(200).json(result);
    });

    /**
     * Method: getEquipmentById
     * Получить компьютер по ID
     */
    getEquipmentById = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const equipment = await equipmentService.getById(id);

        if (!equipment) {
            return res.status(404).json({
                message: "Компьютер не найден"
            });
        }

        res.status(200).json(equipment);
    });

    /**
     * Method: createEquipment
     * Создать новый компьютер
     */
    createEquipment = asyncHandler(async (req, res) => {
        const {
            inv_number,
            room_id,
            seat_index,
            mac_address,
            specs,
            software,
            admin_notes
        } = req.body;

        if (!inv_number || !room_id) {
            return res.status(400).json({
                message: "Инвентарный номер и аудитория обязательны"
            });
        }

        const newEquipment = await equipmentService.create({
            inv_number,
            room_id,
            seat_index,
            mac_address,
            specs,
            software,
            admin_notes,
            created_by: req.user ? `Users/${req.user.id}` : null
        });

        res.status(201).json({
            message: "Компьютер успешно создан",
            equipment: newEquipment
        });

    });

    /**
     * Method: updateEquipment
     * Обновить компьютер (из модалки "Редактировать").
     */
    updateEquipment = asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Достаём только переданные поля
        const {
            status,
            admin_notes,
            software,
            specs,
            mac_address,
            seat_index,
            room_id
        } = req.body;

        // Формируем объект обновления — только то, что пришло
        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
        if (software !== undefined) updateData.software = software;
        if (specs !== undefined) updateData.specs = specs;
        if (mac_address !== undefined) updateData.mac_address = mac_address;
        if (seat_index !== undefined) updateData.seat_index = seat_index;
        if (room_id !== undefined) updateData.room_id = room_id;

        // Проверяем, есть ли что обновлять
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "Нет данных для обновления"
            });
        }

        const updated = await equipmentService.update(id, updateData);

        if (!updated) {
            return res.status(404).json({
                message: "Компьютер не найден"
            });
        }

        res.status(200).json({
            message: "Компьютер успешно обновлён",
            equipment: updated
        });
    });

    /**
     * Method: deleteEquipment
     * Удалить компьютер
     */
    deleteEquipment = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const deleted = await equipmentService.delete(id);

        if (!deleted) {
            return res.status(404).json({
                message: "Компьютер не найден"
            });
        }

        res.status(204).send();
    });
}

export default new EquipmentController();
