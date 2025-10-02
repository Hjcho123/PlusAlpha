import { StockData, MarketData, StockDataDocument, MarketDataDocument } from '../models/StockData';
import { createClient } from 'redis';
import axios, { AxiosResponse } from 'axios';

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

  // Helper to get API key and base URL
  private getApiKey(): string | null {
    return process.env.POLYGON_API_KEY || null;
  }

  private getApiBaseUrl(): string {
    return 'https://api.polygon.io';
  }

  // Get real-time stock data from Polygon
  async getStockData(symbol: string): Promise<StockDataDocument | null> {
    try {
      // Check cache first
      const cacheKey = `stock:${symbol.toUpperCase()}`;
      const cached = await this.getFromCache(cacheKey);
      if (cached && this.isValidStockData(cached)) {
        console.log(`Using cached data for ${symbol}`);
        return cached;
      }

      // Fetch from Polygon API
      const stockData = await this.fetchFromPolygon(symbol);

      if (stockData && this.isValidStockData(stockData)) {
        // Save to database
        await this.saveStockData(stockData);

        // Cache the result
        await this.setCache(cacheKey, stockData, this.CACHE_TTL);

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
      // First, get the comprehensive dataset (2 years of data)
      const fullData = await this.getComprehensiveData(symbol);

      if (fullData.length === 0) {
        console.warn(`No comprehensive data available for ${symbol}`);
        return [];
      }

      // Slice the data based on requested period
      return this.sliceDataByPeriod(fullData, period);

    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      return [];
    }
  }

  // Get comprehensive 2-year dataset once and cache it aggressively using direct HTTP calls
  private async getComprehensiveData(symbol: string): Promise<MarketDataDocument[]> {
    try {
      const cacheKey = `full_data:${symbol}`;
      const maxCacheAge = 4 * 60 * 60; // 4 hours

      // Check for full dataset first
      const cached = await this.getFromCache(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 500) { // Must have substantial data
        console.log(`Using cached full dataset for ${symbol} (${cached.length} bars)`);
        return cached;
      }

      console.log(`Fetching comprehensive 2-year dataset for ${symbol}`);

      const apiKey = this.getApiKey();
      const baseUrl = this.getApiBaseUrl();

      if (!apiKey) {
        console.error('Polygon API key not found');
        return [];
      }

      // Fetch 2 years of data in one request
      const startDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000); // 2 years ago
      const endDate = new Date();

      const url = `${baseUrl}/v2/aggs/ticker/${symbol}/range/1/day/${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}?adjusted=true&sort=asc&limit=50000&apiKey=${apiKey}`;

      console.log(`Request URL: ${url.replace(apiKey, '***API_KEY***')}`);

      const response: AxiosResponse = await axios.get(url);

      if (!response.data || response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
        console.warn(`No data returned from Polygon HTTP API for ${symbol}`);
        return [];
      }

      // Process and validate data
      const marketData = response.data.results
        .filter((bar: any) => bar && bar.t && bar.c && bar.c > 0 && bar.o && bar.h && bar.l && bar.v)
        .sort((a: any, b: any) => a.t - b.t) // Sort ascending by timestamp
        .map((bar: any) => {
          const barData = new MarketData({
            symbol: symbol.toUpperCase(),
            timestamp: new Date(bar.t),
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
            volume: bar.v
          });

          // Add volume-weighted average price if available
          if (bar.vw) {
            (barData as any).vwap = bar.vw;
          }

          return barData;
        });

      console.log(`✅ Fetched comprehensive dataset for ${symbol}: ${marketData.length} bars`);

      // Save to database
      await this.saveMarketData(marketData);

      // Cache aggressively - this dataset is expensive to get
      await this.setCache(cacheKey, marketData, maxCacheAge);

      return marketData;

    } catch (error: any) {
      console.error(`Error fetching comprehensive data for ${symbol}:`, error.response?.data || error.message);

      // Try fallback - get from database
      try {
        const dbData = await MarketData.find({ symbol: symbol.toUpperCase() })
          .sort({ timestamp: 1 });

        if (dbData.length > 0) {
          console.log(`Using database fallback data for ${symbol}: ${dbData.length} bars`);
          return dbData;
        }
      } catch (dbError) {
        console.error('Database fallback also failed:', dbError);
      }

      return [];
    }
  }

  // Slice comprehensive data based on period
  private sliceDataByPeriod(fullData: MarketDataDocument[], period: string): MarketDataDocument[] {
    const now = new Date();
    let daysBack = 30; // Default

    const periodConfig = {
      '1d': 1,
      '5d': 5,
      '1w': 7,
      '1mo': 30,
      '3mo': 90,
      '6mo': 180,
      '1y': 365,
      '2y': 730,
      '5y': 1825,
      'max': 1825
    };

    daysBack = periodConfig[period as keyof typeof periodConfig] || 30;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Filter data to requested period and return most recent data points
    const slicedData = fullData
      .filter(data => data.timestamp >= cutoffDate)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Ascending

    console.log(`📅 Sliced ${fullData.length} bars to ${period} (${daysBack} days): ${slicedData.length} bars`);

    return slicedData;
  }

  // Search stocks using common stock list (Polygon doesn't have search in free tier)
  async searchStocks(query: string, limit: number = 20): Promise<StockDataDocument[]> {
    try {
      // Predefined list of major stocks since Polygon search is limited
      const commonStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'TSLA', name: 'Tesla Inc.' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.' },
        { symbol: 'META', name: 'Meta Platforms Inc.' },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
        { symbol: 'JNJ', name: 'Johnson & Johnson' },
        { symbol: 'XOM', name: 'ExxonMobil Corporation' },
        { symbol: 'BAC', name: 'Bank of America Corp.' },
        { symbol: 'WFC', name: 'Wells Fargo & Co.' },
        { symbol: 'UNH', name: 'UnitedHealth Group Inc.' },
        { symbol: 'HD', name: 'Home Depot Inc.' },
        { symbol: 'PG', name: 'Procter & Gamble Co.' },
        { symbol: 'NFLX', name: 'Netflix Inc.' },
        { symbol: 'CRM', name: 'Salesforce Inc.' }
      ];

      // Filter stocks by query
      const filteredStocks = commonStocks.filter(stock =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      );

      // Get current prices for found stocks
      const stockPromises = filteredStocks.slice(0, limit).map(async (stock) => {
        try {
          const stockData = await this.getStockData(stock.symbol);
          if (stockData) {
            return stockData;
          }
          return null;
        } catch (error) {
          console.error(`Error fetching data for ${stock.symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(stockPromises);
      return results.filter(result => result !== null);
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }

  // Get top gainers (would use database query in production)
  async getTopGainers(limit: number = 10): Promise<StockDataDocument[]> {
    try {
      const dbResults = await StockData.find()
        .sort({ changePercent: -1 })
        .limit(limit);
      return dbResults;
    } catch (error) {
      console.error('Error fetching top gainers:', error);
      return [];
    }
  }

  // Get top losers (would use database query in production)
  async getTopLosers(limit: number = 10): Promise<StockDataDocument[]> {
    try {
      const dbResults = await StockData.find()
        .sort({ changePercent: 1 })
        .limit(limit);
      return dbResults;
    } catch (error) {
      console.error('Error fetching top losers:', error);
      return [];
    }
  }

  // Get most active stocks (would use database query in production)
  async getMostActive(limit: number = 10): Promise<StockDataDocument[]> {
    try {
      const dbResults = await StockData.find()
        .sort({ volume: -1 })
        .limit(limit);
      return dbResults;
    } catch (error) {
      console.error('Error fetching most active stocks:', error);
      return [];
    }
  }

  // Get current price using Polygon aggregates (last trading day)
  private async fetchFromPolygon(symbol: string): Promise<StockDataDocument | null> {
    try {
      const apiKey = this.getApiKey();
      const baseUrl = this.getApiBaseUrl();

      if (!apiKey) {
        console.error('Polygon API key not found');
        return null;
      }

      console.log(`Fetching current price for ${symbol} from Polygon API`);

      // Get yesterday to today for current price and change calculation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const today = new Date();

      const url = `${baseUrl}/v2/aggs/ticker/${symbol}/range/1/day/${yesterday.toISOString().split('T')[0]}/${today.toISOString().split('T')[0]}?adjusted=true&sort=desc&limit=2&apiKey=${apiKey}`;

      console.log(`Request URL: ${url.replace(apiKey, '***API_KEY***')}`);

      const response: AxiosResponse = await axios.get(url);

      if (!response.data || response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
        console.warn(`No price data for ${symbol}`);
        return null;
      }

      const bars = response.data.results;
      let currentPrice = bars[0].c; // Most recent close
      let previousPrice = bars.length > 1 ? bars[1].c : currentPrice;

      // If we don't have today, use the most recent bar as current price
      // and previous bar (yesterday) for comparison
      if (bars[0].t < Date.now() - 24 * 60 * 60 * 1000 * 1000) { // 24 hours ago in ms
        previousPrice = bars[0].c;
        currentPrice = bars[0].c; // No real-time update available
      }

      const change = currentPrice - previousPrice;
      const changePercent = (change / previousPrice) * 100;

      console.log(`📊 ${symbol} Price Data:`, {
        currentPrice: currentPrice.toFixed(2),
        previousPrice: previousPrice.toFixed(2),
        change: change.toFixed(2),
        changePercent: changePercent.toFixed(2),
        volume: bars[0].v,
        timestamp: new Date(bars[0].t).toISOString()
      });

      const stockData = {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(), // Polygon doesn't provide company names
        price: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        volume: bars[0].v || 0,
        marketCap: 0, // Not available in free tier
        pe: 0, // Not available in free tier
        eps: 0, // Not available in free tier
        dividend: 0, // Not available in free tier
        high52Week: 0, // Not available in free tier
        low52Week: 0, // Not available in free tier
        lastUpdated: new Date()
      };

      return new StockData(stockData);
    } catch (error: any) {
      console.error(`Polygon API HTTP error for ${symbol}:`, error.response?.data || error.message);
      return null;
    }
  }

  // Fetch historical market data using direct HTTP calls
  private async fetchHistoricalData(symbol: string, period: string): Promise<MarketDataDocument[]> {
    try {
      const apiKey = this.getApiKey();
      const baseUrl = this.getApiBaseUrl();

      if (!apiKey) {
        console.error('Polygon API key not found for historical data');
        return [];
      }

      const periodMap: { [key: string]: number } = {
        '1d': 1,
        '5d': 5,
        '1w': 7,
        '1mo': 30,
        '3mo': 90,
        '6mo': 180,
        '1y': 252,
        '2y': 730,
        '5y': 1825,
        'max': 1825
      };

      const days = periodMap[period] || 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      console.log(`🔍 Fetching historical data for ${symbol}, ${period} (${days} days)`);
      console.log(`📅 Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

      const url = `${baseUrl}/v2/aggs/ticker/${symbol}/range/1/day/${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}?adjusted=true&sort=asc&limit=50000&apiKey=${apiKey}`;

      console.log(`Request URL: ${url.replace(apiKey, '***API_KEY***')}`);

      const response: AxiosResponse = await axios.get(url);

      console.log(`📊 Polygon HTTP response for ${symbol}:`, {
        status: response.status,
        hasData: !!response.data,
        statusCode: response.data?.status,
        hasResults: !!response.data?.results,
        resultCount: response.data?.results?.length || 0,
        firstResult: response.data?.results?.[0],
        lastResult: response.data?.results?.[response.data.results.length - 1]
      });

      if (!response.data || response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
        console.warn(`⚠️ No historical data returned from Polygon HTTP API for ${symbol} in period ${period}`);
        return [];
      }

      // Validate and clean the data
      const validBars = response.data.results
        .filter((bar: any) => bar && bar.t && bar.c && bar.c > 0 && bar.o && bar.h && bar.l && bar.v)
        .sort((a: any, b: any) => a.t - b.t); // Sort by timestamp ascending

      console.log(`✅ Processing ${validBars.length} valid historical bars for ${symbol}`);

      const marketData = validBars.map((bar: any) => {
        const barData = new MarketData({
          symbol: symbol.toUpperCase(),
          timestamp: new Date(bar.t), // bar.t is timestamp in milliseconds
          open: bar.o,
          high: bar.h,
          low: bar.l,
          close: bar.c,
          volume: bar.v
        });

        console.log(`📈 Historical bar: ${barData.timestamp.toISOString().split('T')[0]} - C:$${barData.close} V:${barData.volume}`);

        return barData;
      });

      console.log(`🎯 Returning ${marketData.length} historical bars for ${symbol}`);
      return marketData;

    } catch (error: any) {
      console.error(`❌ Polygon historical data HTTP error for ${symbol}:`, error.response?.data || error.message);

      // Try a simpler approach - fetch 1 week of data as fallback
      try {
        console.log(`🔄 Trying simplified fetch for ${symbol} (last 7 days)`);

        const apiKey = this.getApiKey();
        const baseUrl = this.getApiBaseUrl();

        if (!apiKey) return [];

        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const endDate = new Date();

        const url = `${baseUrl}/v2/aggs/ticker/${symbol}/range/1/day/${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}?adjusted=true&sort=asc&limit=10&apiKey=${apiKey}`;

        const response: AxiosResponse = await axios.get(url);

        if (response.data && response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
          console.log(`✅ Simplified fetch successful - got ${response.data.results.length} bars for ${symbol}`);

          return response.data.results
            .filter((bar: any) => bar && bar.t && bar.c && bar.c > 0 && bar.o && bar.h && bar.l && bar.v)
            .sort((a: any, b: any) => a.t - b.t)
            .map((bar: any) => new MarketData({
              symbol: symbol.toUpperCase(),
              timestamp: new Date(bar.t),
              open: bar.o,
              high: bar.h,
              low: bar.l,
              close: bar.c,
              volume: bar.v
            }));
        }
      } catch (fallbackError: any) {
        console.error(`❌ Fallback fetch also failed for ${symbol}:`, fallbackError.response?.data || fallbackError.message);
      }

      console.error(`💥 All attempts to fetch historical data for ${symbol} failed`);
      return [];
    }
  }

  // Data validation
  private isValidStockData(data: any): boolean {
    if (!data) return false;

    if (!data.symbol || typeof data.symbol !== 'string') return false;
    if (typeof data.price !== 'number' || data.price < 0 || data.price > 1000000) return false;
    if (!/^[A-Z0-9.-]+$/.test(data.symbol)) return false;

    return true;
  }

  // Cache operations
  private async getFromCache(key: string): Promise<any> {
    if (!this.redisClient) return null;

    try {
      const cached = await this.redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
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

  // Database operations
  private async saveStockData(stockData: StockDataDocument): Promise<void> {
    try {
      await StockData.findOneAndUpdate(
        { symbol: stockData.symbol },
        stockData.toObject(),
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving stock data:', error);
    }
  }

  private async saveMarketData(marketData: MarketDataDocument[]): Promise<void> {
    try {
      const bulkOps = marketData.map(data => ({
        updateOne: {
          filter: { symbol: data.symbol, timestamp: data.timestamp },
          update: data.toObject(),
          upsert: true
        }
      }));

      await MarketData.bulkWrite(bulkOps);
    } catch (error) {
      console.error('Error saving market data:', error);
    }
  }

  // Utility method
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
      'max': 3650
    };

    const days = periods[period] || 30;
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  }

  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

export const stockDataService = new StockDataService();
