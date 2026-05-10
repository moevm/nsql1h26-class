import db from '../config/db.js';


/**
 * Функция для работы с ArangoDB транзакциями.
 *
 * db — объект базы данных arangojs
 * collections — { write: [...], read: [...] }
 * callback — async-функция, получающая объект транзакции
 */
const withTransaction = async (collections, callback) => {
    const transaction = await db.beginTransaction(collections);
    try {
        const result = await callback(transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.abort();
        throw error;
    }
};

export default withTransaction;