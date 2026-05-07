import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import bookingRoutes from './routes/bookings.js';
import { verifyToken } from './middleware/auth.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/rooms', roomRoutes); 
app.get('/', (req, res) => {
    res.send('рабоfeтает');
});

app.use((err, req, res, next) => {
    console.error("Ошибка на сервере:", err.stack);
    
    res.status(500).json({ 
        error: err.message || 'Произошла внутренняя ошибка сервера' 
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});