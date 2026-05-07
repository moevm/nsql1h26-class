import db from '../config/db.js';
import { aql } from 'arangojs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from '../services/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const cursor = await db.query(aql`
        FOR u IN Users FILTER u.email == ${email} RETURN u`);
    const user = await cursor.next();

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    const token = jwt.sign(
        { id: user._key, is_admin: user.is_admin },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '24h' }
    );

    res.json({ token, user: { name: user.full_name, is_admin: user.is_admin } });
});