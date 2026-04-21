/**
 * authService.js
 * Business logic for user management and authentication.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


class AuthService {
    constructor() {
        // временная база данных в памяти
        this.users = [
            {
                _key: "admin_master",
                full_name: "Геннадий Администратор",
                email: "admin@vuz.ru",
                password: bcrypt.hashSync("root", 10),
                group_code: "STAFF",
                is_admin: true,
                meta: {
                    created_at: "2026-03-01T10:00:00Z",
                    last_login: new Date().toISOString()
                }
            },
            {
                _key: "user_static_1",
                full_name: "Тестовый Тест",
                email: "test@vuz.ru",
                password: bcrypt.hashSync("123", 10),
                group_code: "0000",
                is_admin: false,
                meta: {
                    created_at: "2026-04-01T12:00:00Z"
                }
            }
        ];
    }

    async registerUser(userData) {

        console.log("🔍 [registerUser] Полученные данные:", userData);
        // Проверка: все ли данные пришли
        if (!userData.email || !userData.password || !userData.full_name) {
            const error = new Error("Отсутствуют обязательные данные");
            error.status = 400;
            throw error;
        }

        // Проверяем, нет ли уже такого email в нашем массиве
        const existingUser = this.users.find(u => u.email === userData.email);
        if (existingUser) {
            const error = new Error("Этот Email уже занят");
            error.status = 400;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Mock user (test)
        const newUser = {
            _key: `user_${Date.now()}`,
            full_name: userData.full_name,
            email: userData.email,
            password: hashedPassword,
            group_code: userData.group_code || "0000",
            is_admin: false,
            meta: {
                created_at: new Date().toISOString()
            }
        };

        this.users.push(newUser);
        console.log("[Mock DB]: Новый пользователь добавлен. Всего:", this.users.length);

        return newUser;
    }

    async loginUser(email, password) {
        const user = this.users.find(u => u.email === email);

        if (!user) {
            const error = new Error("Пользователь с таким Email не найден");
            error.status = 401; // Не авторизован
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const error = new Error("Неверный пароль");
            error.status = 401; // Не авторизован
            throw error;
        }

        const secret = process.env.JWT_SECRET || 'secret_key';

        // Генерируем токен. В payload кладем ID и роль.
        const token = jwt.sign(
            { id: user._key, is_admin: user.is_admin },
            secret,
            { expiresIn: '1d' } // Токен живет 1 день
        );

        // Возвращаем пользователя без пароля + токен
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    async getAllUsers() {
        return this.users.map(user => {
            const { password: _, ...safeUser } = user;
            return safeUser;
        });
    }
}

export default new AuthService();