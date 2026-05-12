import adminService from '../services/adminService.js';
import asyncHandler from '../utils/asyncHandler.js';

class AdminController {
    exportData = asyncHandler(async (req, res) => {
        const data = await adminService.exportAllData();
        res.status(200).json(data);
    });

    importData = asyncHandler(async (req, res) => {
        const result = await adminService.importAllData(req.body);
        res.status(200).json(result);
    });
}

export default new AdminController();