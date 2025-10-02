import { Router } from 'express';
import { stockController } from '../controllers/StockController';
import { optionalAuth, rateLimit } from '../middleware/auth';

const router = Router();

// Apply rate limiting to stock routes
router.use(rateLimit(100, 900000)); // 100 requests per 15 minutes

// Apply optional authentication (for personalized features)
router.use(optionalAuth);

// Stock data routes
router.get('/search', stockController.searchStocks);
router.get('/overview', stockController.getMarketOverview);
router.get('/overview/enhanced', stockController.getEnhancedMarketOverview);
router.get('/top-gainers', stockController.getTopGainers);
router.get('/top-losers', stockController.getTopLosers);
router.get('/most-active', stockController.getMostActive);

// Individual stock routes
router.get('/:symbol', stockController.getStockData);
router.get('/:symbol/enhanced', stockController.getEnhancedStockData);
router.get('/:symbol/market-data', stockController.getMarketData);
router.get('/:symbol/news', stockController.getStockNews);

// Batch operations
router.post('/batch', stockController.getMultipleStocksData);

export default router;
