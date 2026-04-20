/**
 * authService.js
 * Business logic for user management and authentication.
 */

import jwt from 'jsonwebtoken';


class AuthService {
    constructor() {
        // временная база данных в памяти
        this.users = [
            {
                _key: "admin_master",
                full_name: "Геннадий Администратор",
                email: "admin@vuz.ru",
                password: "root",
                role: "admin"
            },
            {
                _key: "user_static_1",
                full_name: "Тестовый Тест",
                email: "test@vuz.ru",
                password: "123",
                role: "student"
            }
        ];
    }

    async registerUser(userData) {
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

        // Mock user (test)
        const newUser = {
            _key: `user_${Date.now()}`,
            ...userData,
            role: 'student'
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

        if (user.password !== password) {
            const error = new Error("Неверный пароль");
            error.status = 401; // Не авторизован
            throw error;
        }

        console.log("JWT_SECRET из env:", process.env.JWT_SECRET);
        const secret = process.env.JWT_SECRET || 'fallback_secret';

        // Генерируем токен. В payload кладем ID и роль.
        const token = jwt.sign(
            { id: user._key, role: user.role },
            secret,
            { expiresIn: '1d' } // Токен живет 1 день
        );

        // Возвращаем пользователя без пароля + токен
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    async getAllUsers() {
        return this.users;
    }
}

export default new AuthService();