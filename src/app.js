import express from 'express';
import * as parkController from '../controllers/parkController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', parkController.getAllParks);
router.get('/:id', parkController.getParkById);

// Protected routes
router.post('/', authMiddleware, checkRole(['admin']), parkController.createPark);
router.put('/:id', authMiddleware, checkRole(['admin']), parkController.updatePark);
router.delete('/:id', authMiddleware, checkRole(['admin']), parkController.deletePark);

export { router };

import express from 'express';
import authRoutes from './routes/authRoutes.js';
import parkRoutes from './routes/parkRoutes.js';

const app = express();

// Middleware
app.use(express.json());

// Mount routes
app.use('/api/parks', parkRoutes);  // Mount before other routes

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parks', parkRoutes);

export default app;