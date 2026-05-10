/**
 * utils/validators.js
 * Утилиты для валидации и нормализации данных.
 */

import getPairInterval from './pairInterval.js';

/**
 * Извлечь _key из _id или вернуть как есть.
 */
export const extractKey = (id) => id.includes('/') ? id.split('/').pop() : id;

/**
 * Сформировать полный _id коллекции.
 */
export const toFullId = (id, collection = 'Rooms') =>
    id.startsWith(`${collection}/`) ? id : `${collection}/${id}`;

/**
 * Проверить, что строковый ID передан.
 */
export const assertStringId = (id, name = "ID") => {
    if (!id) {
        const e = new Error(`${name} обязателен`);
        e.status = 400;
        throw e;
    }
};

/**
 * Проверить обязательные поля в объекте.
 */
export const assertRequiredFields = (data, fields) => {
    for (const field of fields) {
        const val = data[field];
        if (val === undefined || val === null || (typeof val === 'string' && val.trim().length === 0)) {
            const e = new Error(`Поле "${field}" обязательно`);
            e.status = 400;
            throw e;
        }
    }
};

/**
 * Валидация даты и номера пары.
 * Возвращает объект (start, end) из pairInterval.
 */
export const validateDatePair = (date, pair) => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const e = new Error("Дата обязательна и должна быть в формате YYYY-MM-DD");
        e.status = 400;
        throw e;
    }
    const p = Number(pair);
    if (!Number.isInteger(p) || p < 1 || p > 7) {
        const e = new Error("Номер пары должен быть целым числом от 1 до 7");
        e.status = 400;
        throw e;
    }
    return getPairInterval(date, pair);
};

/**
 * Валидация grid (rows, cols).
 */
export const validateGrid = (grid) => {
    if (!grid || typeof grid !== 'object' || grid.rows === undefined || grid.cols === undefined) {
        const e = new Error("Поле grid с rows и cols обязательно");
        e.status = 400;
        throw e;
    }
    const rows = Number(grid.rows);
    const cols = Number(grid.cols);
    if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(cols) || cols < 1) {
        const e = new Error("grid.rows и grid.cols должны быть положительными целыми числами");
        e.status = 400;
        throw e;
    }
    return { rows, cols };
};

/**
 * Валидация пагинации.
 */
export const validatePagination = (page, limit) => {
    const p = Number(page);
    const l = Number(limit);

    if (!Number.isInteger(p) || p < 1) {
        const e = new Error("page должен быть положительным целым числом");
        e.status = 400;
        throw e;
    }
    if (!Number.isInteger(l) || l < 1 || l > 100) {
        const e = new Error("limit должен быть от 1 до 100");
        e.status = 400;
        throw e;
    }
    return { page: p, limit: l };
};

/**
 * Валидация и нормализация email.
 */
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        const e = new Error("Некорректный формат email");
        e.status = 400;
        throw e;
    }
    return email.toLowerCase().trim();
};

/**
 * Валидация длины пароля.
 */
export const validatePassword = (password, minLength = 3) => {
    if (password.length < minLength) {
        const e = new Error(`Пароль должен содержать минимум ${minLength} символа`);
        e.status = 400;
        throw e;
    }
    return password;
};