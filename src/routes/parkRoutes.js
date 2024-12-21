import express from 'express';
import * as parkController from '../controllers/parkController.js';
import * as reviewController from '../controllers/reviewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All public routes (no authentication required)
router.get('/search', parkController.searchParks);
router.get('/', parkController.getAllParks);
router.get('/:id', parkController.getParkById);
router.get('/:parkId/reviews', reviewController.getParkReviews);
router.get('/:parkId/reviews/:reviewId', reviewController.getReviewById);

// Protected routes below this line
router.use(authMiddleware);

// Protected park routes
router.post('/', checkRole(['admin']), parkController.createPark);
router.put('/:id', checkRole(['admin']), parkController.updatePark);
router.delete('/:id', checkRole(['admin']), parkController.deletePark);

// Protected review operations
router.post('/:parkId/reviews', checkRole(['admin', 'user']), reviewController.addReview);
router.put('/:parkId/reviews/:reviewId', checkRole(['admin', 'user']), reviewController.updateReview);
router.delete('/:parkId/reviews/:reviewId', checkRole(['admin', 'user']), reviewController.deleteReview);

export default router;