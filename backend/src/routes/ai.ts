import { Router } from 'express';
import { aiController } from '../controllers/AIController';
import { authenticate, rateLimit } from '../middleware/auth';

const router = Router();

// Apply rate limiting to AI routes (more restrictive due to AI processing)
router.use(rateLimit(20, 900000)); // 20 requests per 15 minutes

// Public AI routes (general market analysis)
router.post('/market-analysis', aiController.generateMarketAnalysis);

// Protected AI routes (require authentication)
router.use(authenticate);

// Trading signals
router.post('/trading-signal/:symbol', aiController.generateTradingSignal);

// Portfolio analysis (requires user authentication)
router.post('/risk-assessment', aiController.generateRiskAssessment);
router.post('/portfolio-optimization', aiController.generatePortfolioOptimization);

// Custom insights
router.post('/insight', aiController.generateCustomInsight);

// Get insights
router.get('/insights/symbol/:symbol', aiController.getInsightsForSymbol);
router.get('/insights/user', aiController.getUserInsights);
router.get('/insights/summary', aiController.getInsightsSummary);

export default router;
