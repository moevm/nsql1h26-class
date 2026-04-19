import express from 'express';
import cors from 'cors';
import db from './config/db.js';

const app = express();
const PORT = 3000; 

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('работает');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is up on port ${PORT}`);
});