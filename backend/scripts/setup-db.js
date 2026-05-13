import db from '../src/config/db.js';
import { Database } from "arangojs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function setup() {
    console.log("Заполнение бд...");

    const authUrl = process.env.DATABASE_URL;

    try {
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

        const hashedPassword = await bcrypt.hash("admin", 10);
        const users = [
            { 
                _key: 'ivan_i0000', 
                full_name: 'Иван Иванов', 
                email: 'ivanov@uni.edu', 
                password: hashedPassword, 
                group_code: '0000', 
                is_admin: false,
                meta: { created_at: "2026-03-01T10:00:00Z", last_login: new Date().toISOString() } 
            },
            { 
                _key: 'admin_vasya', 
                full_name: 'Василий Админов', 
                email: 'admin@uni.edu', 
                password: hashedPassword, 
                group_code: 'STAFF', 
                is_admin: true,
                meta: { created_at: "2026-04-01T12:00:00Z" } 
            }
        ];
        await db.collection('Users').import(users);

        const roomsData = [
            { 
                _key: 'room_405b', 
                name: '405-Б', 
                description: 'Основная лаборатория для занятий по нейросетям', 
                grid: { rows: 4, cols: 4 },
                tags: ["Машинное обучение", "GPU RTX 4090", "Проектор"] 
            },
            { 
                _key: 'room_101', 
                name: '101', 
                description: 'Коворкинг', 
                grid: { rows: 2, cols: 5 },
                tags: ["WiFi", "Chill zone"] 
            },
            { 
                _key: 'room_102', 
                name: '102', 
                description: 'Класс для групповых занятий', 
                grid: { rows: 2, cols: 3 },
                tags: ["WiFi", "Chill zone", "Projector", "Whiteboard"] 
            },
            { 
                _key: 'room_103', 
                name: '103', 
                description: 'Лаборатория для практических занятий', 
                grid: { rows: 3, cols: 2 },
                tags: ["WiFi", "PyTorch", "TensorFlow", "CUDA"] 
            },
            { 
                _key: 'room_104', 
                name: '104', 
                description: 'Тут должно быть описание', 
                grid: { rows: 3, cols: 3 },
                tags: ["WiFi", "ТЕГ"] 
            },
            { 
                _key: 'room_105', 
                name: '105', 
                description: 'Кабинет с компьютерами для самостоятельной работы', 
                grid: { rows: 2, cols: 2 },
                tags: ["vsCode", "Jupyter Notebook", "WiFi"] 
            },
            { 
                _key: 'room_106', 
                name: '106', 
                description: 'ОПИСАНИЕ', 
                grid: { rows: 1, cols: 4 },
                tags: ["WiFi", "vsCode", "Jupyter Notebook"] 
            },
            { 
                _key: 'room_107', 
                name: '107', 
                description: 'Зал', 
                grid: { rows: 4, cols: 1 },
                tags: ["WiFi", "Docker", "Kubernetes", "OpenShift"] 
            },
            { 
                _key: 'room_108', 
                name: '108', 
                description: 'lalalalalla', 
                grid: { rows: 3, cols: 2 },
                tags: ["WiFi", "ТЕГ", "ПРОЕКТОР"] 
            }
        ];
        await db.collection('Rooms').import(roomsData);

        const computers = [];
        const softwarePool = ["Python 3.12", "CUDA 12.1", "PyTorch", "VS Code", "Docker", "Jupyter Notebook", "TensorFlow", "Anaconda", "Git", "Node.js", "R", "MATLAB", "Scala", "Go", "Rust", "Julia", "PHP", "Ruby", "Perl", "Swift", "Kotlin", "SQL Server", "MongoDB", "ArangoDB", "Neo4j", "Redis", "ElasticSearch", "Grafana", "Kibana", "Prometheus", "OpenCV", "Blender", "Unity3D", "Unreal Engine", "AutoCAD", "SolidWorks", "VMware", "VirtualBox", "Postman", "Figma", "Adobe Photoshop", "Adobe Illustrator", "Adobe Premiere Pro", "Adobe After Effects", "Microsoft Office", "LibreOffice", "Notepad++", "Sublime Text", "Atom", "Eclipse", "IntelliJ IDEA", "WebStorm", "PyCharm", "CLion", "Rider", "DataGrip"];
        
        roomsData.forEach(room => {
            const count = room.grid.rows * room.grid.cols;
            for (let i = 1; i <= count; i++) {
                computers.push({
                    _key: `pc_${room._key}_${i}`,
                    room_id: `Rooms/${room._key}`,
                    seat_index: i,
                    inv_number: `INV-2026-${Math.floor(Math.random() * (1000 - 100 + 1)) + 100}${i}`,
                    mac_address: `${i}${Math.floor(Math.random() * (9 + 1))}:${Math.floor(Math.random() * (9 + 1))}A:${Math.floor(Math.random() * (9 + 1))}B:${Math.floor(Math.random() * (9 + 1))}C:${Math.floor(Math.random() * (9 + 1))}D:5${i}`,
                    status: i % 5 === 0 ? 'maintenance' : 'active',
                    software: softwarePool.slice(0, 7),
                    specs: {
                        cpu: "Intel Core i5-13600K",
                        ram: "16 GB",
                        gpu: "RTX 4090"
                    },
                    meta: {
                        created_at: "2026-04-01T12:00:00Z",
                        created_by: "Users/admin_vasya"
                    }
                });
            }
        });
        await db.collection('Computers').import(computers);

        const bookings = [
            {
                _key: "book_8492",
                _from: "Users/ivan_i0000",
                _to: "Computers/pc_room_405b_1",
                start_at: "2026-10-12T08:00:00Z",
                end_at: "2026-10-12T09:30:00Z",
                status: "finished",
                total_work_time_minutes: 85,
                meta: { created_at: new Date().toISOString() },
                history: [
                    {
                        old_status: "reserved",
                        new_status: "active",
                        changed_at: "2026-10-12T10:05:00Z",
                        changed_by: "Users/ivan_i0000"
                    }
                ]
            }
        ];
        await db.collection('Bookings').import(bookings);

        console.log("Настройка завершена");
        process.exit(0);

    } catch (err) {
        console.error("Ошибка:", err.message);
        process.exit(1);
    }
}

setup();