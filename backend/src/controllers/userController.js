import db from '../config/db.js';
import { aql } from 'arangojs';
import bcrypt from 'bcryptjs';
import asyncHandler from '../services/asyncHandler.js';

export const getAdminUsers = asyncHandler(async (req, res) => {
    const { 
        full_name = "", 
        email = "", 
        group_code = "", 
        role = "", 
        page = 1, 
        limit = 8 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const countLimit = Number(limit);

    const cursor = await db.query(aql`
        LET filtered = (
            FOR u IN Users
                FILTER ${full_name} == "" OR CONTAINS(LOWER(u.full_name), LOWER(${full_name}))
                FILTER ${email} == "" OR CONTAINS(LOWER(u.email), LOWER(${email}))
                FILTER ${group_code} == "" OR CONTAINS(LOWER(u.group_code || ""), LOWER(${group_code}))
                
                FILTER ${role} == "" OR 
                        (${role} == "admin" ? u.is_admin == true : u.is_admin == false)
                
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
            data: SLICE(filtered, ${offset}, ${countLimit})
        }
    `);

    const result = await cursor.next();
    res.json(result || { total: 0, data: [] });

});

export const adminCreateUser = asyncHandler(async (req, res) => {
    const { full_name, email, password, is_admin, group_code } = req.body;

    const checkCursor = await db.query(aql`
        FOR u IN Users 
        FILTER u.email == ${email} 
        RETURN u
    `);
    
    const existingUsers = await checkCursor.all();
    if (existingUsers.length > 0) {
        return res.status(400).json({ error: "Email уже занят" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
        full_name,
        email,
        password: hashedPassword,
        group_code: group_code || "0000",
        is_admin: Boolean(is_admin),
        meta: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: null
        }
    };

    const result = await db.query(aql`INSERT ${newUser} INTO Users RETURN NEW`);
    const user = await result.next();
    delete user.password;
    res.status(201).json(user);

});

export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cursor = await db.query(aql`
        FOR u IN Users 
        FILTER u._key == ${id} 
        RETURN {
            id: u._key,
            full_name: u.full_name,
            email: u.email,
            group_code: u.group_code,
            is_admin: u.is_admin,
            meta: u.meta
        }
    `);
    
    const user = await cursor.next();
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    res.json(user);

});