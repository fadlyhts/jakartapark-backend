import express from 'express';
import * as damagedParkController from '../controllers/damagedParkController.js';
import * as damageController from '../controllers/damageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Add this route before other routes
router.get('/my-reports', authMiddleware, damageController.getMyReports);

// Public routes (if any)
router.get('/', authMiddleware, checkRole(['admin']), damagedParkController.getAllDamagedParks);
router.get('/:id', damagedParkController.getDamagedParkById);

// Protected routes - require authentication
router.use(authMiddleware); // Apply auth middleware to all routes below

router.post('/report', authMiddleware, checkRole(['admin', 'user']), damagedParkController.reportDamagedPark);
router.put('/:id', authMiddleware, checkRole(['admin']), damagedParkController.updateDamagedPark);
router.delete('/:id', authMiddleware, checkRole(['admin']), damagedParkController.deleteDamagedPark);
router.get('/search', damagedParkController.searchDamagedParks);
router.get('/user/reports', damagedParkController.getMyDamagedParks);

export default router;