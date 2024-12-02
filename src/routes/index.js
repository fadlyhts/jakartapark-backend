import express from 'express';
import authRoutes from './authRoutes.js';
import parkRoutes from './parkRoutes.js';
import damagedParkRoutes from './damagedParkRoutes.js';
import repairedParkRoutes from './repairedParkRoutes.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/parks', parkRoutes); // This will handle both park and review routes
router.use('/damaged-parks', damagedParkRoutes);
router.use('/repaired-parks', repairedParkRoutes);

// Remove the separate reviews route since it's now part of parks
// router.use('/reviews', reviewRoutes);

export default router;