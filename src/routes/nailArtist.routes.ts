import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  registerNailArtist,
  updateNailArtist,
  getNailArtist,
  searchNailArtists
} from '../controllers/nailArtist.controller';

const router = Router();

// Public routes
router.get('/search', searchNailArtists);
router.get('/:id', getNailArtist);

// Protected routes
router.post('/register', auth, registerNailArtist);
router.put('/:id', auth, updateNailArtist);

export default router; 