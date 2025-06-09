import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getAllNailArtists,
  approveNailArtist,
  rejectNailArtist,
  deleteNailArtist
} from '../controllers/admin.controller';

const router = Router();

// All routes require authentication
router.use(auth);

// Get all nail artists with pagination
router.get('/nail-artists', getAllNailArtists);

// Approve nail artist
router.put('/nail-artists/:id/approve', approveNailArtist);

// Reject nail artist
router.put('/nail-artists/:id/reject', rejectNailArtist);

// Delete nail artist
router.delete('/nail-artists/:id', deleteNailArtist);

export default router; 