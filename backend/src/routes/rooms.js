import express from 'express';
import { 
    getAllRooms, 
    getRoomDetails, 
    getAdminRooms, 
    createRoom, 
    updateRoom, 
    deleteRoom,
    getAvailablePCs,
    assignPCToRoom,
    unassignPC
} from '../controllers/roomController.js';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/admin/list', [verifyToken, isAdmin], getAdminRooms);
router.post('/admin/create', [verifyToken, isAdmin], createRoom);
router.put('/admin/update/:id', [verifyToken, isAdmin], updateRoom);
router.delete('/admin/delete/:id', [verifyToken, isAdmin], deleteRoom);

router.get('/available-pcs', [verifyToken, isAdmin], getAvailablePCs);
router.post('/admin/assign-pc', [verifyToken, isAdmin], assignPCToRoom);
router.delete('/admin/unassign-pc/:pc_key', [verifyToken, isAdmin], unassignPC);

router.get('/', getAllRooms);
router.get('/:id', getRoomDetails);


export default router;