import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/register-first-admin', authController.registerFirstAdmin);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.post('/register-admin', authMiddleware, checkRole(['admin']), authController.registerAdmin);
router.get('/test-token', authMiddleware, (req, res) => {
  res.json({
    status: 'success',
    message: 'Your JWT is valid!',
    user: req.user
  });
});

// User management routes
router.get('/users', authMiddleware, checkRole(['admin']), authController.getAllUsers);
router.delete('/users/:id', authMiddleware, checkRole(['admin']), authController.deleteUser);
router.put('/profile', authMiddleware, authController.updateProfile);

// Remove or fix the problematic route that was using undefined searchParks
// router.get('/parks/search', authController.searchParks); // This was the problematic line

export default router;