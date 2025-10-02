import axios from 'axios';
import { StockData, MarketData, StockDataDocument, MarketDataDocument } from '../models/StockData';
import { createClient } from 'redis';

export class StockDataService {
  private redisClient: any;
  private readonly CACHE_TTL = parseInt(process.env.STOCK_DATA_CACHE_TTL || '300'); // 5 minutes default

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = createClient({ url: redisUrl });
      await this.redisClient.connect();
    } catch (error) {
      console.warn('Redis not available, using memory cache');
      this.redisClient = null;
    }
  }

  // Get real-time stock data
  async getStockData(symbol: string): Promise<StockDataDocument | null> {
    try {
      // Check cache first
      const cached = await this.getFromCache(`stock:${symbol}`);
      if (cached) {
        return cached;
      }

      // Fetch from external API (using Yahoo Finance API)
      const stockData = await this.fetchFromYahooFinance(symbol);
      
      if (stockData) {
        // Save to database
        await this.saveStockData(stockData);
        
        // Cache the result
        await this.setCache(`stock:${symbol}`, stockData, this.CACHE_TTL);
        
        return stockData;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      return null;
    }
  }

  // Get multiple stocks data
  async getMultipleStocksData(symbols: string[]): Promise<StockDataDocument[]> {
    const promises = symbols.map(symbol => this.getStockData(symbol));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<StockDataDocument> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  // Get historical market data
  async getMarketData(symbol: string, period: string = '1mo'): Promise<MarketDataDocument[]> {
    try {
      const cacheKey = `market:${symbol}:${period}`;
      
      // Check cache first
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from Yahoo Finance
      const marketData = await this.fetchHistoricalData(symbol, period);
      
      if (marketData.length > 0) {
        // Save to database
        await this.saveMarketData(marketData);
        
        // Cache the result
        await this.setCache(cacheKey, marketData, this.CACHE_TTL);
        
        return marketData;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      return [];
    }
  }

  // Search stocks
  async searchStocks(query: string, limit: number = 20): Promise<StockDataDocument[]> {
    try {
      // Try database first
      const dbResults = await StockData.searchStocks(query, limit);
      
      if (dbResults.length > 0) {
        return dbResults;
      }

      // Fallback to external API
      const apiResults = await this.searchFromYahooFinance(query, limit);
      
      if (apiResults.length > 0) {
        // Save to database
        await this.saveMultipleStocksData(apiResults);
        return apiResults;
      }

      return [];
    } catch (error) {
      console.error(`Error searching stocks:`, error);
      return [];
    }
  }

  // Get top gainers
  async getTopGainers(limit: number = 10): Promise<StockDataDocument[]> {
    try {
      const cacheKey = `top_gainers:${limit}`;
      
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const gainers = await StockData.getTopGainers(limit);
      
      if (gainers.length > 0) {
        await this.setCache(cacheKey, gainers, 300); // 5 minutes cache
        return gainers;
      }

      return [];
    } catch (error) {
      console.error('Error fetching top gainers:', error);
      return [];
    }
  }

  // Get top losers
  async getTopLosers(limit: number = 10): Promise<StockDataDocument[]> {
    try {
      const cacheKey = `top_losers:${limit}`;
      
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const losers = await StockData.getTopLosers(limit);
      
      if (losers.length > 0) {
        await this.setCache(cacheKey, losers, 300);
        return losers;
      }

      return [];
    } catch (error) {
      console.error('Error fetching top losers:', error);
      return [];
    }
  }

  // Get most active stocks
  async getMostActive(limit: number = 10): Promise<StockDataDocument[]> {
    try {
      const cacheKey = `most_active:${limit}`;
      
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const active = await StockData.getMostActive(limit);
      
      if (active.length > 0) {
        await this.setCache(cacheKey, active, 300);
        return active;
      }

      return [];
    } catch (error) {
      console.error('Error fetching most active stocks:', error);
      return [];
    }
  }

  // Private methods for external API calls
  private async fetchFromYahooFinance(symbol: string): Promise<StockDataDocument | null> {
    try {
      // Using yahoo-finance2 package for reliable data
      const yahooFinance = require('yahoo-finance2').default;
      
      const quote = await yahooFinance.quote(symbol);
      
      if (!quote) return null;

      const stockData = {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap || 0,
        pe: quote.trailingPE || 0,
        eps: quote.trailingEPS || 0,
        dividend: quote.dividendRate || 0,
        high52Week: quote.fiftyTwoWeekHigh || 0,
        low52Week: quote.fiftyTwoWeekLow || 0,
        lastUpdated: new Date()
      };

      return new StockData(stockData);
    } catch (error) {
      console.error(`Yahoo Finance API error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchHistoricalData(symbol: string, period: string): Promise<MarketDataDocument[]> {
    try {
      const yahooFinance = require('yahoo-finance2').default;
      
      const historical = await yahooFinance.historical(symbol, {
        period1: this.getPeriodStart(period),
        period2: new Date(),
        interval: '1d'
      });

      if (!historical || historical.length === 0) return [];

      return historical.map((item: any) => new MarketData({
        symbol: symbol.toUpperCase(),
        timestamp: new Date(item.date),
        open: item.open || 0,
        high: item.high || 0,
        low: item.low || 0,
        close: item.close || 0,
        volume: item.volume || 0
      }));
    } catch (error) {
      console.error(`Yahoo Finance historical data error for ${symbol}:`, error);
      return [];
    }
  }

  private async searchFromYahooFinance(query: string, limit: number): Promise<StockDataDocument[]> {
    try {
      const yahooFinance = require('yahoo-finance2').default;
      
      const searchResults = await yahooFinance.search(query);
      
      if (!searchResults || !searchResults.quotes) return [];

      const symbols = searchResults.quotes
        .slice(0, limit)
        .map((quote: any) => quote.symbol)
        .filter((symbol: string) => symbol && !symbol.includes('.'));

      // Fetch detailed data for found symbols
      const stocksData = await this.getMultipleStocksData(symbols);
      return stocksData;
    } catch (error) {
      console.error('Yahoo Finance search error:', error);
      return [];
    }
  }

  // Database operations
  private async saveStockData(stockData: StockDataDocument): Promise<void> {
    try {
      const updateData = stockData.toObject();
      delete updateData._id; // Remove _id to avoid immutable field error
      
      await StockData.findOneAndUpdate(
        { symbol: stockData.symbol },
        updateData,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving stock data:', error);
    }
  }

  private async saveMultipleStocksData(stocksData: StockDataDocument[]): Promise<void> {
    try {
      const bulkOps = stocksData.map(stock => {
        const updateData = stock.toObject();
        delete updateData._id; // Remove _id to avoid immutable field error
        
        return {
          updateOne: {
            filter: { symbol: stock.symbol },
            update: updateData,
            upsert: true
          }
        };
      });

      await StockData.bulkWrite(bulkOps);
    } catch (error) {
      console.error('Error saving multiple stocks data:', error);
    }
  }

  private async saveMarketData(marketData: MarketDataDocument[]): Promise<void> {
    try {
      const bulkOps = marketData.map(data => {
        const updateData = data.toObject();
        delete updateData._id; // Remove _id to avoid immutable field error
        
        return {
          updateOne: {
            filter: { symbol: data.symbol, timestamp: data.timestamp },
            update: updateData,
            upsert: true
          }
        };
      });

      await MarketData.bulkWrite(bulkOps);
    } catch (error) {
      console.error('Error saving market data:', error);
    }
  }

  // Cache operations
  private async getFromCache(key: string): Promise<any> {
    if (!this.redisClient) return null;
    
    try {
      const cached = await this.redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  private async setCache(key: string, data: any, ttl: number): Promise<void> {
    if (!this.redisClient) return;
    
    try {
      await this.redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Utility methods
  private getPeriodStart(period: string): Date {
    const now = new Date();
    const periods: { [key: string]: number } = {
      '1d': 1,
      '5d': 5,
      '1mo': 30,
      '3mo': 90,
      '6mo': 180,
      '1y': 365,
      '2y': 730,
      '5y': 1825,
      '10y': 3650,
      'ytd': now.getDate() + (now.getMonth() * 30),
      'max': 3650
    };

    const days = periods[period] || 30;
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

export const stockDataService = new StockDataService();
