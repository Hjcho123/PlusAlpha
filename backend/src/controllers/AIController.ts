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

      const insight = await aiService.generateMarketAnalysis(value.symbols.map((s: string) => s.toUpperCase()));
      
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
          const riskAssessment = await aiService.generateRiskAssessment(userId!);
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

  // Analyze stock with provided data (accepts real Yahoo Finance data)
  analyzeStockWithData = async (req: Request, res: Response): Promise<void> => {
    try {
      const stockData = req.body;

      if (!stockData || !stockData.symbol || !stockData.price) {
        res.status(400).json({
          success: false,
          error: 'Valid stock data required (symbol, price, etc.)',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const symbol = stockData.symbol.toUpperCase();
      console.log(`📊 Analyzing ${symbol} with provided data from frontend...`);
      console.log(`📊 Real data: Price $${stockData.price}, Change ${stockData.changePercent}%, Volume ${stockData.volume}`);

      // Honest analysis using only real Yahoo Finance data
      const prompt = `You are a experienced financial analyst. Analyze ${stockData.name} (${symbol}) using the real market data from Yahoo Finance and provide an investment recommendation.

REAL MARKET DATA (from Yahoo Finance):
- Company: ${stockData.name}
- Symbol: ${symbol}
- Current Price: $${stockData.price}
- Daily Change: ${stockData.change >= 0 ? '+' : ''}$${stockData.change} (${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent}%)
- Market Cap: $${(stockData.marketCap / 1000000000)?.toFixed(1)}B
- Trading Volume: ${(stockData.volume / 1000000)?.toFixed(1)}M shares
- P/E Ratio: ${stockData.pe || 'N/A'}
- EPS: $${stockData.eps || 'N/A'}
- Dividend Rate: $${stockData.dividend || 'N/A'}
- Dividend Yield: ${stockData.dividendYield ? stockData.dividendYield.toFixed(2) + '%' : 'N/A'}
- 52W High: $${stockData.high52Week || 'N/A'}
- 52W Low: $${stockData.low52Week || 'N/A'}

ANALYSIS REQUIREMENTS:
1. Assess price momentum and recent performance
2. Evaluate valuation based on available metrics
3. Analyze trading volume and market interest
4. Consider 52-week price range positioning

Note: We do not have sector/industry data, technical indicators (like RSI/MACD), or competitive positioning from Yahoo Finance basic data. Base analysis only on the provided metrics.

PROVIDE A PRACTICAL INVESTMENT ANALYSIS:

Response as JSON:
{
  "description": "Clear analysis summary based on available data",
  "action": "buy|sell|hold|watch",
  "confidence": 70,
  "reasoning": [
    "Specific analysis based on provided data",
    "Key observations from price and volume",
    "Valuation insights from P/E and market cap",
    "52-week range analysis and position"
  ]
}

Be honest about data limitations and provide actionable insights based on what we know.`;

      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      };

      console.log('📡 Making Gemini API call with real stock data...');
      const axios = (await import('axios')).default;
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
        requestBody,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 600000
        }
      );

      console.log('📡 Gemini response received with real data analysis');
      const analysis = JSON.parse(response.data.candidates[0]?.content?.parts?.[0]?.text);
      console.log(`📊 Gemini analysis result:`, analysis);

      // Create insight with comprehensive analysis
      const insight = {
        _id: `insight-${Date.now()}`,
        symbol: symbol,
        type: 'trading_signal',
        title: `Expert Gemini AI Analysis: ${stockData.name}`,
        description: analysis.description || `Comprehensive AI analysis for ${stockData.name}`,
        confidence: analysis.confidence || 85,
        action: analysis.action || 'hold',
        reasoning: analysis.reasoning || [`Expert analysis of ${stockData.name} completed`],
        keyInsights: analysis.keyInsights || [],
        risks: analysis.risks || [],
        technicalIndicators: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log(`✅ Expert Gemini analysis completed: ${insight.action.toUpperCase()} (${insight.confidence}%)`);
      console.log(`🔑 Key Insights: ${insight.keyInsights?.length || 0}`);
      console.log(`⚠️  Risks Identified: ${insight.risks?.length || 0}`);

      console.log(`✅ Completed real-time Gemini analysis: ${insight.action.toUpperCase()} (${insight.confidence}%)`);
      res.status(200).json({
        success: true,
        data: insight,
        message: 'Stock analyzed successfully with real data',
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('❌ Analyze with data error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze stock',
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

      // Use simplified approach - get basic data and create mock market data
      const { stockDataService } = await import('../services/StockDataService');
      const basicData = await stockDataService.getStockData(symbol);

      if (!basicData) {
        res.status(404).json({
          success: false,
          error: `Stock data not found for ${symbol}`,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Create mock market data for Gemini analysis
      const mockMarketData = [{
        timestamp: new Date(),
        open: basicData.price,
        high: basicData.price * 1.02,
        low: basicData.price * 0.98,
        close: basicData.price
      }];

      console.log(`📊 Analyzing ${symbol} with Gemini AI...`);

      // Use the simple approach from the test that works
      const prompt = `Analyze ${symbol} stock and provide a brief trading recommendation:
Price: $${basicData.price} (${basicData.changePercent >= 0 ? '+' : ''}${basicData.changePercent}%)
Market Cap: $${basicData.marketCap ? basicData.marketCap.toLocaleString() : 'N/A'}

Respond with JSON: {"action":"buy|sell|hold|watch","confidence":85,"reasoning":["reason1","reason2"],"description":"brief analysis"}`;

      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      };

      console.log('📡 Making Gemini API call...');
      const axios = (await import('axios')).default;
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
        requestBody,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 600000
        }
      );

      console.log('📡 Gemini response received');
      const analysis = JSON.parse(response.data.candidates[0]?.content?.parts?.[0]?.text);
      console.log(`📊 Gemini analysis result:`, analysis);

      // Always create insight with Gemini analysis (it worked in standalone test)
      const insight = {
        _id: `demo-${Date.now()}`,
        symbol: symbol.toUpperCase(),
        type: 'trading_signal',
        title: `Demo Trading Signal: ${symbol}`,
        description: analysis.description || `Gemini AI analysis of ${symbol}`,
        confidence: analysis.confidence || 75,
        action: analysis.action || 'hold',
        reasoning: analysis.reasoning || [`Gemini AI recommends ${analysis.action || 'hold'}`],
        technicalIndicators: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log(`✅ Successfully generated demo trading signal: ${insight.action.toUpperCase()} (${insight.confidence}%)`);
      console.log(`📤 Sending response:`, JSON.stringify({
        success: true,
        data: insight,
        message: 'Demo trading signal generated successfully'
      }, null, 2));
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
