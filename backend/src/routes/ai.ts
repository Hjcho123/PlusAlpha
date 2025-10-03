import { Router } from 'express';
import { aiController } from '../controllers/AIController';
import { authenticate, rateLimit } from '../middleware/auth';

const router = Router();

// Public AI routes (no authentication required)
router.post('/market-analysis', aiController.generateMarketAnalysis);
router.post('/demo/trading-signal/:symbol', aiController.generateDemoTradingSignal);

// Protected AI routes (require authentication)
router.use(authenticate);

// Trading signals
router.post('/trading-signal/:symbol', aiController.generateTradingSignal);

// AI Chat for follow-up questions about stocks
router.post('/chat/:symbol', aiController.chatWithAIAboutStock);

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
