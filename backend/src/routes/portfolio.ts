import { Router } from 'express';
import { Portfolio } from '../models/Portfolio';
import { authenticate, rateLimit } from '../middleware/auth';
import { ApiResponse } from '../types';
import Joi from 'joi';

const router = Router();

// Apply rate limiting and authentication
router.use(rateLimit(50, 900000)); // 50 requests per 15 minutes
router.use(authenticate);

// Validation schemas
const addHoldingSchema = Joi.object({
  symbol: Joi.string().required(),
  quantity: Joi.number().positive().required(),
  averagePrice: Joi.number().positive().required(),
  purchaseDate: Joi.date().default(Date.now)
});

const updateHoldingSchema = Joi.object({
  symbol: Joi.string().required(),
  quantity: Joi.number().positive(),
  averagePrice: Joi.number().positive()
});

// Get user's portfolio
router.get('/', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user!._id });
    
    if (!portfolio) {
      res.status(404).json({
        success: false,
        error: 'Portfolio not found',
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: portfolio,
      timestamp: new Date()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch portfolio',
      timestamp: new Date()
    } as ApiResponse);
  }
});

// Add holding to portfolio
router.post('/holdings', async (req, res) => {
  try {
    const { error, value } = addHoldingSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message),
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

    let portfolio = await Portfolio.findOne({ userId: req.user!._id });
    
    if (!portfolio) {
      // Create new portfolio
      portfolio = new Portfolio({
        userId: req.user!._id,
        holdings: [],
        totalValue: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0
      });
    }

    // Check if holding already exists
    const existingHoldingIndex = portfolio.holdings.findIndex(
      h => h.symbol === value.symbol.toUpperCase()
    );

    if (existingHoldingIndex > -1) {
      // Update existing holding (average the prices)
      const existingHolding = portfolio.holdings[existingHoldingIndex];
      const totalQuantity = existingHolding.quantity + value.quantity;
      const totalCost = (existingHolding.averagePrice * existingHolding.quantity) + 
                       (value.averagePrice * value.quantity);
      
      existingHolding.quantity = totalQuantity;
      existingHolding.averagePrice = totalCost / totalQuantity;
    } else {
      // Add new holding
      portfolio.holdings.push({
        symbol: value.symbol.toUpperCase(),
        quantity: value.quantity,
        averagePrice: value.averagePrice,
        currentPrice: 0, // Will be updated by stock data service
        marketValue: 0,
        gainLoss: 0,
        gainLossPercent: 0,
        purchaseDate: value.purchaseDate
      });
    }

    await portfolio.save();

    res.status(200).json({
      success: true,
      data: portfolio,
      message: 'Holding added successfully',
      timestamp: new Date()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Add holding error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add holding',
      timestamp: new Date()
    } as ApiResponse);
  }
});

// Update holding in portfolio
router.put('/holdings/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { error, value } = updateHoldingSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message),
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

    const portfolio = await Portfolio.findOne({ userId: req.user!._id });
    
    if (!portfolio) {
      res.status(404).json({
        success: false,
        error: 'Portfolio not found',
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

    const holdingIndex = portfolio.holdings.findIndex(
      h => h.symbol === symbol.toUpperCase()
    );

    if (holdingIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Holding not found',
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

    // Update holding
    if (value.quantity !== undefined) {
      portfolio.holdings[holdingIndex].quantity = value.quantity;
    }
    if (value.averagePrice !== undefined) {
      portfolio.holdings[holdingIndex].averagePrice = value.averagePrice;
    }

    await portfolio.save();

    res.status(200).json({
      success: true,
      data: portfolio,
      message: 'Holding updated successfully',
      timestamp: new Date()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Update holding error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update holding',
      timestamp: new Date()
    } as ApiResponse);
  }
});

// Remove holding from portfolio
router.delete('/holdings/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    const portfolio = await Portfolio.findOne({ userId: req.user!._id });
    
    if (!portfolio) {
      res.status(404).json({
        success: false,
        error: 'Portfolio not found',
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

    const holdingIndex = portfolio.holdings.findIndex(
      h => h.symbol === symbol.toUpperCase()
    );

    if (holdingIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Holding not found',
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

    // Remove holding
    portfolio.holdings.splice(holdingIndex, 1);
    await portfolio.save();

    res.status(200).json({
      success: true,
      data: portfolio,
      message: 'Holding removed successfully',
      timestamp: new Date()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Remove holding error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove holding',
      timestamp: new Date()
    } as ApiResponse);
  }
});

// Update portfolio with current stock prices
router.post('/refresh', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user!._id });
    
    if (!portfolio) {
      res.status(404).json({
        success: false,
        error: 'Portfolio not found',
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

    if (portfolio.holdings.length === 0) {
      res.status(200).json({
        success: true,
        data: portfolio,
        message: 'Portfolio is empty',
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

    // Import stock data service
    const { stockDataService } = await import('../services/StockDataService');
    
    // Get current prices for all holdings
    const symbols = portfolio.holdings.map(h => h.symbol);
    const stocksData = await stockDataService.getMultipleStocksData(symbols);

    // Update holdings with current prices
    portfolio.holdings.forEach(holding => {
      const stockData = stocksData.find(s => s.symbol === holding.symbol);
      if (stockData) {
        holding.currentPrice = stockData.price;
      }
    });

    await portfolio.save();

    res.status(200).json({
      success: true,
      data: portfolio,
      message: 'Portfolio refreshed successfully',
      timestamp: new Date()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Refresh portfolio error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to refresh portfolio',
      timestamp: new Date()
    } as ApiResponse);
  }
});

// Get portfolio performance
router.get('/performance', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user!._id });
    
    if (!portfolio) {
      res.status(404).json({
        success: false,
        error: 'Portfolio not found',
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

    const performance = {
      totalValue: portfolio.totalValue,
      totalGainLoss: portfolio.totalGainLoss,
      totalGainLossPercent: portfolio.totalGainLossPercent,
      holdingsCount: portfolio.holdings.length,
      topPerformers: portfolio.holdings
        .filter(h => h.gainLossPercent > 0)
        .sort((a, b) => b.gainLossPercent - a.gainLossPercent)
        .slice(0, 3),
      worstPerformers: portfolio.holdings
        .filter(h => h.gainLossPercent < 0)
        .sort((a, b) => a.gainLossPercent - b.gainLossPercent)
        .slice(0, 3)
    };

    res.status(200).json({
      success: true,
      data: performance,
      timestamp: new Date()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Get portfolio performance error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch portfolio performance',
      timestamp: new Date()
    } as ApiResponse);
  }
});

export default router;
