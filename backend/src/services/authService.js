/**
 * authService.js
 * Business logic for authentication.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import UserDao from '../dao/users.js';


class AuthService {


    // async registerUser(userData) {
    //
    //     if (!userData.email || !userData.password || !userData.full_name) {
    //         const error = new Error("Отсутствуют обязательные данные");
    //         error.status = 400;
    //         throw error;
    //     }
    //
    //     // Проверяем, нет ли уже такого email в нашем массиве
    //     const existingUser = this.users.find(u => u.email === userData.email);
    //     if (existingUser) {
    //         const error = new Error("Этот Email уже занят");
    //         error.status = 400;
    //         throw error;
    //     }
    //
    //     const hashedPassword = await bcrypt.hash(userData.password, 10);
    //
    //     // Mock user (test)
    //     const newUser = {
    //         _key: `user_${Date.now()}`,
    //         full_name: userData.full_name,
    //         email: userData.email,
    //         password: hashedPassword,
    //         group_code: userData.group_code || "0000",
    //         is_admin: false,
    //         meta: {
    //             created_at: new Date().toISOString()
    //         }
    //     };
    //
    //     this.users.push(newUser);
    //     console.log("[Mock DB]: Новый пользователь добавлен. Всего:", this.users.length);
    //
    //     return newUser;
    // }



    /**
     * Method: loginUser
     * Авторизация пользователя
     */
    async loginUser(email, password) {
        if (!email || !password) {
            const error = new Error("Email и пароль обязательны");
            error.status = 400;
            throw error;
        }

        const user = await UserDao.findByEmail(email);

        if (!user) {
            const error = new Error("Пользователь с таким Email не найден");
            error.status = 401;
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const error = new Error("Неверный пароль");
            error.status = 401;
            throw error;
        }

        const updatedUser = await UserDao.findByEmailAndUpdateLogin(email);

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("[error] JWT_SECRET не задан в .env");
            const error = new Error("Ошибка конфигурации сервера");
            error.status = 500;
            throw error;
        }

        const token = jwt.sign(
            { id: updatedUser._key, is_admin: updatedUser.is_admin },
            secret,
            { expiresIn: '1d' }
        );

        const { password: _, ...userWithoutPassword } = updatedUser;
        return { user: userWithoutPassword, token };
    }

    /**
     * Method: getAllUsers
     * Возвращает всех пользователей (debag, admin only)
     */
    async getAllUsers() {
        const users = await UserDao.getAll();
        return users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });
    }
}

export default new AuthService();