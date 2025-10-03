import axios from 'axios';
import { AIInsight, TechnicalIndicator, TradingSignal, RiskAssessment, PortfolioOptimization } from '../types';
import { AIInsight as AIInsightModel } from '../models/AIInsight';
import { StockData } from '../models/StockData';
import { MarketData } from '../models/StockData';
import { Portfolio } from '../models/Portfolio';
import { stockDataService } from './StockDataService';
import { enhancedStockDataService } from './EnhancedStockDataService';

export class AIService {
  private readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  private readonly USE_FREE_AI = process.env.USE_FREE_AI === 'true' || !this.GEMINI_API_KEY;
  private readonly HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  constructor() {
    console.log(`🤖 AI Service initialized with ${this.GEMINI_API_KEY ? 'Gemini AI' : 'FREE alternatives'}`);
  }

  // Generate trading signal for a stock
  async generateTradingSignal(symbol: string, userId?: string): Promise<AIInsight | null> {
    try {
      console.log(`📊 Starting AI analysis for ${symbol}`);

      // Get basic stock data first (works reliably)
      const basicData = await stockDataService.getStockData(symbol);
      if (!basicData) {
        throw new Error(`No basic data available for ${symbol}`);
      }
      console.log(`✅ Got basic data for ${symbol}: $${basicData.price}`);

      // Try to get enhanced data, but fall back gracefully
      let enhancedData = null;
      try {
        enhancedData = await enhancedStockDataService.instance.getEnhancedStockData(symbol);
        console.log(`✅ Enhanced data loaded for ${symbol}`);
    } catch (enhancedError: any) {
      console.warn(`⚠️ Enhanced data failed for ${symbol}, using basic data only:`, enhancedError.message);
      enhancedData = basicData; // Fallback to basic data
    }

      // Get market data
      const marketData = await stockDataService.getMarketData(symbol, '3mo');
      console.log(`✅ Got market data for ${symbol}: ${marketData.length} data points`);

      if (!enhancedData || marketData.length === 0) {
        throw new Error(`Insufficient data for ${symbol}`);
      }

      // Calculate technical indicators (enhanced with Alpha Vantage data)
      const technicalIndicators = await this.calculateEnhancedTechnicalIndicators(marketData, enhancedData.technicalIndicators);

      // Generate enhanced AI analysis
      const analysis = await this.generateEnhancedStockAnalysis(symbol, enhancedData, marketData, technicalIndicators);

      // Create AI insight
      const insight = new AIInsightModel({
        userId,
        symbol: symbol.toUpperCase(),
        type: 'trading_signal',
        title: `Enhanced Trading Signal: ${symbol}`,
        description: analysis.description,
        confidence: analysis.confidence,
        action: analysis.action,
        reasoning: analysis.reasoning,
        technicalIndicators: technicalIndicators
      });

      await insight.save();
      return insight;
    } catch (error) {
      console.error(`Error generating trading signal for ${symbol}:`, error);
      return null;
    }
  }

  // Generate market analysis
  async generateMarketAnalysis(symbols: string[]): Promise<AIInsight | null> {
    try {
      const stocksData = await stockDataService.getMultipleStocksData(symbols);
      
      if (stocksData.length === 0) {
        throw new Error('No stock data available for analysis');
      }

      const analysis = await this.generateMarketTrendAnalysis(stocksData);

      const insight = new AIInsightModel({
        symbol: symbols.join(','),
        type: 'market_analysis',
        title: 'Market Trend Analysis',
        description: analysis.description,
        confidence: analysis.confidence,
        action: analysis.action,
        reasoning: analysis.reasoning,
        technicalIndicators: []
      });

      await insight.save();
      return insight;
    } catch (error) {
      console.error('Error generating market analysis:', error);
      return null;
    }
  }

  // Generate risk assessment for portfolio
  async generateRiskAssessment(userId: string): Promise<RiskAssessment | null> {
    try {
      const portfolio = await Portfolio.findOne({ userId }).populate('holdings');
      
      if (!portfolio || portfolio.holdings.length === 0) {
        throw new Error('No portfolio found for risk assessment');
      }

      // Get current stock data for all holdings
      const symbols = portfolio.holdings.map(h => h.symbol);
      const stocksData = await stockDataService.getMultipleStocksData(symbols);

      const riskAnalysis = await this.calculatePortfolioRisk(portfolio, stocksData);

      return riskAnalysis;
    } catch (error) {
      console.error(`Error generating risk assessment for user ${userId}:`, error);
      return null;
    }
  }

  // Generate portfolio optimization recommendations
  async generatePortfolioOptimization(userId: string): Promise<PortfolioOptimization | null> {
    try {
      const portfolio = await Portfolio.findOne({ userId }).populate('holdings');
      
      if (!portfolio || portfolio.holdings.length === 0) {
        throw new Error('No portfolio found for optimization');
      }

      const optimization = await this.optimizePortfolio(portfolio);

      return optimization;
    } catch (error) {
      console.error(`Error generating portfolio optimization for user ${userId}:`, error);
      return null;
    }
  }

  // Calculate enhanced technical indicators with Alpha Vantage data
  private async calculateEnhancedTechnicalIndicators(marketData: any[], alphaVantageData: any): Promise<TechnicalIndicator[]> {
    const indicators: TechnicalIndicator[] = [];
    
    if (marketData.length < 20) return indicators;

    const closes = marketData.map(d => d.close);
    const highs = marketData.map(d => d.high);
    const lows = marketData.map(d => d.low);
    const volumes = marketData.map(d => d.volume);

    // Enhanced RSI from Alpha Vantage
    if (alphaVantageData.rsi) {
      indicators.push({
        name: 'RSI (Alpha Vantage)',
        value: alphaVantageData.rsi.value,
        signal: alphaVantageData.rsi.signal === 'oversold' ? 'buy' : 
                alphaVantageData.rsi.signal === 'overbought' ? 'sell' : 'hold',
        strength: Math.abs(alphaVantageData.rsi.value - 50) * 2
      });
    } else {
      // Fallback to calculated RSI
      const rsi = this.calculateRSI(closes);
      if (rsi !== null) {
        indicators.push({
          name: 'RSI',
          value: rsi,
          signal: rsi < 30 ? 'buy' : rsi > 70 ? 'sell' : 'hold',
          strength: Math.abs(rsi - 50) * 2
        });
      }
    }

    // Enhanced MACD from Alpha Vantage
    if (alphaVantageData.macd) {
      indicators.push({
        name: 'MACD (Alpha Vantage)',
        value: alphaVantageData.macd.macd,
        signal: alphaVantageData.macd.signal_direction === 'bullish' ? 'buy' : 
                alphaVantageData.macd.signal_direction === 'bearish' ? 'sell' : 'hold',
        strength: Math.abs(alphaVantageData.macd.macd - alphaVantageData.macd.signal) * 100
      });
    } else {
      // Fallback to calculated MACD
      const macd = this.calculateMACD(closes);
      if (macd) {
        indicators.push({
          name: 'MACD',
          value: macd.macd,
          signal: macd.macd > macd.signal ? 'buy' : 'sell',
          strength: Math.abs(macd.macd - macd.signal) * 100
        });
      }
    }

    // Enhanced Bollinger Bands from Alpha Vantage
    if (alphaVantageData.bollingerBands) {
      const currentPrice = closes[closes.length - 1];
      let signal: 'buy' | 'sell' | 'hold' = 'hold';
      if (currentPrice < alphaVantageData.bollingerBands.lower) signal = 'buy';
      else if (currentPrice > alphaVantageData.bollingerBands.upper) signal = 'sell';
      
      indicators.push({
        name: 'Bollinger Bands (Alpha Vantage)',
        value: currentPrice,
        signal,
        strength: Math.abs(currentPrice - alphaVantageData.bollingerBands.middle) / alphaVantageData.bollingerBands.middle * 100
      });
    } else {
      // Fallback to calculated Bollinger Bands
      const bb = this.calculateBollingerBands(closes);
      if (bb) {
        const currentPrice = closes[closes.length - 1];
        let signal: 'buy' | 'sell' | 'hold' = 'hold';
        if (currentPrice < bb.lower) signal = 'buy';
        else if (currentPrice > bb.upper) signal = 'sell';
        
        indicators.push({
          name: 'Bollinger Bands',
          value: currentPrice,
          signal,
          strength: Math.abs(currentPrice - bb.middle) / bb.middle * 100
        });
      }
    }

    // Enhanced SMA from Alpha Vantage
    if (alphaVantageData.sma20) {
      const sma50 = this.calculateSMA(closes, 50);
      if (sma50) {
        indicators.push({
          name: 'SMA 20 (Alpha Vantage)',
          value: alphaVantageData.sma20,
          signal: alphaVantageData.sma20 > sma50 ? 'buy' : 'sell',
          strength: Math.abs(alphaVantageData.sma20 - sma50) / sma50 * 100
        });
      }
    }

    // Enhanced EMA from Alpha Vantage
    if (alphaVantageData.ema20) {
      const ema50 = this.calculateEMA(closes, 50);
      if (ema50) {
        indicators.push({
          name: 'EMA 20 (Alpha Vantage)',
          value: alphaVantageData.ema20,
          signal: alphaVantageData.ema20 > ema50 ? 'buy' : 'sell',
          strength: Math.abs(alphaVantageData.ema20 - ema50) / ema50 * 100
        });
      }
    }

    return indicators;
  }

  // Calculate technical indicators (fallback method)
  private async calculateTechnicalIndicators(marketData: any[]): Promise<TechnicalIndicator[]> {
    const indicators: TechnicalIndicator[] = [];
    
    if (marketData.length < 20) return indicators;

    const closes = marketData.map(d => d.close);
    const highs = marketData.map(d => d.high);
    const lows = marketData.map(d => d.low);
    const volumes = marketData.map(d => d.volume);

    // Simple Moving Average (SMA)
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    
    if (sma20 && sma50) {
      indicators.push({
        name: 'SMA 20',
        value: sma20,
        signal: sma20 > sma50 ? 'buy' : 'sell',
        strength: Math.abs(sma20 - sma50) / sma50 * 100
      });
    }

    // RSI
    const rsi = this.calculateRSI(closes);
    if (rsi !== null) {
      indicators.push({
        name: 'RSI',
        value: rsi,
        signal: rsi < 30 ? 'buy' : rsi > 70 ? 'sell' : 'hold',
        strength: Math.abs(rsi - 50) * 2
      });
    }

    // MACD
    const macd = this.calculateMACD(closes);
    if (macd) {
      indicators.push({
        name: 'MACD',
        value: macd.macd,
        signal: macd.macd > macd.signal ? 'buy' : 'sell',
        strength: Math.abs(macd.macd - macd.signal) * 100
      });
    }

    // Bollinger Bands
    const bb = this.calculateBollingerBands(closes);
    if (bb) {
      const currentPrice = closes[closes.length - 1];
      let signal: 'buy' | 'sell' | 'hold' = 'hold';
      if (currentPrice < bb.lower) signal = 'buy';
      else if (currentPrice > bb.upper) signal = 'sell';
      
      indicators.push({
        name: 'Bollinger Bands',
        value: currentPrice,
        signal,
        strength: Math.abs(currentPrice - bb.middle) / bb.middle * 100
      });
    }

    return indicators;
  }

  // Generate enhanced AI analysis with Alpha Vantage and Finnhub data
  private async generateEnhancedStockAnalysis(
    symbol: string,
    enhancedData: any,
    marketData: any[],
    indicators: TechnicalIndicator[]
  ): Promise<any> {
    if (this.GEMINI_API_KEY) {
      console.log(`🤖 Using Gemini AI for enhanced analysis of ${symbol}`);
      return this.generateGeminiAnalysis(symbol, enhancedData, marketData, indicators);
    } else {
      console.log(`📊 Gemini API key not found, using rule-based analysis for ${symbol}`);
      return this.generateEnhancedFreeAnalysis(symbol, enhancedData, marketData, indicators);
    }
  }

  // Generate AI analysis using free alternatives
  private async generateStockAnalysis(
    symbol: string,
    stockData: any,
    marketData: any[],
    indicators: TechnicalIndicator[]
  ): Promise<any> {
    if (this.GEMINI_API_KEY) {
      console.log(`🤖 Using Gemini AI for analysis of ${symbol}`);
      return this.generateGeminiAnalysis(symbol, stockData, marketData, indicators);
    } else {
      console.log(`📊 Gemini API key not found, using rule-based analysis for ${symbol}`);
      return this.generateFreeAnalysis(symbol, stockData, marketData, indicators);
    }
  }

  // Enhanced free AI analysis with Alpha Vantage and Finnhub data
  private async generateEnhancedFreeAnalysis(
    symbol: string, 
    enhancedData: any, 
    marketData: any[], 
    indicators: TechnicalIndicator[]
  ): Promise<any> {
    try {
      // Enhanced rule-based analysis with additional data sources
      const analysis = this.performEnhancedRuleBasedAnalysis(symbol, enhancedData, marketData, indicators);
      
      // Try Hugging Face for enhanced analysis (if API key available)
      if (this.HUGGINGFACE_API_KEY) {
        try {
          const enhancedAnalysis = await this.generateHuggingFaceAnalysis(symbol, enhancedData, analysis);
          return enhancedAnalysis;
        } catch (error) {
          console.warn('Hugging Face API failed, using enhanced rule-based analysis:', error);
        }
      }
      
      return analysis;
    } catch (error) {
      console.error('Enhanced free AI analysis error:', error);
      return this.getFallbackAnalysis(symbol);
    }
  }

  // Free AI analysis using rule-based system and Hugging Face
  private async generateFreeAnalysis(
    symbol: string, 
    stockData: any, 
    marketData: any[], 
    indicators: TechnicalIndicator[]
  ): Promise<any> {
    try {
      // Rule-based analysis
      const analysis = this.performRuleBasedAnalysis(symbol, stockData, marketData, indicators);
      
      // Try Hugging Face for enhanced analysis (if API key available)
      if (this.HUGGINGFACE_API_KEY) {
        try {
          const enhancedAnalysis = await this.generateHuggingFaceAnalysis(symbol, stockData, analysis);
          return enhancedAnalysis;
        } catch (error) {
          console.warn('Hugging Face API failed, using rule-based analysis:', error);
        }
      }
      
      return analysis;
    } catch (error) {
      console.error('Free AI analysis error:', error);
      return this.getFallbackAnalysis(symbol);
    }
  }

  // Enhanced rule-based analysis with Alpha Vantage and Finnhub data
  private performEnhancedRuleBasedAnalysis(
    symbol: string, 
    enhancedData: any, 
    marketData: any[], 
    indicators: TechnicalIndicator[]
  ): any {
    let score = 0;
    const reasoning: string[] = [];
    
    // Basic price momentum analysis
    if (enhancedData.changePercent > 2) {
      score += 20;
      reasoning.push(`Strong positive momentum: +${enhancedData.changePercent.toFixed(2)}%`);
    } else if (enhancedData.changePercent < -2) {
      score -= 20;
      reasoning.push(`Negative momentum: ${enhancedData.changePercent.toFixed(2)}%`);
    }
    
    // Volume analysis
    if (enhancedData.volume > 1000000) {
      score += 10;
      reasoning.push('High trading volume indicates strong interest');
    }
    
    // Enhanced technical indicators analysis (Alpha Vantage data)
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    indicators.forEach(indicator => {
      if (indicator.signal === 'buy') {
        bullishSignals++;
        score += 15;
        reasoning.push(`${indicator.name} shows bullish signal (${indicator.value})`);
      } else if (indicator.signal === 'sell') {
        bearishSignals++;
        score -= 15;
        reasoning.push(`${indicator.name} shows bearish signal (${indicator.value})`);
      }
    });
    
    // Enhanced fundamental analysis (Alpha Vantage data)
    if (enhancedData.fundamentalData) {
      const fd = enhancedData.fundamentalData;
      
      // PE ratio analysis
      if (fd.peRatio && fd.peRatio > 0) {
        if (fd.peRatio < 15) {
          score += 15;
          reasoning.push(`Low PE ratio (${fd.peRatio}) suggests undervaluation`);
        } else if (fd.peRatio > 30) {
          score -= 15;
          reasoning.push(`High PE ratio (${fd.peRatio}) suggests overvaluation`);
        }
      }
      
      // PEG ratio analysis
      if (fd.pegRatio && fd.pegRatio > 0) {
        if (fd.pegRatio < 1) {
          score += 10;
          reasoning.push(`Low PEG ratio (${fd.pegRatio}) indicates good value`);
        } else if (fd.pegRatio > 2) {
          score -= 10;
          reasoning.push(`High PEG ratio (${fd.pegRatio}) suggests overvaluation`);
        }
      }
      
      // Profit margin analysis
      if (fd.profitMargin && fd.profitMargin > 0) {
        if (fd.profitMargin > 15) {
          score += 10;
          reasoning.push(`Strong profit margin (${fd.profitMargin}%)`);
        } else if (fd.profitMargin < 5) {
          score -= 10;
          reasoning.push(`Weak profit margin (${fd.profitMargin}%)`);
        }
      }
      
      // Return on equity analysis
      if (fd.returnOnEquity && fd.returnOnEquity > 0) {
        if (fd.returnOnEquity > 15) {
          score += 10;
          reasoning.push(`Strong ROE (${fd.returnOnEquity}%)`);
        } else if (fd.returnOnEquity < 5) {
          score -= 10;
          reasoning.push(`Weak ROE (${fd.returnOnEquity}%)`);
        }
      }
      
      // Beta analysis
      if (fd.beta && fd.beta > 0) {
        if (fd.beta < 0.8) {
          score += 5;
          reasoning.push(`Low beta (${fd.beta}) indicates stability`);
        } else if (fd.beta > 1.5) {
          score -= 5;
          reasoning.push(`High beta (${fd.beta}) indicates volatility`);
        }
      }
      
      // Dividend analysis
      if (fd.dividendYield && fd.dividendYield > 0) {
        if (fd.dividendYield > 3) {
          score += 5;
          reasoning.push(`Attractive dividend yield (${fd.dividendYield}%)`);
        }
      }
    }
    
    // News sentiment analysis (Finnhub data)
    if (enhancedData.newsSentiment) {
      const ns = enhancedData.newsSentiment;
      
      if (ns.sentiment === 'positive') {
        score += 10;
        reasoning.push(`Positive news sentiment (${ns.averageSentiment.toFixed(2)})`);
      } else if (ns.sentiment === 'negative') {
        score -= 10;
        reasoning.push(`Negative news sentiment (${ns.averageSentiment.toFixed(2)})`);
      }
      
      if (ns.newsCount > 5) {
        score += 5;
        reasoning.push(`High news coverage (${ns.newsCount} articles)`);
      }
    }
    
    // Market cap analysis
    if (enhancedData.marketCap > 100000000000) { // > $100B
      score += 5;
      reasoning.push('Large cap stock provides stability');
    }
    
    // Determine action and confidence
    let action: 'buy' | 'sell' | 'hold' | 'watch';
    let confidence: number;
    
    if (score >= 40) {
      action = 'buy';
      confidence = Math.min(95, 70 + score);
    } else if (score <= -40) {
      action = 'sell';
      confidence = Math.min(95, 70 + Math.abs(score));
    } else if (Math.abs(score) < 20) {
      action = 'hold';
      confidence = 50;
    } else {
      action = 'watch';
      confidence = 65;
    }
    
    // Generate enhanced description
    const description = this.generateEnhancedDescription(symbol, action, score, bullishSignals, bearishSignals, enhancedData);
    
    return {
      description,
      action,
      confidence: Math.max(35, Math.min(95, confidence)),
      reasoning: reasoning.length > 0 ? reasoning : ['Enhanced technical analysis shows mixed signals', 'Recommend monitoring price action', 'Consider market conditions']
    };
  }

  // Rule-based analysis (completely free)
  private performRuleBasedAnalysis(
    symbol: string, 
    stockData: any, 
    marketData: any[], 
    indicators: TechnicalIndicator[]
  ): any {
    let score = 0;
    const reasoning: string[] = [];
    
    // Price momentum analysis
    if (stockData.changePercent > 2) {
      score += 20;
      reasoning.push(`Strong positive momentum: +${stockData.changePercent.toFixed(2)}%`);
    } else if (stockData.changePercent < -2) {
      score -= 20;
      reasoning.push(`Negative momentum: ${stockData.changePercent.toFixed(2)}%`);
    }
    
    // Volume analysis
    if (stockData.volume > 1000000) {
      score += 10;
      reasoning.push('High trading volume indicates strong interest');
    }
    
    // Technical indicators analysis
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    indicators.forEach(indicator => {
      if (indicator.signal === 'buy') {
        bullishSignals++;
        score += 15;
        reasoning.push(`${indicator.name} shows bullish signal (${indicator.value})`);
      } else if (indicator.signal === 'sell') {
        bearishSignals++;
        score -= 15;
        reasoning.push(`${indicator.name} shows bearish signal (${indicator.value})`);
      }
    });
    
    // PE ratio analysis
    if (stockData.pe && stockData.pe > 0) {
      if (stockData.pe < 15) {
        score += 10;
        reasoning.push('Low PE ratio suggests undervaluation');
      } else if (stockData.pe > 30) {
        score -= 10;
        reasoning.push('High PE ratio suggests overvaluation');
      }
    }
    
    // Market cap analysis
    if (stockData.marketCap > 100000000000) { // > $100B
      score += 5;
      reasoning.push('Large cap stock provides stability');
    }
    
    // Determine action and confidence
    let action: 'buy' | 'sell' | 'hold' | 'watch';
    let confidence: number;
    
    if (score >= 30) {
      action = 'buy';
      confidence = Math.min(90, 60 + score);
    } else if (score <= -30) {
      action = 'sell';
      confidence = Math.min(90, 60 + Math.abs(score));
    } else if (Math.abs(score) < 15) {
      action = 'hold';
      confidence = 50;
    } else {
      action = 'watch';
      confidence = 60;
    }
    
    // Generate description
    const description = this.generateDescription(symbol, action, score, bullishSignals, bearishSignals);
    
    return {
      description,
      action,
      confidence: Math.max(30, Math.min(95, confidence)),
      reasoning: reasoning.length > 0 ? reasoning : ['Technical analysis shows mixed signals', 'Recommend monitoring price action', 'Consider market conditions']
    };
  }

  // Generate enhanced description based on analysis
  private generateEnhancedDescription(symbol: string, action: string, score: number, bullish: number, bearish: number, enhancedData: any): string {
    const actionText = action.charAt(0).toUpperCase() + action.slice(1);
    let description = '';
    
    if (action === 'buy') {
      description = `${symbol} shows strong bullish signals with positive momentum and favorable technical indicators.`;
      
      if (enhancedData.fundamentalData) {
        const fd = enhancedData.fundamentalData;
        if (fd.peRatio && fd.peRatio < 20) {
          description += ` Strong fundamentals with attractive PE ratio (${fd.peRatio}).`;
        }
        if (fd.profitMargin && fd.profitMargin > 10) {
          description += ` Healthy profit margin (${fd.profitMargin}%) indicates operational efficiency.`;
        }
      }
      
      if (enhancedData.newsSentiment && enhancedData.newsSentiment.sentiment === 'positive') {
        description += ` Positive news sentiment supports the bullish outlook.`;
      }
      
      description += ` Consider ${actionText.toLowerCase()} for potential upside.`;
    } else if (action === 'sell') {
      description = `${symbol} displays bearish signals with negative momentum and concerning technical indicators.`;
      
      if (enhancedData.fundamentalData) {
        const fd = enhancedData.fundamentalData;
        if (fd.peRatio && fd.peRatio > 25) {
          description += ` High valuation with elevated PE ratio (${fd.peRatio}).`;
        }
        if (fd.profitMargin && fd.profitMargin < 5) {
          description += ` Weak profit margin (${fd.profitMargin}%) raises concerns.`;
        }
      }
      
      if (enhancedData.newsSentiment && enhancedData.newsSentiment.sentiment === 'negative') {
        description += ` Negative news sentiment adds to bearish pressure.`;
      }
      
      description += ` Consider ${actionText.toLowerCase()} to limit downside risk.`;
    } else if (action === 'watch') {
      description = `${symbol} shows mixed signals with both bullish and bearish indicators.`;
      
      if (enhancedData.fundamentalData) {
        const fd = enhancedData.fundamentalData;
        if (fd.sector) {
          description += ` Operating in ${fd.sector} sector with ${fd.industry} industry dynamics.`;
        }
      }
      
      description += ` ${actionText} for clearer direction before making investment decisions.`;
    } else {
      description = `${symbol} appears stable with neutral technical indicators.`;
      
      if (enhancedData.fundamentalData) {
        const fd = enhancedData.fundamentalData;
        if (fd.beta && fd.beta < 1) {
          description += ` Low beta (${fd.beta}) indicates relative stability.`;
        }
      }
      
      description += ` ${actionText} current position while monitoring for changes in market conditions.`;
    }
    
    return description;
  }

  // Generate description based on analysis
  private generateDescription(symbol: string, action: string, score: number, bullish: number, bearish: number): string {
    const actionText = action.charAt(0).toUpperCase() + action.slice(1);
    
    if (action === 'buy') {
      return `${symbol} shows strong bullish signals with positive momentum and favorable technical indicators. Consider ${actionText.toLowerCase()} for potential upside.`;
    } else if (action === 'sell') {
      return `${symbol} displays bearish signals with negative momentum and concerning technical indicators. Consider ${actionText.toLowerCase()} to limit downside risk.`;
    } else if (action === 'watch') {
      return `${symbol} shows mixed signals with both bullish and bearish indicators. ${actionText} for clearer direction before making investment decisions.`;
    } else {
      return `${symbol} appears stable with neutral technical indicators. ${actionText} current position while monitoring for changes in market conditions.`;
    }
  }

  // Hugging Face API integration (optional enhancement)
  private async generateHuggingFaceAnalysis(symbol: string, stockData: any, baseAnalysis: any): Promise<any> {
    try {
      const prompt = `Analyze stock ${symbol} with price $${stockData.price}, change ${stockData.changePercent}%. Provide trading recommendation: ${baseAnalysis.action} with confidence ${baseAnalysis.confidence}%.`;
      
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
        {
          inputs: prompt,
          parameters: {
            max_length: 100,
            temperature: 0.7
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Enhance the base analysis with Hugging Face response
      const enhancedReasoning = [...baseAnalysis.reasoning];
      if (response.data && response.data.generated_text) {
        enhancedReasoning.push(`AI enhancement: ${response.data.generated_text.substring(0, 100)}...`);
      }
      
      return {
        ...baseAnalysis,
        reasoning: enhancedReasoning
      };
    } catch (error) {
      throw new Error('Hugging Face API error: ' + error);
    }
  }

  // Gemini AI analysis using the advanced 2.5 Flash Preview model
  public async generateGeminiAnalysis(
    symbol: string,
    stockData: any,
    marketData: any[],
    indicators: TechnicalIndicator[]
  ): Promise<any> {
    const prompt = `
Analyze the following stock data and provide a professional trading recommendation using advanced financial analysis techniques:

Stock: ${symbol}
Current Price: $${stockData.price}
Change: ${stockData.change} (${stockData.changePercent}%)
Volume: ${stockData.volume ? stockData.volume.toLocaleString() : 'N/A'}
Market Cap: $${stockData.marketCap ? stockData.marketCap.toLocaleString() : 'N/A'}
PE Ratio: ${stockData.pe || 'N/A'}

Technical Indicators:
${indicators.map(ind => `- ${ind.name}: ${typeof ind.value === 'number' ? ind.value.toFixed(2) : ind.value} (${ind.signal})`).join('\n')}

Recent Price Trend (last 10 days):
${marketData.slice(-10).map(d => `${new Date(d.timestamp).toISOString().split('T')[0]}: $${d.close}`).join('\n')}

As a senior financial analyst, provide a comprehensive analysis with:
1. Detailed market assessment and current position analysis
2. Technical analysis interpretation
3. Risk assessment and market sentiment evaluation
4. Clear trading recommendation based on multiple factors
5. Confidence assessment considering various market signals

Format your response as valid JSON only:
{
  "description": "Professional analysis description highlighting key insights...",
  "action": "buy|sell|hold|watch",
  "confidence": 85,
  "reasoning": ["Key factor 1 with detailed reasoning", "Technical indicator analysis", "Risk assessment details", "Market conditions evaluation", "Recommendation rationale"]
}

Focus on actionable insights backed by the data provided.
`;

    try {
      console.log(`🤖 Sending analysis request to Gemini 2.5 Flash Preview for ${symbol}`);

      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      };

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.GEMINI_API_KEY}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 600000 // 10 minutes timeout for Gemini AI analysis
        }
      );

      if (!response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('No response candidates from Gemini API');
      }

      const content = response.data.candidates[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('Empty content in Gemini response');
      }

      console.log(`✅ Successfully received Gemini analysis for ${symbol}`);
      return JSON.parse(content);
    } catch (error: any) {
      console.error('❌ Gemini API error for analysis:', error.response?.data || error.message);

      // Fallback to rule-based analysis if Gemini fails
      console.log(`🔄 Falling back to rule-based analysis for ${symbol}`);
      return this.getFallbackAnalysis(symbol);
    }
  }

  // Fallback analysis when all AI services fail
  public getFallbackAnalysis(symbol: string): any {
    return {
      description: `Based on technical analysis, ${symbol} shows mixed signals. Consider monitoring price action and market conditions.`,
      action: 'hold',
      confidence: 50,
      reasoning: [
        'Limited data available for comprehensive analysis',
        'Mixed technical indicators present',
        'Recommend further research and monitoring',
        'Consider market volatility and external factors'
      ]
    };
  }

  // Simple chat about stock functionality - uses Gemini with real data only
  public async chatAboutStock(
    symbol: string,
    message: string,
    context?: any,
    userId?: string
  ): Promise<any> {
    console.log(`💬 AI chat about ${symbol}: "${message}"`);

    try {
      // Simple Gemini call like the working analysis endpoints
      const prompt = `You are a financial analyst. A user has this stock data and asks: "${message}"

Stock: ${symbol}
Price: $${context?.price || 'N/A'}
Change: ${context?.changePercent ? context.changePercent.toFixed(2) + '%' : 'N/A'}
Market Cap: ${context?.marketCap ? (context.marketCap / 1000000000).toFixed(1) + 'B' : 'N/A'}
P/E Ratio: ${context?.pe || 'N/A'}

Previous recommendation: ${context?.action || 'HOLD'} (${context?.confidence || 'N/A'}% confidence)

Provide a brief, helpful response to their question.`;

      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 1024,
          responseMimeType: "text/plain"
        }
      };

      console.log(`🤖 Sending chat request to Gemini`);

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.GEMINI_API_KEY}`,
        requestBody,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 300000 // 5 minutes
        }
      );

      const content = response.data.candidates[0]?.content?.parts?.[0]?.text;
      if (content) {
        console.log(`✅ Gemini chat response successful`);
        return {
          response: content.trim(),
          source: 'gemini',
          symbol: symbol,
          confidence: 75,
          timestamp: new Date(),
          riskLevel: 'medium'
        };
      }

      // If no content, throw error to go to fallback
      throw new Error('No Gemini response');

    } catch (error: any) {
      console.error('❌ Gemini chat failed:', error.message);

      // Simple fallback
      return {
        response: `Based on the current data for ${symbol} (Price: $${context?.price || 'N/A'}, Change: ${context?.changePercent?.toFixed(2)}%, Prev. recommendation: ${context?.action || 'HOLD'}), please check recent financial reports for detailed information about your question.`,
        source: 'fallback',
        symbol: symbol,
        confidence: 50,
        timestamp: new Date(),
        riskLevel: 'medium'
      };
    }
  }

  // Generate market trend analysis
  private async generateMarketTrendAnalysis(stocksData: any[]): Promise<any> {
    // Use free market analysis for now - can be enhanced with Gemini later
    console.log(`📊 Using rule-based market analysis`);
    return this.generateFreeMarketAnalysis(stocksData);
  }

  // Free market analysis using rule-based system
  private async generateFreeMarketAnalysis(stocksData: any[]): Promise<any> {
    try {
      let bullishCount = 0;
      let bearishCount = 0;
      let totalChange = 0;
      const reasoning: string[] = [];
      
      // Analyze each stock
      stocksData.forEach(stock => {
        totalChange += stock.changePercent;
        if (stock.changePercent > 1) {
          bullishCount++;
        } else if (stock.changePercent < -1) {
          bearishCount++;
        }
      });
      
      const averageChange = totalChange / stocksData.length;
      
      // Determine market sentiment
      let sentiment: string;
      let action: 'buy' | 'sell' | 'hold' | 'watch';
      let confidence: number;
      
      if (bullishCount > bearishCount * 1.5) {
        sentiment = 'bullish';
        action = 'buy';
        confidence = Math.min(85, 60 + bullishCount * 5);
        reasoning.push(`${bullishCount} stocks showing positive momentum`);
        reasoning.push(`Average change: +${averageChange.toFixed(2)}%`);
      } else if (bearishCount > bullishCount * 1.5) {
        sentiment = 'bearish';
        action = 'sell';
        confidence = Math.min(85, 60 + bearishCount * 5);
        reasoning.push(`${bearishCount} stocks showing negative momentum`);
        reasoning.push(`Average change: ${averageChange.toFixed(2)}%`);
      } else {
        sentiment = 'neutral';
        action = 'hold';
        confidence = 50;
        reasoning.push('Mixed signals across market');
        reasoning.push(`Balanced performance: ${bullishCount} bullish, ${bearishCount} bearish`);
      }
      
      // Add volume analysis
      const highVolumeStocks = stocksData.filter(stock => stock.volume > 1000000).length;
      if (highVolumeStocks > stocksData.length / 2) {
        reasoning.push('High trading volume indicates strong market interest');
        confidence += 5;
      }
      
      // Generate description
      const description = this.generateMarketDescription(sentiment, averageChange, bullishCount, bearishCount);
      
      return {
        description,
        action,
        confidence: Math.max(30, Math.min(95, confidence)),
        reasoning: reasoning.length > 0 ? reasoning : ['Market analysis shows mixed signals', 'Recommend monitoring key indicators', 'Consider overall market conditions']
      };
    } catch (error) {
      console.error('Free market analysis error:', error);
      return this.getFallbackMarketAnalysis();
    }
  }

  // Generate market description
  private generateMarketDescription(sentiment: string, avgChange: number, bullish: number, bearish: number): string {
    if (sentiment === 'bullish') {
      return `Market shows bullish sentiment with ${bullish} stocks gaining momentum. Average change of +${avgChange.toFixed(2)}% indicates positive market direction.`;
    } else if (sentiment === 'bearish') {
      return `Market displays bearish sentiment with ${bearish} stocks declining. Average change of ${avgChange.toFixed(2)}% suggests cautious market approach.`;
    } else {
      return `Market shows neutral sentiment with balanced performance. ${bullish} stocks gaining and ${bearish} stocks declining, indicating mixed market conditions.`;
    }
  }

  // OpenAI market analysis (if API key is available)
  private async generateOpenAIMarketAnalysis(stocksData: any[]): Promise<any> {
    const marketSummary = stocksData.map(stock => 
      `${stock.symbol}: $${stock.price} (${stock.changePercent}%)`
    ).join('\n');

    const prompt = `
Analyze the current market trend based on these stocks:

${marketSummary}

Provide a market analysis with:
1. Overall market sentiment
2. Key trends observed
3. Confidence level (0-100)
4. Action recommendation
5. Reasoning points

Format as JSON:
{
  "description": "Market analysis...",
  "action": "buy|sell|hold|watch",
  "confidence": 75,
  "reasoning": ["Trend 1", "Trend 2", "Trend 3"]
}
`;

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getFallbackMarketAnalysis();
    }
  }

  // Fallback market analysis
  private getFallbackMarketAnalysis(): any {
    return {
      description: 'Market shows mixed signals with no clear trend.',
      action: 'hold',
      confidence: 50,
      reasoning: ['Mixed performance across stocks', 'No clear market direction', 'Recommend cautious approach']
    };
  }

  // Calculate portfolio risk
  private async calculatePortfolioRisk(portfolio: any, stocksData: any[]): Promise<RiskAssessment> {
    // Calculate portfolio metrics
    const totalValue = portfolio.totalValue;
    const holdings = portfolio.holdings;
    
    // Calculate diversification score
    const diversificationScore = this.calculateDiversificationScore(holdings);
    
    // Calculate volatility score
    const volatilityScore = this.calculateVolatilityScore(stocksData);
    
    // Calculate overall portfolio risk
    const portfolioRisk = (100 - diversificationScore) * 0.4 + volatilityScore * 0.6;
    
    // Generate recommendations
    const recommendations = this.generateRiskRecommendations(portfolioRisk, diversificationScore, volatilityScore);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(holdings, stocksData);

    return {
      portfolioRisk: Math.min(100, Math.max(0, portfolioRisk)),
      diversificationScore,
      volatilityScore,
      recommendations,
      riskFactors
    };
  }

  // Optimize portfolio
  private async optimizePortfolio(portfolio: any): Promise<PortfolioOptimization> {
    const currentAllocation = this.calculateCurrentAllocation(portfolio);
    const recommendedAllocation = this.generateRecommendedAllocation(currentAllocation);
    
    // Calculate expected metrics
    const expectedReturn = this.calculateExpectedReturn(recommendedAllocation);
    const expectedRisk = this.calculateExpectedRisk(recommendedAllocation);
    const sharpeRatio = expectedReturn / expectedRisk;
    
    const recommendations = this.generateOptimizationRecommendations(currentAllocation, recommendedAllocation);

    return {
      currentAllocation,
      recommendedAllocation,
      expectedReturn,
      expectedRisk,
      sharpeRatio,
      recommendations
    };
  }

  // Technical indicator calculations
  private calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateRSI(prices: number[], period: number = 14): number | null {
    if (prices.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): { macd: number; signal: number } | null {
    if (prices.length < 26) return null;
    
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    if (!ema12 || !ema26) return null;
    
    const macd = ema12 - ema26;
    // Simplified signal line (9-period EMA of MACD)
    const signal = macd * 0.9; // Simplified calculation
    
    return { macd, signal };
  }

  private calculateEMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  private calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } | null {
    if (prices.length < period) return null;
    
    const sma = this.calculateSMA(prices, period);
    if (!sma) return null;
    
    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * standardDeviation),
      middle: sma,
      lower: sma - (stdDev * standardDeviation)
    };
  }

  // Portfolio analysis methods
  private calculateDiversificationScore(holdings: any[]): number {
    if (holdings.length <= 1) return 0;
    
    const weights = holdings.map(h => h.marketValue / holdings.reduce((sum, h) => sum + h.marketValue, 0));
    const hhi = weights.reduce((sum, weight) => sum + weight * weight, 0);
    
    // Convert HHI to diversification score (0-100)
    return Math.max(0, 100 - (hhi * 100));
  }

  private calculateVolatilityScore(stocksData: any[]): number {
    if (stocksData.length === 0) return 50;
    
    const avgChangePercent = stocksData.reduce((sum, stock) => sum + Math.abs(stock.changePercent), 0) / stocksData.length;
    return Math.min(100, avgChangePercent * 2); // Scale to 0-100
  }

  private generateRiskRecommendations(portfolioRisk: number, diversificationScore: number, volatilityScore: number): string[] {
    const recommendations = [];
    
    if (portfolioRisk > 70) {
      recommendations.push('Consider reducing portfolio risk by diversifying holdings');
    }
    
    if (diversificationScore < 30) {
      recommendations.push('Increase diversification across different sectors and asset classes');
    }
    
    if (volatilityScore > 70) {
      recommendations.push('Consider adding more stable, low-volatility investments');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Portfolio risk is within acceptable range');
    }
    
    return recommendations;
  }

  private identifyRiskFactors(holdings: any[], stocksData: any[]): any[] {
    const riskFactors = [];
    
    // Check for concentration risk
    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const maxHolding = Math.max(...holdings.map(h => h.marketValue));
    const concentrationPercent = (maxHolding / totalValue) * 100;
    
    if (concentrationPercent > 30) {
      riskFactors.push({
        factor: 'Concentration Risk',
        impact: 'high',
        description: `Single holding represents ${concentrationPercent.toFixed(1)}% of portfolio`
      });
    }
    
    // Check for sector concentration
    // This would require sector data from stocks
    riskFactors.push({
      factor: 'Market Volatility',
      impact: 'medium',
      description: 'Current market conditions show elevated volatility'
    });
    
    return riskFactors;
  }

  private calculateCurrentAllocation(portfolio: any): { [symbol: string]: number } {
    const allocation: { [symbol: string]: number } = {};
    const totalValue = portfolio.totalValue;
    
    portfolio.holdings.forEach((holding: any) => {
      allocation[holding.symbol] = (holding.marketValue / totalValue) * 100;
    });
    
    return allocation;
  }

  private generateRecommendedAllocation(currentAllocation: { [symbol: string]: number }): { [symbol: string]: number } {
    // Simplified optimization - in reality, this would use more sophisticated algorithms
    const recommended: { [symbol: string]: number } = {};
    const symbols = Object.keys(currentAllocation);
    
    // Equal weight recommendation (simplified)
    const equalWeight = 100 / symbols.length;
    symbols.forEach(symbol => {
      recommended[symbol] = equalWeight;
    });
    
    return recommended;
  }

  private calculateExpectedReturn(allocation: { [symbol: string]: number }): number {
    // Simplified calculation - would use historical returns and risk models
    return 8.5; // 8.5% expected annual return
  }

  private calculateExpectedRisk(allocation: { [symbol: string]: number }): number {
    // Simplified calculation - would use covariance matrix
    return 12.3; // 12.3% expected annual volatility
  }

  private generateOptimizationRecommendations(current: { [symbol: string]: number }, recommended: { [symbol: string]: number }): string[] {
    const recommendations = [];
    
    Object.keys(recommended).forEach(symbol => {
      const currentWeight = current[symbol] || 0;
      const recommendedWeight = recommended[symbol];
      const difference = recommendedWeight - currentWeight;
      
      if (Math.abs(difference) > 5) { // 5% threshold
        if (difference > 0) {
          recommendations.push(`Consider increasing ${symbol} allocation by ${difference.toFixed(1)}%`);
        } else {
          recommendations.push(`Consider reducing ${symbol} allocation by ${Math.abs(difference).toFixed(1)}%`);
        }
      }
    });
    
    if (recommendations.length === 0) {
      recommendations.push('Current allocation is well-balanced');
    }
    
    return recommendations;
  }
}

export const aiService = new AIService();
