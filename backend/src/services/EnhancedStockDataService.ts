import axios from 'axios';
import yahooFinance from 'yahoo-finance2';
import { StockData, MarketData, StockDataDocument, MarketDataDocument } from '../models/StockData';
import { stockDataService } from './StockDataService';
import { ComprehensiveFinancialData } from '../types';

export class EnhancedStockDataService {
  private readonly ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
  private readonly FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

  constructor() {
    console.log(`🔍 Enhanced Stock Data Service initialized`);
    console.log(`📊 Alpha Vantage: ${process.env.ALPHA_VANTAGE_API_KEY ? '✅ Available' : '❌ Not configured'}`);
    console.log(`📰 Finnhub: ${process.env.FINNHUB_API_KEY ? '✅ Available' : '❌ Not configured'}`);
  }

  // Get comprehensive financial data from Yahoo Finance (same as StockController.getFundamentals but returns data instead of void)
  async getComprehensiveYahooFinanceData(symbol: string): Promise<ComprehensiveFinancialData | null> {
    try {
      console.log(`📊 Fetching comprehensive Yahoo Finance data for ${symbol}`);

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
      const comprehensiveData: ComprehensiveFinancialData = {
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

      console.log(`✅ Successfully extracted comprehensive Yahoo Finance data:`, {
        hasValuation: !!(comprehensiveData.pe || comprehensiveData.pegRatio),
        hasFinancialHealth: !!(comprehensiveData.roa || comprehensiveData.roe),
        hasAnalystRatings: !!comprehensiveData.analystRatings,
        hasCompanyProfile: !!(comprehensiveData.sector || comprehensiveData.ceo),
        totalAnalysts: comprehensiveData.analystRatings?.total || 0
      });

      return comprehensiveData;
    } catch (error) {
      console.warn(`⚠️ Could not fetch comprehensive Yahoo Finance data for ${symbol}:`, error);
      return null;
    }
  }

  // Get enhanced stock data with Alpha Vantage
  async getEnhancedStockData(symbol: string): Promise<any> {
    try {
      // Get basic data from Yahoo Finance first
      const basicData = await stockDataService.getStockData(symbol);
      
      if (!basicData) {
        throw new Error(`No basic data available for ${symbol}`);
      }

      const enhancedData = {
        ...basicData.toObject(),
        enhancedMetrics: {},
        technicalIndicators: {},
        fundamentalData: {},
        newsSentiment: {}
      };

      // Get enhanced data from Alpha Vantage if available
      if (process.env.ALPHA_VANTAGE_API_KEY) {
        try {
          const [technicalData, fundamentalData] = await Promise.all([
            this.getAlphaVantageTechnicalData(symbol),
            this.getAlphaVantageFundamentalData(symbol)
          ]);

          enhancedData.technicalIndicators = technicalData;
          enhancedData.fundamentalData = fundamentalData;
        } catch (error) {
          console.warn(`Alpha Vantage data failed for ${symbol}:`, error);
        }
      }

      // Get news sentiment from Finnhub if available
      if (process.env.FINNHUB_API_KEY) {
        try {
          const newsData = await this.getFinnhubNewsSentiment(symbol);
          enhancedData.newsSentiment = newsData;
        } catch (error) {
          console.warn(`Finnhub news data failed for ${symbol}:`, error);
        }
      }

      return enhancedData;
    } catch (error) {
      console.error(`Enhanced stock data error for ${symbol}:`, error);
      return null;
    }
  }

  // Get Alpha Vantage technical indicators
  private async getAlphaVantageTechnicalData(symbol: string): Promise<any> {
    const technicalIndicators: any = {};

    try {
      // Get market data for price calculations
      const marketData = await stockDataService.getMarketData(symbol, '3mo');
      const currentPrice = marketData.length > 0 ? marketData[marketData.length - 1].close : null;
      // Get RSI
      const rsiData = await this.fetchAlphaVantageData('RSI', symbol, 'daily', '14');
      if (rsiData && rsiData['Technical Analysis: RSI']) {
        const latestRSI = Object.values(rsiData['Technical Analysis: RSI'])[0] as any;
        technicalIndicators.rsi = {
          value: parseFloat(latestRSI['RSI']),
          signal: this.getRSISignal(parseFloat(latestRSI['RSI']))
        };
      }

      // Get MACD
      const macdData = await this.fetchAlphaVantageData('MACD', symbol, 'daily');
      if (macdData && macdData['Technical Analysis: MACD']) {
        const latestMACD = Object.values(macdData['Technical Analysis: MACD'])[0] as any;
        technicalIndicators.macd = {
          macd: parseFloat(latestMACD['MACD']),
          signal: parseFloat(latestMACD['MACD_Signal']),
          histogram: parseFloat(latestMACD['MACD_Hist']),
          signal_direction: this.getMACDSignal(parseFloat(latestMACD['MACD']), parseFloat(latestMACD['MACD_Signal']))
        };
      }

      // Get Bollinger Bands
      const bbData = await this.fetchAlphaVantageData('BBANDS', symbol, 'daily', '20');
      if (bbData && bbData['Technical Analysis: BBANDS']) {
        const latestBB = Object.values(bbData['Technical Analysis: BBANDS'])[0] as any;
        technicalIndicators.bollingerBands = {
          upper: parseFloat(latestBB['Real Upper Band']),
          middle: parseFloat(latestBB['Real Middle Band']),
          lower: parseFloat(latestBB['Real Lower Band']),
          position: this.getBollingerPosition(currentPrice, parseFloat(latestBB['Real Upper Band']), parseFloat(latestBB['Real Middle Band']), parseFloat(latestBB['Real Lower Band']))
        };
      }

      // Get SMA
      const smaData = await this.fetchAlphaVantageData('SMA', symbol, 'daily', '20');
      if (smaData && smaData['Technical Analysis: SMA']) {
        const latestSMA = Object.values(smaData['Technical Analysis: SMA'])[0] as any;
        technicalIndicators.sma20 = parseFloat(latestSMA['SMA']);
      }

      // Get EMA
      const emaData = await this.fetchAlphaVantageData('EMA', symbol, 'daily', '20');
      if (emaData && emaData['Technical Analysis: EMA']) {
        const latestEMA = Object.values(emaData['Technical Analysis: EMA'])[0] as any;
        technicalIndicators.ema20 = parseFloat(latestEMA['EMA']);
      }

      return technicalIndicators;
    } catch (error) {
      console.error(`Alpha Vantage technical data error for ${symbol}:`, error);
      return {};
    }
  }

  // Get Alpha Vantage fundamental data
  private async getAlphaVantageFundamentalData(symbol: string): Promise<any> {
    try {
      const response = await axios.get(this.ALPHA_VANTAGE_BASE_URL, {
        params: {
          function: 'OVERVIEW',
          symbol: symbol,
          apikey: process.env.ALPHA_VANTAGE_API_KEY
        }
      });

      const data = response.data;
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      return {
        sector: data.Sector,
        industry: data.Industry,
        description: data.Description,
        marketCap: parseFloat(data.MarketCapitalization) || 0,
        peRatio: parseFloat(data.PERatio) || 0,
        pegRatio: parseFloat(data.PEGRatio) || 0,
        bookValue: parseFloat(data.BookValue) || 0,
        dividendPerShare: parseFloat(data.DividendPerShare) || 0,
        dividendYield: parseFloat(data.DividendYield) || 0,
        eps: parseFloat(data.EPS) || 0,
        revenuePerShare: parseFloat(data.RevenuePerShareTTM) || 0,
        profitMargin: parseFloat(data.ProfitMargin) || 0,
        operatingMargin: parseFloat(data.OperatingMarginTTM) || 0,
        returnOnAssets: parseFloat(data.ReturnOnAssetsTTM) || 0,
        returnOnEquity: parseFloat(data.ReturnOnEquityTTM) || 0,
        revenueTTM: parseFloat(data.RevenueTTM) || 0,
        grossProfitTTM: parseFloat(data.GrossProfitTTM) || 0,
        dilutedEPSTTM: parseFloat(data.DilutedEPSTTM) || 0,
        quarterlyEarningsGrowth: parseFloat(data.QuarterlyEarningsGrowthYOY) || 0,
        quarterlyRevenueGrowth: parseFloat(data.QuarterlyRevenueGrowthYOY) || 0,
        analystTargetPrice: parseFloat(data.AnalystTargetPrice) || 0,
        trailingPE: parseFloat(data.TrailingPE) || 0,
        forwardPE: parseFloat(data.ForwardPE) || 0,
        priceToSalesRatio: parseFloat(data.PriceToSalesRatioTTM) || 0,
        priceToBookRatio: parseFloat(data.PriceToBookRatio) || 0,
        evToRevenue: parseFloat(data.EVToRevenue) || 0,
        evToEBITDA: parseFloat(data.EVToEBITDA) || 0,
        beta: parseFloat(data.Beta) || 0,
        week52High: parseFloat(data['52WeekHigh']) || 0,
        week52Low: parseFloat(data['52WeekLow']) || 0,
        day50MovingAverage: parseFloat(data['50DayMovingAverage']) || 0,
        day200MovingAverage: parseFloat(data['200DayMovingAverage']) || 0,
        sharesOutstanding: parseFloat(data.SharesOutstanding) || 0,
        dividendDate: data.DividendDate,
        exDividendDate: data.ExDividendDate
      };
    } catch (error) {
      console.error(`Alpha Vantage fundamental data error for ${symbol}:`, error);
      return {};
    }
  }

  // Get Finnhub news sentiment
  private async getFinnhubNewsSentiment(symbol: string): Promise<any> {
    try {
      const response = await axios.get(`${this.FINNHUB_BASE_URL}/company-news`, {
        params: {
          symbol: symbol,
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
          to: new Date().toISOString().split('T')[0],
          token: process.env.FINNHUB_API_KEY
        }
      });

      const news = response.data.slice(0, 10); // Get latest 10 news items
      
      // Calculate sentiment
      const sentimentScores = news.map((article: any) => {
        // Simple sentiment analysis based on headline keywords
        const headline = article.headline.toLowerCase();
        const positiveWords = ['up', 'rise', 'gain', 'increase', 'positive', 'growth', 'profit', 'beat', 'exceed'];
        const negativeWords = ['down', 'fall', 'drop', 'decrease', 'negative', 'loss', 'miss', 'decline', 'crash'];
        
        let score = 0;
        positiveWords.forEach(word => {
          if (headline.includes(word)) score += 1;
        });
        negativeWords.forEach(word => {
          if (headline.includes(word)) score -= 1;
        });
        
        return score;
      });

      const averageSentiment = sentimentScores.reduce((sum: number, score: number) => sum + score, 0) / sentimentScores.length;
      
      return {
        newsCount: news.length,
        averageSentiment: averageSentiment,
        sentiment: averageSentiment > 0.5 ? 'positive' : averageSentiment < -0.5 ? 'negative' : 'neutral',
        recentNews: news.slice(0, 3).map((article: any) => ({
          headline: article.headline,
          summary: article.summary,
          url: article.url,
          publishedAt: article.datetime
        }))
      };
    } catch (error) {
      console.error(`Finnhub news sentiment error for ${symbol}:`, error);
      return {};
    }
  }

  // Generic Alpha Vantage data fetcher
  private async fetchAlphaVantageData(functionName: string, symbol: string, interval: string = 'daily', timePeriod: string = '20'): Promise<any> {
    try {
      const params: any = {
        function: functionName,
        symbol: symbol,
        interval: interval,
        apikey: process.env.ALPHA_VANTAGE_API_KEY
      };

      if (timePeriod) {
        params.time_period = timePeriod;
      }

      const response = await axios.get(this.ALPHA_VANTAGE_BASE_URL, { params });
      
      if (response.data['Error Message']) {
        console.warn(`Alpha Vantage ${functionName} error:`, response.data['Error Message']);
        return null;
      }

      if (response.data['Note']) {
        console.warn(`Alpha Vantage rate limit reached for ${functionName}`);
        return null;
      }

      return response.data;
    } catch (error) {
      console.warn(`Alpha Vantage ${functionName} error:`, error.message);
      return null;
    }
  }

  // Technical indicator signal helpers
  private getRSISignal(rsi: number): string {
    if (rsi < 30) return 'oversold';
    if (rsi > 70) return 'overbought';
    return 'neutral';
  }

  private getMACDSignal(macd: number, signal: number): string {
    if (macd > signal) return 'bullish';
    if (macd < signal) return 'bearish';
    return 'neutral';
  }

  private getBollingerPosition(currentPrice: number | null, upper: number, middle: number, lower: number): string {
    if (currentPrice === null) return 'neutral';

    if (currentPrice <= lower) return 'oversold';
    if (currentPrice >= upper) return 'overbought';
    if (currentPrice < middle) return 'below_middle';
    return 'above_middle';
  }

  // Get market overview with enhanced data
  async getEnhancedMarketOverview(): Promise<any> {
    try {
      const basicOverview = await stockDataService.getMarketOverview();
      
      if (!this.ALPHA_VANTAGE_API_KEY && !this.FINNHUB_API_KEY) {
        return basicOverview;
      }

      // Enhance with additional data
      const enhancedOverview = {
        ...basicOverview,
        marketSentiment: await this.getMarketSentiment(),
        sectorPerformance: await this.getSectorPerformance(),
        economicIndicators: await this.getEconomicIndicators()
      };

      return enhancedOverview;
    } catch (error) {
      console.error('Enhanced market overview error:', error);
      return await stockDataService.getMarketOverview();
    }
  }

  // Get overall market sentiment
  private async getMarketSentiment(): Promise<any> {
    if (!this.FINNHUB_API_KEY) return {};

    try {
      const response = await axios.get(`${this.FINNHUB_BASE_URL}/news-sentiment`, {
        params: {
          symbol: 'AAPL', // Use AAPL as market proxy
          token: this.FINNHUB_API_KEY
        }
      });

      return {
        sentiment: response.data.sentiment || 'neutral',
        bullishPercent: response.data.bullishPercent || 50,
        bearishPercent: response.data.bearishPercent || 50
      };
    } catch (error) {
      console.error('Market sentiment error:', error);
      return {};
    }
  }

  // Get sector performance
  private async getSectorPerformance(): Promise<any> {
    if (!this.ALPHA_VANTAGE_API_KEY) return {};

    try {
      const sectors = ['XLK', 'XLF', 'XLV', 'XLE', 'XLI', 'XLY', 'XLP', 'XLU', 'XLRE', 'XLB']; // Sector ETFs
      const sectorData = [];

      for (const sector of sectors) {
        try {
          const data = await stockDataService.getStockData(sector);
          if (data) {
            sectorData.push({
              symbol: sector,
              name: data.name,
              changePercent: data.changePercent,
              price: data.price
            });
          }
        } catch (error) {
          console.warn(`Sector data error for ${sector}:`, error);
        }
      }

      return sectorData;
    } catch (error) {
      console.error('Sector performance error:', error);
      return [];
    }
  }

  // Get economic indicators
  private async getEconomicIndicators(): Promise<any> {
    if (!this.ALPHA_VANTAGE_API_KEY) return {};

    try {
      const indicators = ['TREASURY_YIELD', 'FEDERAL_FUNDS_RATE', 'CPI', 'GDP'];
      const indicatorData: any = {};

      for (const indicator of indicators) {
        try {
          const response = await axios.get(this.ALPHA_VANTAGE_BASE_URL, {
            params: {
              function: indicator,
              apikey: this.ALPHA_VANTAGE_API_KEY
            }
          });

          if (response.data && !response.data['Error Message']) {
            indicatorData[indicator.toLowerCase()] = response.data;
          }
        } catch (error) {
          console.warn(`Economic indicator error for ${indicator}:`, error);
        }
      }

      return indicatorData;
    } catch (error) {
      console.error('Economic indicators error:', error);
      return {};
    }
  }
}

// Lazy initialization to ensure environment variables are loaded
let _enhancedStockDataService: EnhancedStockDataService | null = null;

export const enhancedStockDataService = {
  get instance() {
    if (!_enhancedStockDataService) {
      _enhancedStockDataService = new EnhancedStockDataService();
    }
    return _enhancedStockDataService;
  }
};
