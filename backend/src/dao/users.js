/**
 * dao/users.js
 * Responsible for working with the Users collection in ArangoDB
 */

import db from '../config/db.js';
import { aql } from 'arangojs';


class UserDao {
    constructor() {
        this.collection = db.collection('Users');
    }

    /**
     * Method: findByEmail
     * Находит пользователя по email
     */
    async findByEmail(email) {
        const cursor = await db.query(aql`
            FOR u IN Users
            FILTER u.email == ${email}
            RETURN u
        `);

        const users = await cursor.all();
        return users[0] || null;
    }

    /**
     * Method: existsByEmail
     * Проверяет, занят ли email
     */
    async existsByEmail(email) {
        const cursor = await db.query(aql`
            FOR u IN Users
                FILTER u.email == ${email}
                LIMIT 1
                RETURN true
        `);

        const result = await cursor.all();
        return result.length > 0;
    }

    /**
     * Method: findByEmailAndUpdateLogin
     * Находит пользователя по email и обновляет last_login.
     */
    async findByEmailAndUpdateLogin(email) {
        const now = new Date().toISOString();
        const cursor = await db.query(aql`
            FOR u IN Users
                FILTER u.email == ${email}
                UPDATE u WITH {
                    meta: MERGE(u.meta, { last_login: ${now} })
                } IN Users
                RETURN NEW
        `);
        return await cursor.next();
    }

    /**
     * Method: findByKey
     * Находит пользователя по _key
     * Возращает найденного пользователя без пароля
     */
    async findByKey(key) {
        const cursor = await db.query(aql`
            FOR u IN Users
                FILTER u._key == ${key}
                RETURN {
                    id: u._key,
                    full_name: u.full_name,
                    email: u.email,
                    group_code: u.group_code,
                    is_admin: u.is_admin,
                    meta: u.meta
                }
        `);
        return await cursor.next();
    }

    /**
     * Method: findAll
     * Возвращает список пользователей с фильтрами и пагинацией.
     */
    async findAll({ full_name = "", email = "", group_code = "", is_admin = null, page = 1, limit = 8 }) {
        const offset = (page - 1) * limit;

        const cursor = await db.query(aql`
            LET filtered = (
                FOR u IN Users
                    FILTER ${full_name} == "" OR CONTAINS(LOWER(u.full_name), LOWER(${full_name}))
                    FILTER ${email} == "" OR CONTAINS(LOWER(u.email), LOWER(${email}))
                    FILTER ${group_code} == "" OR CONTAINS(LOWER(u.group_code || ""), LOWER(${group_code}))
                    
                    FILTER ${is_admin} == null OR u.is_admin == ${is_admin}
                    
                    SORT u.full_name ASC
                    
                    RETURN {
                        id: u._key,
                        full_name: u.full_name,
                        email: u.email,
                        group_code: u.group_code,
                        is_admin: u.is_admin,
                        last_login: u.meta.last_login
                    }
            )
            
            RETURN {
                total: LENGTH(filtered),
                data: SLICE(filtered, ${offset}, ${limit})
            }
        `);

        return await cursor.next();
    }

    /**
     * Method: insert
     * Создаёт нового пользователя
     */
    async insert(document) {
        const cursor = await db.query(aql`
            INSERT ${document} INTO Users
            RETURN {
                id: NEW._key,
                full_name: NEW.full_name,
                email: NEW.email,
                group_code: NEW.group_code,
                is_admin: NEW.is_admin,
                meta: NEW.meta
            }
        `);
        return await cursor.next();
    }

    /**
     * Method: getAll (нужен исключитеоьно для дебага)
     * Возвращает всех пользователей
     */
    async getAll() {
        const cursor = await db.query(aql`FOR u IN Users RETURN u`);
        return await cursor.all();
    };

    /**
     * Method: update
     * Обновляет поля пользователя
     */
    async update(key, data) {
        const cursor = await db.query(aql`
            FOR u IN Users
                FILTER u._key == ${key}
                UPDATE u WITH MERGE(
                    ${data},
                    { meta: MERGE(u.meta, { updated_at: ${new Date().toISOString()} }) }
                ) IN Users
                RETURN {
                    id: NEW._key,
                    full_name: NEW.full_name,
                    email: NEW.email,
                    group_code: NEW.group_code,
                    is_admin: NEW.is_admin,
                    meta: NEW.meta
                }
        `);
        return await cursor.next();
    }

    /**
     * Method: remove
     * Удаляет пользователя по _key
     */
    async remove(key) {
        const cursor = await db.query(aql`
            FOR u IN Users
                FILTER u._key == ${key}
                REMOVE u IN Users
                RETURN OLD
        `);
        return await cursor.next();
    }
}

export default new UserDao();
