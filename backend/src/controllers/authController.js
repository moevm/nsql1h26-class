import authService from '../services/authService.js';

class AuthController {
    handleError(res, error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ message: error.message });
    }

    register = async (req, res) => {
        try {
            const { full_name, group_code, email, password } = req.body;

            if (!email || !password || !full_name) {
                return res.status(400).json({ message: "Заполните все обязательные поля" });
            }

            const user = await authService.registerUser({
                full_name,
                group_code,
                email,
                password
            });

            const { password: _, ...safeUser } = user;

            res.status(201).json({
                message: "Регистрация прошла успешно!",
                user: safeUser
            });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            // Получаем и юзера (без пароля), и токен из сервиса
            const { user, token } = await authService.loginUser(email, password);

            res.status(200).json({
                message: "Успешный вход",
                user,
                token
            });

        } catch (error) {
            // 401 - ошибка авторизации
            this.handleError(res, error);
        }
    }

    getDebugUsers = async (req, res) => {
        const users = await authService.getAllUsers();

        const safeUsers = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.status(200).json({
            count: safeUsers.length,
            data: safeUsers
        });
    }
}

export default new AuthController();