import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  createReview,
  getReviewsByNailArtist,
  updateReview,
  deleteReview
} from '../controllers/review.controller';

const router = Router();

// Create a review (requires authentication)
router.post('/', auth, createReview);

// Get reviews by nail artist ID (public)
router.get('/nail-artist/:nailArtistId', getReviewsByNailArtist);

// Update a review (requires authentication)
router.put('/:id', auth, updateReview);

// Delete a review (requires authentication)
router.delete('/:id', auth, deleteReview);

export default router; 