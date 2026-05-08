/**
 * Обёртка для async-функций.
 * Ловит ошибки из Promise и передаёт их в next(err),
 * чтобы сработал глобальный error-handling middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;