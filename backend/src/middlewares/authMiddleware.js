/**
 * authMiddleware.js
 * Security layer to protect routes from unauthorized access.
 */

import jwt from 'jsonwebtoken';


/**
 * Function: verifyToken
 * Middleware to verify if the user is authenticated.
 * Проверяет наличие и валидность JWT токена в заголовках.
 */
const verifyToken = (req, res, next) => {

    // Извлекаем заголовок
    const authHeader = req.headers['authorization'];

    // Проверяем, что заголовок вообще существует (ошибка 401 - Unauthorized)
    if (!authHeader) {
        return res.status(401).json({
            error: 'Unauthorized: No token provided',
            message: "Для выполнения этого действия необходимо авторизоваться"
        })
    }

    // Достаем токен (формат: Bearer <token>)
    const token = authHeader.split(' ')[1];

    // Расшифровываем токен. Ключ берем из env
    if (!token) {
        return res.status(401).json({
            error: "Invalid Token",
            message: "Передан пустой или некорректный токен"
        })
    }

    try {

        // Приклеиваем данные пользователя к объекту запроса, чтобы они были доступны дальше
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();

    } catch (error) {
        return res.status(401).json({
            error: 'Unauthorized: TokenExpiredOrInvalid',
            message: "Ваш пропуск поддельный или его срок действия истек."
        })
    }
}


/**
 * Function: isAdmin
 * Middleware to verify if the user has Administrator privileges.
 * Проверяет, что пользователь является администратором
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.is_admin === true) {
        next();
    } else {
        res.status(403).json({
            error: 'AccessDenied: access to administrators only.',
            message: 'Это действие доступно только администраторам'
        })
    }
}

// Экспорт всех middleware
export { verifyToken, isAdmin };

