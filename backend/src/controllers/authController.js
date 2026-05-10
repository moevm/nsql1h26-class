/**
 * authController.js
 * Обработка запросов аутентификации
 */

import asyncHandler from '../utils/asyncHandler.js';
import authService from '../services/authService.js';

class AuthController {

    // register = async (req, res) => {
    //     try {
    //         const { full_name, group_code, email, password } = req.body;
    //
    //         if (!email || !password || !full_name) {
    //             return res.status(400).json({ message: "Заполните все обязательные поля" });
    //         }
    //
    //         const user = await authService.registerUser({
    //             full_name,
    //             group_code,
    //             email,
    //             password
    //         });
    //
    //         const { password: _, ...safeUser } = user;
    //
    //         res.status(201).json({
    //             message: "Регистрация прошла успешно!",
    //             user: safeUser
    //         });
    //     } catch (error) {
    //         this.handleError(res, error);
    //     }
    // }


    /**
     * Method: login
     * Обработка запросов пользователя связанных с авторизацией
     */
    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        // Получаем и юзера, и токен из сервиса
        const { user, token } = await authService.loginUser(email, password);

        res.status(200).json({
            message: "Успешный вход",
            token,
            user: {
                _key: user._key,
                full_name: user.full_name,
                email: user.email,
                is_admin: user.is_admin,
                group_code: user.group_code,
                meta: user.meta
            }
        });
    });
}

export default new AuthController();