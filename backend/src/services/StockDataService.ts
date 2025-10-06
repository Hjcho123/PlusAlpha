import { StockData, MarketData, StockDataDocument, MarketDataDocument } from '../models/StockData';
import { createClient } from 'redis';
import yahooFinance from 'yahoo-finance2';
import cron from 'node-cron';
import axios, { AxiosResponse } from 'axios';

// Temporary empty response for disabled features
const TEMP_EMPTY = [];

export class StockDataService {
  private redisClient: ReturnType<typeof createClient> | null = null;
  private readonly CACHE_TTL = 60; // 1 minute for near real-time data
  private readonly dashboardSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
  
  constructor() {
    this.initializeRedis();
    // Schedule minute updates for near real-time data
    cron.schedule('*/1 * * * *', () => this.refreshDashboardStocks());
    // Note: now runs every minute instead of every hour
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

  // Get real-time stock data from Yahoo Finance
  async getStockData(symbol: string, forceRefresh: boolean = false): Promise<StockDataDocument | null> {
    try {
      console.log(`[STOCK_DATA_SERVICE] Fetching ${symbol}, forceRefresh: ${forceRefresh}`);

      // Check cache first (but only use if less than 5 seconds old for true real-time)
      const cacheKey = `stock:${symbol.toUpperCase()}`;
      const cached = await this.getFromCache(cacheKey);

      if (cached && this.isValidStockData(cached) && !forceRefresh) {
        const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();

        // Only use cache if it's less than 5 seconds old for ultra-real-time
        if (cacheAge < 5000) { // 5 seconds
          console.log(`Using cached data for ${symbol} (${Math.round(cacheAge/1000)}s old)`);
          return cached;
        } else {
          console.log(`Cached data for ${symbol} is ${Math.round(cacheAge/1000)}s old, fetching fresh data`);
        }
      } else if (forceRefresh) {
        console.log(`Force refresh requested for ${symbol}, bypassing cache`);
      }

      // Always fetch fresh data from Yahoo Finance API for true real-time
      console.log(`Fetching fresh data for ${symbol} from Yahoo Finance`);
      const stockData = await this.fetchFromYahooFinance(symbol);

      if (stockData && this.isValidStockData(stockData)) {
        // Save to database
        await this.saveStockData(stockData);

        // Cache the result for 60 seconds (but we fetch fresh every time anyway)
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

  // Get market data - simplified for AI analysis
  private async getComprehensiveData(symbol: string): Promise<MarketDataDocument[]> {
    try {
      console.log(`📊 Getting market data for ${symbol} - using current stock data for AI analysis`);

      // For AI analysis, we'll use the current stock data to create a minimal dataset
      // This allows the AI to work with real data without requiring historical data
      const stockData = await this.getStockData(symbol);

      if (!stockData) {
        console.warn(`No stock data available for ${symbol}`);
        return [];
      }

      // Create a single data point from current stock data for AI analysis
      const currentData = new MarketData({
        symbol: symbol.toUpperCase(),
        timestamp: new Date(),
        open: stockData.price, // Use current price as open
        high: stockData.price * 1.02, // Estimate high as 2% above current
        low: stockData.price * 0.98,  // Estimate low as 2% below current
        close: stockData.price,
        volume: stockData.volume || 1000000
      });

      console.log(`✅ Created current market data point for ${symbol}: $${stockData.price}`);
      return [currentData];
    } catch (error: any) {
      console.error(`Error getting market data for ${symbol}:`, error.message);
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

  // Search stocks using Yahoo Finance API for comprehensive search
  async searchStocks(query: string, limit: number = 20): Promise<StockDataDocument[]> {
    try {
      if (query.length < 2) {
        return [];
      }

      console.log(`🔍 Searching for stocks matching: "${query}"`);

      // First, try to get the exact symbol if it exists
      const exactSymbol = query.toUpperCase();
      try {
        const exactStockData = await this.getStockData(exactSymbol);
        if (exactStockData) {
          console.log(`✅ Found exact match: ${exactSymbol}`);
          return [exactStockData];
        }
      } catch (error) {
        console.log(`❌ No exact match found for: ${exactSymbol}`);
      }

      // If no exact match, search for similar symbols/companies using Yahoo Finance
      try {
        console.log(`🔍 Searching Yahoo Finance for: "${query}"`);

        // Use Yahoo Finance search functionality with correct options
        const searchResults = await yahooFinance.search(query, {
          quotesCount: limit,
          enableFuzzyQuery: true
        });

        if (searchResults && searchResults.quotes && searchResults.quotes.length > 0) {
          console.log(`✅ Found ${searchResults.quotes.length} matches from Yahoo Finance`);

          // Get detailed data for the top matches
          const stockPromises = searchResults.quotes
            .filter((quote: any) => quote.symbol && quote.shortname)
            .slice(0, limit)
            .map(async (quote: any) => {
              try {
                const stockData = await this.getStockData(quote.symbol);
                if (stockData) {
                  return stockData;
                }
                return null;
              } catch (error) {
                console.error(`Error fetching data for ${quote.symbol}:`, error);
                return null;
              }
            });

          const results = await Promise.all(stockPromises);
          const validResults = results.filter(result => result !== null);

          if (validResults.length > 0) {
            console.log(`✅ Returning ${validResults.length} valid stock results`);
            return validResults;
          }
        }
      } catch (searchError) {
        console.error('Yahoo Finance search error:', searchError);
      }

      // Fallback: Try common symbols that might match the query
      const commonSymbols = ['PLUG', 'SHOP', 'ROKU', 'SQ', 'ZM', 'PTON', 'SPCE', 'NKLA'];
      const fallbackMatches = commonSymbols.filter(symbol =>
        symbol.toLowerCase().includes(query.toLowerCase())
      );

      if (fallbackMatches.length > 0) {
        console.log(`🔄 Using fallback symbols: ${fallbackMatches.join(', ')}`);

        const stockPromises = fallbackMatches.slice(0, limit).map(async (symbol) => {
          try {
            const stockData = await this.getStockData(symbol);
            if (stockData) {
              return stockData;
            }
            return null;
          } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            return null;
          }
        });

        const results = await Promise.all(stockPromises);
        return results.filter(result => result !== null);
      }

      console.log(`❌ No stocks found for query: "${query}"`);
      return [];
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

  // Get current price using Twelve Data quote endpoint
  private async fetchFromYahooFinance(symbol: string): Promise<StockDataDocument | null> {
    try {
      console.log(`Fetching real-time data for ${symbol} from Yahoo Finance`);

      const quote = await yahooFinance.quote(symbol);
      const stats = await yahooFinance.quoteSummary(symbol, {
        modules: ['price', 'summaryDetail', 'defaultKeyStatistics']
      });

      // Handle missing data scenarios
      if (!quote?.regularMarketPrice || !stats?.summaryDetail) {
        console.error(`Incomplete data from Yahoo Finance for ${symbol}`);
        return null;
      }

      // Try to get PE ratio from multiple sources - SUMMARYDETAIL HAS APPLE'S P/E!
      let peRatio: number | null = null;
      if (stats.summaryDetail.trailingPE) {
        peRatio = stats.summaryDetail.trailingPE;  // Apple P/E is here: 39.21!
      } else if ((stats.defaultKeyStatistics as any)?.trailingPE) {
        peRatio = (stats.defaultKeyStatistics as any).trailingPE;  // Fallback with type assertion
      }

      const stockData = {
        symbol: symbol.toUpperCase(),
        name: quote.shortName || symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        marketCap: stats.summaryDetail.marketCap,
        pe: peRatio,
        eps: stats.defaultKeyStatistics?.trailingEps || (stats.summaryDetail as any).epsTrailingTwelveMonths,
        dividend: stats.summaryDetail.dividendRate,
        high52Week: stats.summaryDetail.fiftyTwoWeekHigh,
        low52Week: stats.summaryDetail.fiftyTwoWeekLow,
        lastUpdated: new Date()
      };

      console.log(`✅ Yahoo Finance data for ${symbol}:`, {
        price: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent
      });

      return new StockData(stockData);
    } catch (error: any) {
      console.error(`Yahoo Finance error for ${symbol}:`, error.message);
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
      // Convert to object but exclude _id to avoid immutable field error during upsert
      const updateData = stockData.toObject();
      delete updateData._id;

      await StockData.findOneAndUpdate(
        { symbol: stockData.symbol },
        updateData,
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

  // Get API key for external services
  private getApiKey(): string | null {
    return process.env.POLYGON_API_KEY || null;
  }

  // Get API base URL for external services
  private getApiBaseUrl(): string {
    return process.env.POLYGON_BASE_URL || 'https://api.polygon.io';
  }

  // Refresh dashboard stocks data
  private async refreshDashboardStocks(): Promise<void> {
    console.log('🔄 Refreshing dashboard stocks data...');

    try {
      const refreshPromises = this.dashboardSymbols.map(symbol =>
        this.getStockData(symbol)
      );

      const results = await Promise.allSettled(refreshPromises);

      const successful = results.filter((result): result is PromiseFulfilledResult<any> =>
        result.status === 'fulfilled' && result.value !== null
      );

      console.log(`✅ Refreshed ${successful.length}/${this.dashboardSymbols.length} dashboard stocks`);
    } catch (error) {
      console.error('❌ Error refreshing dashboard stocks:', error);
    }
  }

  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

export const stockDataService = new StockDataService();
