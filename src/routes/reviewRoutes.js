import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.get('/parks/:parkId/reviews', reviewController.getParkReviews);
router.get('/parks/:parkId/reviews/:reviewId', reviewController.getReviewById);

// Protected routes with role checks
router.post('/parks/:parkId/reviews', authMiddleware, checkRole(['admin', 'user']), reviewController.addReview);
router.put('/parks/:parkId/reviews/:reviewId', authMiddleware, checkRole(['admin', 'user']), reviewController.updateReview);
router.delete('/parks/:parkId/reviews/:reviewId', authMiddleware, checkRole(['admin', 'user']), reviewController.deleteReview);

// Admin only routes
router.get('/reviews/all', authMiddleware, checkRole(['admin']), reviewController.getAllReviews);
router.post('/reviews/moderate/:reviewId', authMiddleware, checkRole(['admin']), reviewController.moderateReview);

export default router;
