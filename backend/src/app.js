import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/db.js';

import authRoutes from './routes/authRoutes.js';       // Вход и регистрация
import roomRoutes from './routes/roomRoutes.js';       // Главное окно (список аудиторий)
import bookingRoutes from './routes/bookingRoutes.js'; // История и создание броней

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Сервер системы бронирования запущен!');
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;


app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
