import express from 'express';
import * as parkController from '../controllers/parkController.js';
import * as reviewController from '../controllers/reviewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.get('/search', parkController.searchParks); // Move search to the top and make it public
router.get('/', parkController.getAllParks);
router.get('/:id', parkController.getParkById);

// Protected routes - Admin only
router.use(authMiddleware); // Apply auth middleware to routes below
router.post('/', checkRole(['admin']), parkController.createPark);
router.put('/:id', checkRole(['admin']), parkController.updatePark);
router.delete('/:id', checkRole(['admin']), parkController.deletePark);

// Review routes - Mount these under parks routes
router.post('/:parkId/reviews', checkRole(['admin', 'user']), reviewController.addReview);
router.get('/:parkId/reviews', reviewController.getParkReviews);
router.get('/:parkId/reviews/:reviewId', reviewController.getReviewById);
router.put('/:parkId/reviews/:reviewId', checkRole(['admin', 'user']), reviewController.updateReview);
router.delete('/:parkId/reviews/:reviewId', checkRole(['admin', 'user']), reviewController.deleteReview);

export default router;