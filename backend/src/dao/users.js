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
     * Method: getAll
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
        return await this.collection.update(key, data);
    }
}

export default new UserDao();
