import express from 'express';
import * as damagedParkController from '../controllers/damagedParkController.js';
import * as damageController from '../controllers/damageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes (if any)
router.get('/', authMiddleware, checkRole(['admin']), damagedParkController.getAllDamagedParks);

// Search and filter routes - must come before :id route
router.get('/search', authMiddleware, damagedParkController.searchDamagedParks);
router.get('/my-reports', authMiddleware, damageController.getMyReports);
router.get('/user/reports', authMiddleware, damagedParkController.getMyDamagedParks);

// Parameterized routes
router.get('/:id', damagedParkController.getDamagedParkById);

// Protected routes
router.post('/report', authMiddleware, checkRole(['admin', 'user']), damagedParkController.reportDamagedPark);
router.put('/:id', authMiddleware, checkRole(['admin']), damagedParkController.updateDamagedParkStatus);
router.delete('/:id', authMiddleware, checkRole(['admin']), damagedParkController.deleteDamagedPark);

export default router;
