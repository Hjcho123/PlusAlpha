import { Router } from 'express';
import { watchlistController } from '../controllers/WatchlistController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All watchlist routes require authentication
router.use(authenticate);

// GET /api/watchlist - Get user's watchlist
router.get('/', watchlistController.getWatchlist);

// POST /api/watchlist/:symbol - Add stock to watchlist
router.post('/:symbol', watchlistController.addToWatchlist);

// DELETE /api/watchlist/:symbol - Remove stock from watchlist
router.delete('/:symbol', watchlistController.removeFromWatchlist);

// DELETE /api/watchlist - Clear entire watchlist
router.delete('/', watchlistController.clearWatchlist);

// DELETE /api/watchlist/multiple - Remove multiple stocks from watchlist
router.delete('/multiple', watchlistController.removeMultipleFromWatchlist);

export default router;
