import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import db from './config/db.js';

import authRoutes from './routes/authRoutes.js';

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
