import express from 'express';
import * as repairedParkController from '../controllers/repairedParkController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, checkRole(['admin']), repairedParkController.addRepairRecord);
router.get('/', authMiddleware, checkRole(['admin']), repairedParkController.getAllRepairs);
router.put('/:id', authMiddleware, checkRole(['admin']), repairedParkController.updateRepair);
router.delete('/:id', authMiddleware, checkRole(['admin']), repairedParkController.deleteRepair);

export default router;
