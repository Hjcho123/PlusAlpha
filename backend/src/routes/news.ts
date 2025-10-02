import express from 'express';
import { newsService } from '../services/NewsService';
import { calendarService } from '../services/CalendarService';

const router = express.Router();

// Get financial news
router.get('/financial', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const news = await newsService.getFinancialNews(limit);
    
    res.json({
      success: true,
      data: news,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching financial news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial news',
      timestamp: new Date().toISOString()
    });
  }
});

// Get stock-specific news
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const news = await newsService.getStockNews(symbol, limit);
    
    res.json({
      success: true,
      data: news,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching news for ${req.params.symbol}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock news',
      timestamp: new Date().toISOString()
    });
  }
});

// Get economic calendar
router.get('/calendar/economic', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const calendar = await calendarService.getEconomicCalendar(days);
    
    res.json({
      success: true,
      data: calendar,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching economic calendar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch economic calendar',
      timestamp: new Date().toISOString()
    });
  }
});

// Get earnings calendar
router.get('/calendar/earnings', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const calendar = await calendarService.getEarningsCalendar(days);
    
    res.json({
      success: true,
      data: calendar,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings calendar',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
