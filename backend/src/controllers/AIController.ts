import { Request, Response } from 'express';
import { aiService } from '../services/AIService';
import { ApiResponse } from '../types';
import Joi from 'joi';

export class AIController {
  // Validation schemas
  private generateInsightSchema = Joi.object({
    symbol: Joi.string().required(),
    type: Joi.string().valid('trading_signal', 'market_analysis', 'risk_assessment', 'portfolio_optimization').required(),
    customPrompt: Joi.string().max(500).optional()
  });

  private marketAnalysisSchema = Joi.object({
    symbols: Joi.array().items(Joi.string()).min(1).max(10).required()
  });

  // Generate AI trading signal
  generateTradingSignal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.params;
      const userId = req.user?._id?.toString();

      if (!symbol) {
        res.status(400).json({
          success: false,
          error: 'Symbol parameter is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const insight = await aiService.generateTradingSignal(symbol.toUpperCase(), userId);
      
      if (!insight) {
        res.status(500).json({
          success: false,
          error: 'Failed to generate trading signal',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: insight,
        message: 'Trading signal generated successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Generate trading signal error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate trading signal',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Generate market analysis
  generateMarketAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { error, value } = this.marketAnalysisSchema.validate(req.body);
      
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details.map(detail => detail.message),
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const insight = await aiService.generateMarketAnalysis(value.symbols.map(s => s.toUpperCase()));
      
      if (!insight) {
        res.status(500).json({
          success: false,
          error: 'Failed to generate market analysis',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: insight,
        message: 'Market analysis generated successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Generate market analysis error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate market analysis',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Generate risk assessment
  generateRiskAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const riskAssessment = await aiService.generateRiskAssessment(req.user._id.toString());
      
      if (!riskAssessment) {
        res.status(500).json({
          success: false,
          error: 'Failed to generate risk assessment',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: riskAssessment,
        message: 'Risk assessment generated successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Generate risk assessment error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate risk assessment',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Generate portfolio optimization
  generatePortfolioOptimization = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const optimization = await aiService.generatePortfolioOptimization(req.user._id.toString());
      
      if (!optimization) {
        res.status(500).json({
          success: false,
          error: 'Failed to generate portfolio optimization',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: optimization,
        message: 'Portfolio optimization generated successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Generate portfolio optimization error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate portfolio optimization',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Generate custom AI insight
  generateCustomInsight = async (req: Request, res: Response): Promise<void> => {
    try {
      const { error, value } = this.generateInsightSchema.validate(req.body);
      
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details.map(detail => detail.message),
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const userId = req.user?._id?.toString();
      let insight;

      switch (value.type) {
        case 'trading_signal':
          insight = await aiService.generateTradingSignal(value.symbol.toUpperCase(), userId);
          break;
        case 'market_analysis':
          insight = await aiService.generateMarketAnalysis([value.symbol.toUpperCase()]);
          break;
        case 'risk_assessment':
          if (!req.user) {
            res.status(401).json({
              success: false,
              error: 'User authentication required for risk assessment',
              timestamp: new Date()
            } as ApiResponse);
            return;
          }
          const riskAssessment = await aiService.generateRiskAssessment(userId);
          res.status(200).json({
            success: true,
            data: riskAssessment,
            message: 'Risk assessment generated successfully',
            timestamp: new Date()
          } as ApiResponse);
          return;
        case 'portfolio_optimization':
          if (!req.user) {
            res.status(401).json({
              success: false,
              error: 'User authentication required for portfolio optimization',
              timestamp: new Date()
            } as ApiResponse);
            return;
          }
          const optimization = await aiService.generatePortfolioOptimization(userId);
          res.status(200).json({
            success: true,
            data: optimization,
            message: 'Portfolio optimization generated successfully',
            timestamp: new Date()
          } as ApiResponse);
          return;
        default:
          res.status(400).json({
            success: false,
            error: 'Invalid insight type',
            timestamp: new Date()
          } as ApiResponse);
          return;
      }

      if (!insight) {
        res.status(500).json({
          success: false,
          error: 'Failed to generate insight',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: insight,
        message: 'AI insight generated successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Generate custom insight error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate insight',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get AI insights for a symbol
  getInsightsForSymbol = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.params;
      const { type, limit } = req.query;
      
      if (!symbol) {
        res.status(400).json({
          success: false,
          error: 'Symbol parameter is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const limitNum = parseInt(limit as string) || 10;
      const userId = req.user?._id?.toString();

      // Import AIInsight model
      const { AIInsight } = await import('../models/AIInsight');
      
      const query: any = { symbol: symbol.toUpperCase() };
      if (type) query.type = type;
      if (userId) query.userId = userId;

      const insights = await AIInsight.find(query)
        .sort({ createdAt: -1 })
        .limit(limitNum);

      res.status(200).json({
        success: true,
        data: insights,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get insights for symbol error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch insights',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get user's AI insights
  getUserInsights = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const { type, limit } = req.query;
      const limitNum = parseInt(limit as string) || 20;

      // Import AIInsight model
      const { AIInsight } = await import('../models/AIInsight');
      
      const query: any = { userId: req.user._id };
      if (type) query.type = type;

      const insights = await AIInsight.find(query)
        .sort({ createdAt: -1 })
        .limit(limitNum);

      res.status(200).json({
        success: true,
        data: insights,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get user insights error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch user insights',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get AI insights summary
  getInsightsSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?._id?.toString();

      // Import AIInsight model
      const { AIInsight } = await import('../models/AIInsight');
      
      const query: any = {};
      if (userId) query.userId = userId;

      const [totalInsights, recentInsights, insightsByType] = await Promise.all([
        AIInsight.countDocuments(query),
        AIInsight.find(query).sort({ createdAt: -1 }).limit(5),
        AIInsight.aggregate([
          { $match: query },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      ]);

      const summary = {
        totalInsights,
        recentInsights,
        insightsByType: insightsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as { [key: string]: number })
      };

      res.status(200).json({
        success: true,
        data: summary,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get insights summary error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch insights summary',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Generate demo trading signal (public endpoint - no auth required)
  generateDemoTradingSignal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        res.status(400).json({
          success: false,
          error: 'Symbol parameter is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      console.log(`📊 Generating demo trading signal for ${symbol}`);

      // Generate insight without user ID for demo purposes
      const insight = await aiService.generateTradingSignal(symbol.toUpperCase(), undefined);

      if (!insight) {
        console.error(`❌ Failed to generate insight for ${symbol} - insight is null`);
        res.status(500).json({
          success: false,
          error: 'Failed to generate trading signal - no insight returned',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      console.log(`✅ Successfully generated demo trading signal for ${symbol}`);
      res.status(200).json({
        success: true,
        data: insight,
        message: 'Demo trading signal generated successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('❌ Generate demo trading signal error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate demo trading signal',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // AI Chat for follow-up questions about stocks
  chatWithAIAboutStock = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.params;
      const { message, context } = req.body;

      if (!symbol || !message) {
        res.status(400).json({
          success: false,
          error: 'Symbol and message parameters are required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const chatResponse = await aiService.chatAboutStock(symbol.toUpperCase(), message, context);

      if (!chatResponse) {
        res.status(500).json({
          success: false,
          error: 'Failed to generate chat response',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: chatResponse,
        message: 'Chat response generated successfully',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Chat with AI error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to chat with AI',
        timestamp: new Date()
      } as ApiResponse);
    }
  };
}

export const aiController = new AIController();
