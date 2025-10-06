import { Request, Response } from 'express';
import { aiService } from '../services/AIService';
import yahooFinance from 'yahoo-finance2';
import { ComprehensiveFinancialData, ApiResponse } from '../types';
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

      console.log(`🤖 Generating comprehensive trading signal for ${symbol}`);

      // Directly fetch comprehensive data using Yahoo Finance (same as StockController)
      let comprehensiveData: ComprehensiveFinancialData | null = null;
      try {
        console.log(`📊 Fetching comprehensive financial data for ${symbol}`);

        const sym = symbol.toUpperCase();

        // ============================================================================
        // PHASE 1: BASIC TRADING DATA FROM YAHOO QUOTE
        // ============================================================================
        const quote = await yahooFinance.quote(sym);

        // ============================================================================
        // PHASE 2: VALUE AND STATISTICS DATA FROM YAHOO SUMMARYDETAIL
        // ============================================================================
        const stats = await yahooFinance.quoteSummary(sym, {
          modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData']
        });

        // CORRECTED P/E LOGIC: summaryDetail first, fallback to defaultKeyStatistics
        const peRatio = stats.summaryDetail?.trailingPE || (stats.defaultKeyStatistics as any)?.trailingPE || null;
        const epsValue = stats.defaultKeyStatistics?.trailingEps || null;

        // ============================================================================
        // PHASE 3: ANALYST RECOMMENDATIONS FROM RECOMMENDATION TREND
        // ============================================================================
        const analystData = await yahooFinance.quoteSummary(sym, { modules: ['recommendationTrend'] });

        const analystRatings = analystData.recommendationTrend?.trend?.[0] ? {
          strongBuy: analystData.recommendationTrend.trend[0].strongBuy || 0,
          buy: analystData.recommendationTrend.trend[0].buy || 0,
          hold: analystData.recommendationTrend.trend[0].hold || 0,
          sell: analystData.recommendationTrend.trend[0].sell || 0,
          strongSell: analystData.recommendationTrend.trend[0].strongSell || 0,
          total: (analystData.recommendationTrend.trend[0].strongBuy || 0) +
                 (analystData.recommendationTrend.trend[0].buy || 0) +
                 (analystData.recommendationTrend.trend[0].hold || 0) +
                 (analystData.recommendationTrend.trend[0].sell || 0) +
                 (analystData.recommendationTrend.trend[0].strongSell || 0),
          bullishPercent: ((analystData.recommendationTrend.trend[0].strongBuy || 0) +
                          (analystData.recommendationTrend.trend[0].buy || 0)) /
                         ((analystData.recommendationTrend.trend[0].strongBuy || 0) +
                          (analystData.recommendationTrend.trend[0].buy || 0) +
                          (analystData.recommendationTrend.trend[0].hold || 0) +
                          (analystData.recommendationTrend.trend[0].sell || 0) +
                          (analystData.recommendationTrend.trend[0].strongSell || 0)) * 100 || 0,
          consensus: (() => {
            const bullish = (analystData.recommendationTrend?.trend?.[0]?.strongBuy || 0) +
                           (analystData.recommendationTrend?.trend?.[0]?.buy || 0);
            const total = bullish +
                         (analystData.recommendationTrend?.trend?.[0]?.hold || 0) +
                         (analystData.recommendationTrend?.trend?.[0]?.sell || 0) +
                         (analystData.recommendationTrend?.trend?.[0]?.strongSell || 0);

            if (bullish > total * 0.5) return 'BUY' as const;
            if ((analystData.recommendationTrend?.trend?.[0]?.sell || 0) +
                (analystData.recommendationTrend?.trend?.[0]?.strongSell || 0) > total * 0.5) return 'SELL' as const;
            return 'HOLD' as const;
          })()
        } : null;

        // ============================================================================
        // PHASE 4: COMPANY PROFILE FROM ASSET PROFILE
        // ============================================================================
        const profile = await yahooFinance.quoteSummary(sym, { modules: ['assetProfile', 'summaryProfile'] });

        // ============================================================================
        // EXTRACT ALL DATA WITH PROPER FALLBACKS - NO HARDCODED DATA
        // ============================================================================
        comprehensiveData = {
          // Valuation metrics
          pe: peRatio,
          eps: epsValue,
          pegRatio: stats.defaultKeyStatistics?.pegRatio || null,
          priceToBook: stats.defaultKeyStatistics?.priceToBook || null,
          forwardPE: stats.defaultKeyStatistics?.forwardPE || null,
          forwardEPS: stats.defaultKeyStatistics?.forwardPE ? stats.defaultKeyStatistics?.forwardPE : null,
          beta: stats.summaryDetail?.beta || null,

          // Financial health
          debtToEquity: stats.financialData?.debtToEquity || null,
          currentRatio: stats.financialData?.currentRatio || null,
          quickRatio: stats.financialData?.quickRatio || null,
          totalCash: stats.financialData?.totalCash || null,
          freeCashFlow: stats.financialData?.freeCashflow || null,
          roa: stats.financialData?.returnOnAssets || null,
          roe: stats.financialData?.returnOnEquity || null,

          // Dividends
          dividendRate: stats.summaryDetail?.dividendRate || null,
          dividendYield: stats.summaryDetail?.dividendYield || null,
          dividendPayoutRatio: stats.summaryDetail?.payoutRatio || null,

          // Analyst data
          analystRatings,

          // Company info
          sector: profile.assetProfile?.sector || null,
          industry: profile.assetProfile?.industry || null,
          ceo: profile.assetProfile?.companyOfficers?.[0]?.name || null,
          employees: profile.assetProfile?.fullTimeEmployees || null,
          headquarters: profile.assetProfile ? `${profile.assetProfile.city || ''}, ${profile.assetProfile.state || ''}, ${profile.assetProfile.country || ''}`.trim() || null : null,
          businessSummary: profile.assetProfile?.longBusinessSummary || null
        };

        console.log(`✅ Retrieved comprehensive data:`, {
          hasValuation: !!(comprehensiveData.pe || comprehensiveData.pegRatio),
          hasFinancialHealth: !!(comprehensiveData.roa || comprehensiveData.roe),
          hasAnalystRatings: !!comprehensiveData.analystRatings,
          hasCompanyProfile: !!(comprehensiveData.sector || comprehensiveData.ceo),
          totalAnalysts: comprehensiveData.analystRatings?.total || 0
        });
      } catch (error) {
        console.warn(`⚠️ Could not fetch comprehensive data for ${symbol}, proceeding with basic data:`, error);
        comprehensiveData = null;
      }

      console.log(`🤖 Calling AI service with ${comprehensiveData ? 'comprehensive' : 'basic'} data (A/R/O/CEO: ${comprehensiveData?.analystRatings?.total ?? 'N/A'}, ${comprehensiveData?.roa ?? 'N/A'}, ${comprehensiveData?.sector ?? 'N/A'}, ${comprehensiveData?.ceo ?? 'N/A'})`);
      const insight = await aiService.generateTradingSignal(symbol.toUpperCase(), userId, comprehensiveData || undefined);

      if (!insight) {
        res.status(500).json({
          success: false,
          error: 'Failed to generate trading signal',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      console.log(`✅ AI insight generated with ${comprehensiveData ? 'comprehensive' : 'basic'} data analysis`);
      res.status(200).json({
        success: true,
        data: insight,
        message: `Trading signal generated successfully using ${comprehensiveData ? 'comprehensive financial data' : 'basic market data'}`,
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

      console.log(`📊 Generating comprehensive demo trading signal for ${symbol}`);

      // Directly fetch comprehensive data using Yahoo Finance (same as StockController)
      let comprehensiveData: ComprehensiveFinancialData | null = null;
      try {
        console.log(`📊 Fetching comprehensive financial data for ${symbol}`);

        const sym = symbol.toUpperCase();

        // ============================================================================
        // PHASE 1: BASIC TRADING DATA FROM YAHOO QUOTE
        // ============================================================================
        const quote = await yahooFinance.quote(sym);

        // ============================================================================
        // PHASE 2: VALUE AND STATISTICS DATA FROM YAHOO SUMMARYDETAIL
        // ============================================================================
        const stats = await yahooFinance.quoteSummary(sym, {
          modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData']
        });

        // CORRECTED P/E LOGIC: summaryDetail first, fallback to defaultKeyStatistics
        const peRatio = stats.summaryDetail?.trailingPE || (stats.defaultKeyStatistics as any)?.trailingPE || null;
        const epsValue = stats.defaultKeyStatistics?.trailingEps || null;

        // ============================================================================
        // PHASE 3: ANALYST RECOMMENDATIONS FROM RECOMMENDATION TREND
        // ============================================================================
        const analystData = await yahooFinance.quoteSummary(sym, { modules: ['recommendationTrend'] });

        const analystRatings = analystData.recommendationTrend?.trend?.[0] ? {
          strongBuy: analystData.recommendationTrend.trend[0].strongBuy || 0,
          buy: analystData.recommendationTrend.trend[0].buy || 0,
          hold: analystData.recommendationTrend.trend[0].hold || 0,
          sell: analystData.recommendationTrend.trend[0].sell || 0,
          strongSell: analystData.recommendationTrend.trend[0].strongSell || 0,
          total: (analystData.recommendationTrend.trend[0].strongBuy || 0) +
                 (analystData.recommendationTrend.trend[0].buy || 0) +
                 (analystData.recommendationTrend.trend[0].hold || 0) +
                 (analystData.recommendationTrend.trend[0].sell || 0) +
                 (analystData.recommendationTrend.trend[0].strongSell || 0),
          bullishPercent: ((analystData.recommendationTrend.trend[0].strongBuy || 0) +
                          (analystData.recommendationTrend.trend[0].buy || 0)) /
                         ((analystData.recommendationTrend.trend[0].strongBuy || 0) +
                          (analystData.recommendationTrend.trend[0].buy || 0) +
                          (analystData.recommendationTrend.trend[0].hold || 0) +
                          (analystData.recommendationTrend.trend[0].sell || 0) +
                          (analystData.recommendationTrend.trend[0].strongSell || 0)) * 100 || 0,
          consensus: (() => {
            const bullish = (analystData.recommendationTrend?.trend?.[0]?.strongBuy || 0) +
                           (analystData.recommendationTrend?.trend?.[0]?.buy || 0);
            const total = bullish +
                         (analystData.recommendationTrend?.trend?.[0]?.hold || 0) +
                         (analystData.recommendationTrend?.trend?.[0]?.sell || 0) +
                         (analystData.recommendationTrend?.trend?.[0]?.strongSell || 0);

            if (bullish > total * 0.5) return 'BUY' as const;
            if ((analystData.recommendationTrend?.trend?.[0]?.sell || 0) +
                (analystData.recommendationTrend?.trend?.[0]?.strongSell || 0) > total * 0.5) return 'SELL' as const;
            return 'HOLD' as const;
          })()
        } : null;

        // ============================================================================
        // PHASE 4: COMPANY PROFILE FROM ASSET PROFILE
        // ============================================================================
        const profile = await yahooFinance.quoteSummary(sym, { modules: ['assetProfile', 'summaryProfile'] });

        // ============================================================================
        // EXTRACT ALL DATA WITH PROPER FALLBACKS - NO HARDCODED DATA
        // ============================================================================
        comprehensiveData = {
          // Valuation metrics
          pe: peRatio,
          eps: epsValue,
          pegRatio: stats.defaultKeyStatistics?.pegRatio || null,
          priceToBook: stats.defaultKeyStatistics?.priceToBook || null,
          forwardPE: stats.defaultKeyStatistics?.forwardPE || null,
          forwardEPS: stats.defaultKeyStatistics?.forwardPE ? stats.defaultKeyStatistics?.forwardPE : null,
          beta: stats.summaryDetail?.beta || null,

          // Financial health
          debtToEquity: stats.financialData?.debtToEquity || null,
          currentRatio: stats.financialData?.currentRatio || null,
          quickRatio: stats.financialData?.quickRatio || null,
          totalCash: stats.financialData?.totalCash || null,
          freeCashFlow: stats.financialData?.freeCashflow || null,
          roa: stats.financialData?.returnOnAssets || null,
          roe: stats.financialData?.returnOnEquity || null,

          // Dividends
          dividendRate: stats.summaryDetail?.dividendRate || null,
          dividendYield: stats.summaryDetail?.dividendYield || null,
          dividendPayoutRatio: stats.summaryDetail?.payoutRatio || null,

          // Analyst data
          analystRatings,

          // Company info
          sector: profile.assetProfile?.sector || null,
          industry: profile.assetProfile?.industry || null,
          ceo: profile.assetProfile?.companyOfficers?.[0]?.name || null,
          employees: profile.assetProfile?.fullTimeEmployees || null,
          headquarters: profile.assetProfile ? `${profile.assetProfile.city || ''}, ${profile.assetProfile.state || ''}, ${profile.assetProfile.country || ''}`.trim() || null : null,
          businessSummary: profile.assetProfile?.longBusinessSummary || null
        };

        console.log(`✅ Retrieved comprehensive data for demo:`, {
          hasValuation: !!(comprehensiveData.pe || comprehensiveData.pegRatio),
          hasFinancialHealth: !!(comprehensiveData.roa || comprehensiveData.roe),
          hasAnalystRatings: !!comprehensiveData.analystRatings,
          hasCompanyProfile: !!(comprehensiveData.sector || comprehensiveData.ceo),
          totalAnalysts: comprehensiveData.analystRatings?.total || 0
        });
      } catch (error) {
        console.warn(`⚠️ Could not fetch comprehensive data for demo ${symbol}, proceeding with basic data:`, error);
        comprehensiveData = null;
      }

      console.log(`🤖 Calling AI service for demo with ${comprehensiveData ? 'comprehensive' : 'basic'} data`);
      // Generate insight without user ID for demo purposes, but WITH comprehensive data
      const insight = await aiService.generateTradingSignal(symbol.toUpperCase(), undefined, comprehensiveData || undefined);

      if (!insight) {
        console.error(`❌ Failed to generate demo insight for ${symbol} - insight is null`);
        res.status(500).json({
          success: false,
          error: 'Failed to generate trading signal - no insight returned',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      console.log(`✅ Successfully generated comprehensive demo trading signal for ${symbol}`);
      res.status(200).json({
        success: true,
        data: insight,
        message: `Demo trading signal generated successfully using ${comprehensiveData ? 'comprehensive financial data' : 'basic market data'}`,
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
