import { Request, Response } from 'express';
import { User } from '../models/User';
import { stockDataService } from '../services/StockDataService';
import { ApiResponse } from '../types';

export class WatchlistController {
  // Get user's watchlist
  getWatchlist = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findById((req as any).user._id).select('watchlist');

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Get detailed stock data for each symbol in watchlist
      if (user.watchlist.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            symbols: [],
            stocks: []
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const symbols = user.watchlist.map(item => item.symbol);
      const stocksData = await stockDataService.getMultipleStocksData(symbols);

      res.status(200).json({
        success: true,
        data: {
          symbols: user.watchlist,
          stocks: stocksData
        },
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Get watchlist error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch watchlist',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Add stock to watchlist
  addToWatchlist = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.params;
      const { notes } = req.body;

      if (!symbol) {
        res.status(400).json({
          success: false,
          error: 'Symbol parameter is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Validate symbol format
      if (!/^[A-Z0-9.-]+$/.test(symbol.toUpperCase())) {
        res.status(400).json({
          success: false,
          error: 'Invalid symbol format',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const user = await User.findById((req as any).user._id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Check if stock already in watchlist
      const existingStock = user.watchlist.find(
        item => item.symbol === symbol.toUpperCase()
      );

      if (existingStock) {
        res.status(400).json({
          success: false,
          error: `${symbol} is already in your watchlist`,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Verify stock exists by fetching data
      const stockData = await stockDataService.getStockData(symbol.toUpperCase());
      if (!stockData) {
        res.status(404).json({
          success: false,
          error: `Stock ${symbol} not found`,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Add to watchlist
      user.watchlist.push({
        symbol: symbol.toUpperCase(),
        addedAt: new Date(),
        notes: notes || ''
      });

      await user.save();

      res.status(200).json({
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          addedAt: new Date(),
          notes: notes || ''
        },
        message: `${symbol} added to watchlist`,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Add to watchlist error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add stock to watchlist',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Remove stock from watchlist
  removeFromWatchlist = async (req: Request, res: Response): Promise<void> => {
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

      const user = await User.findById((req as any).user._id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const initialLength = user.watchlist.length;
      user.watchlist = user.watchlist.filter(
        item => item.symbol !== symbol.toUpperCase()
      );

      if (user.watchlist.length === initialLength) {
        res.status(404).json({
          success: false,
          error: `${symbol} not found in watchlist`,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      await user.save();

      res.status(200).json({
        success: true,
        data: { symbol: symbol.toUpperCase() },
        message: `${symbol} removed from watchlist`,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Remove from watchlist error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to remove stock from watchlist',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Clear entire watchlist
  clearWatchlist = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const removedCount = user.watchlist.length;
      user.watchlist = [];

      await user.save();

      res.status(200).json({
        success: true,
        data: { removedCount },
        message: `Cleared ${removedCount} stocks from watchlist`,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Clear watchlist error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to clear watchlist',
        timestamp: new Date()
      } as ApiResponse);
    }
  };

  // Remove multiple stocks from watchlist
  removeMultipleFromWatchlist = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const symbolsToRemove = symbols.map((s: string) => s.toUpperCase());
      const initialLength = user.watchlist.length;

      user.watchlist = user.watchlist.filter(
        item => !symbolsToRemove.includes(item.symbol)
      );

      const removedCount = initialLength - user.watchlist.length;

      if (removedCount === 0) {
        res.status(404).json({
          success: false,
          error: 'No matching symbols found in watchlist',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      await user.save();

      res.status(200).json({
        success: true,
        data: {
          removedSymbols: symbolsToRemove,
          removedCount
        },
        message: `Removed ${removedCount} stocks from watchlist`,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error: any) {
      console.error('Remove multiple from watchlist error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to remove stocks from watchlist',
        timestamp: new Date()
      } as ApiResponse);
    }
  };
}

export const watchlistController = new WatchlistController();
