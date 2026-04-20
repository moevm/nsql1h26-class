import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Доступ запрещен. Токен отсутствует." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.user = decoded; 
        next();
    } catch (err) {
        res.status(403).json({ error: "Неверный или просроченный токен." });
    }
};