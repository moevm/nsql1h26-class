/**
 * services/userService.js
 * Бизнес-логика для работы с пользователями.
 */

import bcrypt from 'bcryptjs';
import UserDao from '../dao/users.js';
import BookingService from './bookingService.js';
import { validateEmail, validatePassword, validatePagination } from '../utils/validators.js';

class UserService {

    /**
     * Method: getAll
     * Получить список пользователей с фильтрами и пагинацией.
     */
    async getAll(filters) {
        const { page = 1, limit = 8, role, ...otherFilters } = filters;

        const pagination = validatePagination(page, limit);

        // Маппинг строковой роли в boolean для DAO
        let isAdminFilter = null;
        if (role === 'admin') isAdminFilter = true;
        else if (role === 'user') isAdminFilter = false;

        return await UserDao.findAll({
            ...otherFilters,
            is_admin: isAdminFilter,
            page: pagination.page,
            limit: pagination.limit
        });
    }

    /**
     * Method: getUserById
     * Получить пользователя по ID.
     */
    async getById(id) {
        const user = await UserDao.findByKey(id);

        if (!user) {
            const error = new Error("Пользователь не найден");
            error.status = 404;
            throw error;
        }

        return user;
    }

    /**
     * Method: create
     * Создать нового пользователя.
     * */
    async create(data) {
        const { full_name, email, password, is_admin, group_code } = data;

        // Валидация обязательных полей
        if (!full_name || !email || !password) {
            const error = new Error("Имя, email и пароль обязательны");
            error.status = 400;
            throw error;
        }

        const cleanEmail = validateEmail(email);
        validatePassword(password);

        // Проверка уникальности email
        const emailExists = await UserDao.existsByEmail(cleanEmail);
        if (emailExists) {
            const error = new Error("Пользователь с таким email уже существует");
            error.status = 409;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const documentToInsert = {
            full_name: full_name.trim(),
            email: cleanEmail,
            password: hashedPassword,
            group_code: group_code || "0000",
            is_admin: is_admin === true || is_admin === 'true' || is_admin === 1,
            meta: {
                created_at: new Date().toISOString(),
                updated_at: null,
                last_login: null
            }
        };

        return await UserDao.insert(documentToInsert);
    }

    /**
     * Method: updateUser
     * Обновить пользователя. Если меняется пароль — хешируем.
     */
    async update(id, data) {
        const user = await UserDao.findByKey(id);

        if (!user) {
            const error = new Error("Пользователь не найден");
            error.status = 404;
            throw error;
        }

        const allowedFields = ['full_name', 'email', 'password', 'is_admin', 'group_code'];
        const incoming = {};
        for (const key of allowedFields) {
            if (data[key] !== undefined) incoming[key] = data[key];
        }

        const { full_name, email, password, is_admin, group_code } = incoming;
        const updateData = {};

        if (full_name !== undefined) updateData.full_name = full_name.trim();
        if (group_code !== undefined) updateData.group_code = group_code;
        if (is_admin !== undefined) updateData.is_admin = Boolean(is_admin);

        if (email !== undefined) {
            const cleanEmail = validateEmail(email);
            if (cleanEmail !== user.email) {
                const emailExists = await UserDao.existsByEmail(cleanEmail);
                if (emailExists) {
                    const error = new Error("Пользователь с таким email уже существует");
                    error.status = 409;
                    throw error;
                }
                updateData.email = cleanEmail;
            }
        }

        // Хеширование пароля при смене
        if (password !== undefined) {
            validatePassword(password);
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(updateData).length === 0) {
            const error = new Error("Нет данных для обновления");
            error.status = 400;
            throw error;
        }

        return await UserDao.update(id, updateData);
    }

    /**
     * Method: deleteUser
     * Удалить пользователя.
     */
    async delete(id) {
        const deleted = await UserDao.remove(id);

        if (!deleted) {
            const error = new Error("Пользователь не найден");
            error.status = 404;
            throw error;
        }

        return deleted;
    }

    async getProfileStats(userId) {
    const [all, active, cancelled] = await Promise.all([
        BookingService.getAll(userId, { type: 'all', limit: 1 }),
        BookingService.getAll(userId, { type: 'active', limit: 1 }),
        BookingService.getAll(userId, { type: 'archive', limit: 1 })
    ]);

    
    return {
        total: all.total || 0,
        active: active.total || 0,
        cancelled: archive.total || 0 
    };
}

async getMe(req, res) {
        try {
            const user = await userService.getById(req.user.id);
            res.json(user);
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }

    async updateMe(req, res) {
        try {
            const updated = await userService.update(req.user.id, req.body);
            res.json(updated);
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message });
        }
    }
}

export default new UserService();