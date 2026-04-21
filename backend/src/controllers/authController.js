/**
 * authController.js
 * Обработка запросов аутентификации
 */

import authService from '../services/authService.js';

class AuthController {

    /**
     * Method: handleError
     * Вспомогательный метод для формирования ответа при ошибке аутентификации
     */
    handleError(res, error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ message: error.message });
    }

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
    login = async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    message: "Email и пароль обязательны"
                });
            }

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

        } catch (error) {
            // 401 - ошибка авторизации
            this.handleError(res, error);
        }
    }

    /**
     * Method: getDebugUsers
     * Обработка запроса админа на получение всех пользователей для отладки
     */
    getDebugUsers = async (req, res) => {
        const users = await authService.getAllUsers();

        const safeUsers = users.map(user => {
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.status(200).json({
            count: safeUsers.length,
            data: safeUsers
        });
    }
}

export default new AuthController();