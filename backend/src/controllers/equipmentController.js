/**
 * EquipmentController.js
 * Обработка запросов оборудования
 */

import asyncHandler from '../utils/asyncHandler.js';
import equipmentService from '../services/equipmentService.js';

class EquipmentController {
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
        res.status(200).json(equipment);
    });

    /**
     * Method: createEquipment
     * Создать новый компьютер
     */
    createEquipment = asyncHandler(async (req, res) => {

        const newEquipment = await equipmentService.create({
            ...req.body,
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
        const updated = await equipmentService.update(id, req.body);

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
        const { id } = req.params
        await equipmentService.delete(id);
        res.status(204).send();
    });
}

export default new EquipmentController();
