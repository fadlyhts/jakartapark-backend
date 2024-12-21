// abian

import express from 'express';
import { parkSeeder } from '../seeders/parkSeeder.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/parks',
    authMiddleware,
    checkRole(['admin']),
    async(req, res) => {
        try {
            await parkSeeder();
            res.json({
                status: 'success',
                message: 'Parks berhasil di-seed'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    });

export default router;