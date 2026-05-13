import adminService from '../services/adminService.js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from "dotenv";
import db from '../config/db.js';

import { Database } from "arangojs";

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const seedDatabase = async () => {
    try {
        const authUrl = process.env.DATABASE_URL;
        const systemDb = new Database({ url: authUrl });
        systemDb.useBasicAuth(
            process.env.DB_USER,
            process.env.DB_PASSWORD
        );
        
        const dbName = process.env.DB_NAME;
        const databases = await systemDb.listDatabases();
        
        if (!databases.includes(dbName)) {
            await systemDb.createDatabase(dbName);
            console.log(`База данных "${dbName}" создана.`);
        }

        const collections = ['Users', 'Rooms', 'Computers'];
        const edges = ['Bookings'];

        for (const name of collections) {
            const col = db.collection(name);
            if (await col.exists()) await col.drop();
            await col.create();
            console.log(`Коллекция ${name} готова.`);
        }

        for (const name of edges) {
            const col = db.collection(name);
            if (await col.exists()) await col.drop();
            await col.create({ type: 3 }); 
            console.log(`Edge-коллекция ${name} готова.`);
        }

        const dumpPath = path.resolve(__dirname, '../full_dump_5_12_2026.json');
        const rawData = await fs.readFile(dumpPath, 'utf8');
        const data = JSON.parse(rawData);

        console.log("Начало автоматического импорта данных...");
        await adminService.importAllData(data);
        console.log("База данных успешно инициализирована!");
    } catch (error) {
        console.error("Ошибка при авто-заполнении БД:", error.message);
    }
};