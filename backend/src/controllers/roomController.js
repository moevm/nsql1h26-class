/**
 * controllers/roomController.js
 * Обработка запросов для аудиторий
 */

import asyncHandler from '../utils/asyncHandler.js';
import roomService from '../services/roomService.js';

class RoomController {

    /**
     * Method: getAllRooms
     * Публичный список аудиторий с подсчётом свободных мест.
     */
    getAllRooms = asyncHandler(async (req, res) => {
        const { date, pair, page = 1, limit = 8 } = req.query;
        const result = await roomService.getAllPublic({ date, pair, page, limit });
        res.json(result);
    });

    /**
     * Method: getAdminRooms
     * Админский список аудиторий с фильтрами и пагинацией.
     */
    getAdminRooms = asyncHandler(async (req, res) => {
        const { name = '', description = '', tag = '', page = 1, limit = 8 } = req.query;
        const result = await roomService.getAll({
            name, description, tag,
            page: Number(page),
            limit: Number(limit)
        });
        res.json(result);
    });

    /**
     * Method: getRoomDetails
     * Детали аудитории + список ПК со статусом занятости.
     */
    getRoomDetails = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { date, pair } = req.query;
        const result = await roomService.getById(id, date, pair);
        res.json(result);
    });

    /**
     * Method: getAvailablePCs
     * Получить ПК, не привязанные к аудитории.
     */
    getAvailablePCs = asyncHandler(async (req, res) => {
        const result = await roomService.getAvailablePCs();
        res.json(result);
    });

    /**
     * Method: assignPCToRoom
     * Привязать ПК к аудитории.
     */
    assignPCToRoom = asyncHandler(async (req, res) => {
        const { pc_key } = req.params;
        const { room_id, seat_index } = req.body;
        const result = await roomService.assignPC(pc_key, room_id, seat_index);
        res.json(result);
    });

    /**
     * Method: unassignPC
     * Отвязать ПК от аудитории.
     */
    unassignPC = asyncHandler(async (req, res) => {
        const { pc_key } = req.params;
        const result = await roomService.unassignPC(pc_key);
        res.json(result);
    });

    /**
     * Method: createRoom
     * Создать аудиторию + привязать ПК по layout.
     */
    createRoom = asyncHandler(async (req, res) => {
        const { layout, ...roomData } = req.body;
        const result = await roomService.create(roomData, layout);
        res.status(201).json(result);
    });

    /**
     * Method: updateRoom
     * Обновить аудиторию + перепривязать ПК.
     */
    updateRoom = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { layout, ...roomData } = req.body;
        const result = await roomService.update(id, roomData, layout);
        res.json(result);
    });

    /**
     * Method: deleteRoom
     * Удалить аудиторию + отвязать все её ПК.
     */
    deleteRoom = asyncHandler(async (req, res) => {
        const { id } = req.params;
        await roomService.delete(id);
        res.json({ message: "Аудитория удалена" });
    });
}

export default new RoomController();