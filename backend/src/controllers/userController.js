/**
 * controllers/userController.js
 * Обработка запросов пользователей (admin only)
 */

import asyncHandler from '../utils/asyncHandler.js';
import userService from '../services/userService.js';

class UserController {
    /**
     * Method: getAdminUsers
     * Получить список пользователей с фильтрами и пагинацией
     */
    getAdminUsers = asyncHandler(async (req, res) => {
        const {
            full_name = "",
            email = "",
            group_code = "",
            role = "",
            page = 1,
            limit = 8
        } = req.query;

        const result = await userService.getAll({
            full_name,
            email,
            group_code,
            role,
            page: Number(page),
            limit: Number(limit)
        });

        res.status(200).json(result);
    });

    /**
     * Method: createUser
     * Создать нового пользователя
     */
    createUser = asyncHandler(async (req, res) => {
        const newUser = await userService.create(req.body);

        res.status(201).json({
            message: "Пользователь успешно создан",
            user: newUser
        });
    });

    /**
     * Method: getUserById
     * Получить пользователя по ID
     */
    getUserById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const user = await userService.getById(id);

        res.status(200).json(user);
    });

    /**
     * Method: updateUser
     * Обновить пользователя
     */
    updateUser = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updated = await userService.update(id, req.body);

        res.status(200).json({
            message: "Пользователь успешно обновлён",
            user: updated
        });
    });

    /**
     * Method: deleteUser
     * Удалить пользователя
     */
    deleteUser = asyncHandler(async (req, res) => {
        const { id } = req.params;
        await userService.delete(id);

        res.status(204).send();
    });
}

export default new UserController();
