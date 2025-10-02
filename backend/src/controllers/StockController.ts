import { Request, Response } from 'express';
import { stockDataService } from '../services/StockDataService';
import { enhancedStockDataService } from '../services/EnhancedStockDataService';
import { ApiResponse, PaginatedResponse } from '../types';
import Joi from 'joi';

export class StockController {
  // Validation schemas
  private searchSchema = Joi.object({
    query: Joi.string().min(1).max(100).required(),
    limit: Joi.number().integer().min(1).max(50).default(20)
  });

  private marketDataSchema = Joi.object({
    symbol: Joi.string().required(),
    interval: Joi.string().valid('1min', '5min', '15min', '30min', '1hour', '1day').default('1day'),
    period: Joi.string().valid('1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max').default('1mo')
  });

  // Get stock data by symbol
  getStockData = async (req: Request, res: Response): Promise<void> => {
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

      const stockData = await stockDataService.getStockData(symbol.toUpperCase());
      
      if (!stockData) {
        res.status(404).json({
          success: false,
          error: `Stock data not found for symbol: ${symbol}`,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: stockData,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get stock data error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch stock data',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get multiple stocks data
  getMultipleStocksData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbols } = req.body;
      
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Symbols array is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      if (symbols.length > 20) {
        res.status(400).json({
          success: false,
          error: 'Maximum 20 symbols allowed per request',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const stocksData = await stockDataService.getMultipleStocksData(symbols.map(s => s.toUpperCase()));
      
      res.status(200).json({
        success: true,
        data: stocksData,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get multiple stocks data error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch stocks data',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get historical market data
  getMarketData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.params;
      const { interval, period } = req.query;

      // Validate query parameters
      const { error, value } = this.marketDataSchema.validate({
        symbol,
        interval,
        period
      });

      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details.map(detail => detail.message),
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const marketData = await stockDataService.getMarketData(
        value.symbol.toUpperCase(),
        value.period
      );
      
      res.status(200).json({
        success: true,
        data: marketData,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get market data error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch market data',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Search stocks
  searchStocks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { error, value } = this.searchSchema.validate(req.query);
      
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.details.map(detail => detail.message),
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const searchResults = await stockDataService.searchStocks(value.query, value.limit);
      
      res.status(200).json({
        success: true,
        data: searchResults,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Search stocks error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search stocks',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get top gainers
  getTopGainers = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (limit > 50) {
        res.status(400).json({
          success: false,
          error: 'Maximum 50 stocks allowed',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const topGainers = await stockDataService.getTopGainers(limit);
      
      res.status(200).json({
        success: true,
        data: topGainers,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get top gainers error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch top gainers',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get top losers
  getTopLosers = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (limit > 50) {
        res.status(400).json({
          success: false,
          error: 'Maximum 50 stocks allowed',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const topLosers = await stockDataService.getTopLosers(limit);
      
      res.status(200).json({
        success: true,
        data: topLosers,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get top losers error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch top losers',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get most active stocks
  getMostActive = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (limit > 50) {
        res.status(400).json({
          success: false,
          error: 'Maximum 50 stocks allowed',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const mostActive = await stockDataService.getMostActive(limit);
      
      res.status(200).json({
        success: true,
        data: mostActive,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get most active error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch most active stocks',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get market overview
  getMarketOverview = async (req: Request, res: Response): Promise<void> => {
    try {
      const [topGainers, topLosers, mostActive] = await Promise.all([
        stockDataService.getTopGainers(5),
        stockDataService.getTopLosers(5),
        stockDataService.getMostActive(5)
      ]);

      const overview = {
        topGainers,
        topLosers,
        mostActive,
        summary: {
          totalGainers: topGainers.length,
          totalLosers: topLosers.length,
          totalActive: mostActive.length
        }
      };
      
      res.status(200).json({
        success: true,
        data: overview,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get market overview error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch market overview',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get enhanced stock data with Alpha Vantage and Finnhub
  getEnhancedStockData = async (req: Request, res: Response): Promise<void> => {
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

              const enhancedData = await enhancedStockDataService.instance.getEnhancedStockData(symbol);
      
      if (!enhancedData) {
        res.status(404).json({
          success: false,
          error: `Enhanced stock data not found for symbol: ${symbol}`,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: enhancedData,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get enhanced stock data error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch enhanced stock data',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get enhanced market overview
  getEnhancedMarketOverview = async (req: Request, res: Response): Promise<void> => {
    try {
              const enhancedOverview = await enhancedStockDataService.instance.getEnhancedMarketOverview();
      
      res.status(200).json({
        success: true,
        data: enhancedOverview,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get enhanced market overview error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch enhanced market overview',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Get stock news (placeholder - would integrate with news API)
  getStockNews = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!symbol) {
        res.status(400).json({
          success: false,
          error: 'Symbol parameter is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Placeholder news data - in production, integrate with news API
      const news = [
        {
          id: '1',
          title: `${symbol} Reports Strong Q4 Earnings`,
          summary: 'Company exceeds expectations with robust quarterly performance',
          source: 'Financial News',
          publishedAt: new Date(),
          sentiment: 'positive' as const,
          url: '#'
        },
        {
          id: '2',
          title: `Analysts Upgrade ${symbol} Price Target`,
          summary: 'Multiple analysts raise price targets following recent developments',
          source: 'Market Watch',
          publishedAt: new Date(Date.now() - 3600000),
          sentiment: 'positive' as const,
          url: '#'
        }
      ];

      res.status(200).json({
        success: true,
        data: news.slice(0, limit),
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get stock news error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch stock news',
        timestamp: new Date()
      } as ApiResponse);
    }
  };
}

export const stockController = new StockController();
