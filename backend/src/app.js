import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import roomPublicRoutes from './routes/roomPublicRoutes.js';
import bookingRoutes from './routes/bookings.js';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Сервер системы бронирования запущен!');
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rooms', roomPublicRoutes);
app.use('/api/bookings', bookingRoutes);

app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';
    console.error(`[Error ${statusCode}]:`, message);
    res.status(statusCode).json({ message });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
});