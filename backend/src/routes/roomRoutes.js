import { Router } from 'express';
const router = Router();

// // GET /api/rooms — Получить все аудитории
// router.get('/', (req, res) => {
//     res.json({ message: "Список всех аудиторий" });
// });
//
// // GET /api/rooms/:roomId/computers — Получить все ПК в выбранной аудитории
// router.get('/:roomId/computers', (req, res) => {
//     const { roomId } = req.params;
//     res.json({ message: `Список ПК для аудитории ${roomId}` });
// });

export default router;