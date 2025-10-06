import axios from 'axios';
import { AIInsight, TechnicalIndicator, TradingSignal, RiskAssessment, PortfolioOptimization } from '../types';
import { AIInsight as AIInsightModel } from '../models/AIInsight';
import { StockData } from '../models/StockData';
import { MarketData } from '../models/StockData';
import { Portfolio } from '../models/Portfolio';
import { stockDataService } from './StockDataService';
import { enhancedStockDataService } from './EnhancedStockDataService';

export class AIService {
  private get GEMINI_API_KEY(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  constructor() {
    // Don't log here to avoid premature initialization
    // Environment variables will be checked when actually needed
  }

  // Test if Gemini API is working - REMOVED TO PREVENT RATE LIMITING
  // This test was causing 429 errors by making unnecessary API calls
  private async testGeminiAPI(): Promise<boolean> {
    // Always return true and let the actual API call handle errors gracefully
    return !!this.GEMINI_API_KEY;
  }

  // Generate trading signal for a stock
  async generateTradingSignal(symbol: string, userId?: string): Promise<AIInsight | null> {
    try {
      console.log(`🔍 Starting generateTradingSignal for ${symbol}`);

      // Get current stock data from Yahoo Finance
      console.log(`📥 Fetching current stock data for ${symbol}...`);
      const stockData = await stockDataService.getStockData(symbol);

      if (!stockData) {
        console.error(`❌ No stock data available for ${symbol}`);
        throw new Error(`No stock data available for ${symbol}`);
      }

      console.log(`📊 Stock data retrieved:`, {
        symbol: stockData.symbol,
        price: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent,
        volume: stockData.volume
      });

      // Get enhanced data if available (optional)
      let enhancedData = null;
      try {
        enhancedData = await enhancedStockDataService.instance.getEnhancedStockData(symbol);
        console.log(`📈 Enhanced data:`, enhancedData ? 'Retrieved' : 'Not available');
      } catch (error: any) {
        console.log(`⚠️ Enhanced data not available for ${symbol}, using basic data`);
      }

      console.log(`🤖 Generating AI analysis...`);
      // Generate AI analysis using current stock data
      const analysis = await this.generateStockAnalysisWithCurrentData(symbol, stockData, enhancedData);
      console.log(`✅ Analysis generated:`, analysis ? 'Success' : 'Failed - analysis is null');

      if (!analysis) {
        console.error(`❌ Analysis generation returned null for ${symbol}`);
        return null;
      }

      console.log(`✅ Analysis generated:`, analysis.action, analysis.confidence);

      console.log(`💾 Creating AI insight document...`);
      // Create AI insight
      const insight = new AIInsightModel({
        userId,
        symbol: symbol.toUpperCase(),
        type: 'trading_signal',
        title: `AI Trading Signal: ${symbol}`,
        description: analysis.description,
        confidence: analysis.confidence,
        action: analysis.action,
        reasoning: analysis.reasoning,
        technicalIndicators: [] // No technical indicators without historical data
      });

      console.log(`💾 Saving insight to database...`);
      await insight.save();
      console.log(`✅ Insight saved successfully for ${symbol}`);
      return insight;
    } catch (error) {
      console.error(`❌ Error generating trading signal for ${symbol}:`, error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
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
    console.log(`🔍 generateEnhancedStockAnalysis - GEMINI_API_KEY exists:`, !!this.GEMINI_API_KEY);

    if (this.GEMINI_API_KEY) {
      console.log(`🤖 Using Gemini API for enhanced analysis of ${symbol}`);
      const result = await this.generateGeminiAnalysis(symbol, enhancedData, marketData, indicators);
      console.log(`✅ Gemini analysis result:`, result ? 'Success' : 'Failed');
      return result;
    } else {
      console.log(`📊 Using enhanced rule-based analysis for ${symbol}`);
      const result = this.performEnhancedRuleBasedAnalysis(symbol, enhancedData, marketData, indicators);
      console.log(`✅ Enhanced rule-based analysis result:`, result ? 'Success' : 'Failed');
      return result;
    }
  }

  // Generate AI analysis using current stock data only
  private async generateStockAnalysisWithCurrentData(symbol: string, stockData: any, enhancedData: any): Promise<any> {
    console.log(`🤖 Generating AI analysis with current data for ${symbol}`);

    // Check if Gemini API key is valid by testing it first
    if (this.GEMINI_API_KEY && await this.testGeminiAPI()) {
      console.log(`🤖 Using REAL Gemini API for current data analysis of ${symbol}`);
      return this.generateGeminiAnalysisWithCurrentData(symbol, stockData, enhancedData);
    } else {
      console.log(`❌ Gemini API not available or invalid - returning null to indicate no real AI`);
      return null; // Return null so the controller will return an error
    }
  }

  // Generate AI analysis using Gemini or rule-based fallback
  private async generateStockAnalysis(
    symbol: string,
    stockData: any,
    marketData: any[],
    indicators: TechnicalIndicator[]
  ): Promise<any> {
    if (this.GEMINI_API_KEY) {
      return this.generateGeminiAnalysis(symbol, stockData, marketData, indicators);
    } else {
      return this.performRuleBasedAnalysis(symbol, stockData, marketData, indicators);
    }
  }

  // Gemini AI analysis (primary method)
  private async generateGeminiAnalysis(
    symbol: string,
    stockData: any,
    marketData: any[],
    indicators: TechnicalIndicator[]
  ): Promise<any> {
    const prompt = `
Analyze the following stock data and provide a trading recommendation:

Stock: ${symbol}
Current Price: $${stockData.price}
Change: ${stockData.change} (${stockData.changePercent}%)
Volume: ${stockData.volume}
Market Cap: $${stockData.marketCap}
PE Ratio: ${stockData.pe}

Technical Indicators:
${indicators.map(ind => `- ${ind.name}: ${ind.value} (${ind.signal})`).join('\n')}

Recent Price Trend (last 10 days):
${marketData.slice(-10).map(d => `${d.timestamp.toISOString().split('T')[0]}: $${d.close}`).join('\n')}

Provide:
1. A brief analysis (2-3 sentences)
2. Trading recommendation (buy/sell/hold/watch)
3. Confidence level (0-100)
4. Key reasoning points (3-5 bullet points)

Format as JSON:
{
  "description": "Brief analysis...",
  "action": "buy|sell|hold|watch",
  "confidence": 85,
  "reasoning": ["Point 1", "Point 2", "Point 3"]
}
`;

    try {
      console.log(`🤖 Using Gemini API for ${symbol} analysis`);
      console.log(`🔑 GEMINI_API_KEY available:`, !!this.GEMINI_API_KEY);

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${this.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 600000 // 10 minute timeout for complex analysis
        }
      );

      console.log(`📡 Gemini response status:`, response.status);

      const content = response.data.candidates[0]?.content?.parts[0]?.text;
      console.log(`💬 Gemini content length:`, content?.length || 0);

      if (!content) {
        console.error(`❌ No content in Gemini response for ${symbol}`);
        throw new Error('No response from Gemini');
      }

      console.log(`🔄 Parsing JSON response...`);
      const result = JSON.parse(content);
      console.log(`✅ Successfully parsed Gemini response for ${symbol}`);

      // Normalize action to lowercase to match database enum ['buy', 'sell', 'hold', 'watch']
      if (result.action) result.action = result.action.toLowerCase();

      return result;
    } catch (error) {
      console.error(`❌ Gemini API error for ${symbol}:`, error);
      console.error('Error details:', error.response?.data || error.message);
      // Fallback to rule-based analysis
      console.log(`🤖 Using rule-based analysis for ${symbol}`);
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

  // Gemini AI analysis with current data only
  private async generateGeminiAnalysisWithCurrentData(symbol: string, stockData: any, enhancedData: any): Promise<any> {
    const prompt = `
You are a Professional Portfolio Advisor AI. Analyze the stock data for ${symbol} and provide confident, actionable investment recommendations. Be decisive - most stocks should receive a clear BUY, SELL, or HOLD recommendation rather than WATCH, unless truly unpredictable.

Current Stock Data:
- Symbol: ${symbol}
- Current Price: $${stockData.price}
- Daily Change: ${stockData.changePercent > 0 ? '+' : ''}${stockData.changePercent}%
- 24h Volume: ${stockData.volume?.toLocaleString() || 'N/A'}
- Market Cap: $${stockData.marketCap?.toLocaleString() || 'N/A'}
- PE Ratio: ${stockData.pe || 'N/A'}

${enhancedData?.fundamentalData ? `
Company Fundamentals:
- Sector: ${enhancedData.fundamentalData.sector || 'N/A'}
- Industry: ${enhancedData.fundamentalData.industry || 'N/A'}
- Beta (volatility): ${enhancedData.fundamentalData.beta || 'N/A'}
- Net Profit Margin: ${enhancedData.fundamentalData.profitMargin || 'N/A'}%
- Return on Equity: ${enhancedData.fundamentalData.returnOnEquity || 'N/A'}%
` : ''}

${enhancedData?.newsSentiment ? `
Market Sentiment Analysis:
- Overall News Sentiment: ${enhancedData.newsSentiment.sentiment || 'neutral'}
- Recent Articles: ${enhancedData.newsSentiment.newsCount || 0}
` : ''}

INSTRUCTIONS FOR PROFESSIONAL ANALYSIS:
- Be confident and decisive: Most analysis should recommend CLEAR action
- Higher confidence levels (75-95%) are normal for informed recommendations
- Use professional investment advisory language
- Focus on whether this is suitable for a diversified portfolio
- Consider both growth potential AND risk management
- Only use "watch" if the stock shows extreme uncertainty or upcoming catalysts

Provide your comprehensive investment analysis in this exact JSON format:
{
  "description": "2-3 sentence professional analysis explaining the investment case",
  "action": "buy|sell|hold|watch",
  "confidence": 85,
  "reasoning": [
    "Technical analysis supports [bullish/bearish/neutral] momentum",
    "Fundamental valuation indicates [attractive/fair/rich] entry point",
    "Risk assessment: [suitable/requires caution/high risk] for portfolio allocation"
  ]
}
`;

    try {
      console.log(`🤖 Using Gemini API for current data analysis of ${symbol}`);
      console.log(`🔑 GEMINI_API_KEY available:`, !!this.GEMINI_API_KEY);

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${this.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout for complex analysis
        }
      );

      const content = response.data.candidates[0]?.content?.parts[0]?.text;
      if (!content) throw new Error('No response from Gemini');

      // Strip markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json') && cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(7, -3).trim();
      } else if (cleanContent.startsWith('```') && cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(3, -3).trim();
      }

      console.log(`✅ Successfully parsed and cleaned Gemini response for ${symbol}`);
      const result = JSON.parse(cleanContent);

      // Normalize action to lowercase to match database enum ['buy', 'sell', 'hold', 'watch']
      if (result.action) result.action = result.action.toLowerCase();

      return result;
    } catch (error) {
      console.error(`❌ Gemini API error for ${symbol}:`, error);
      // Fallback to rule-based analysis
      console.log(`🤖 Using rule-based analysis for ${symbol}`);
      return this.performRuleBasedAnalysisWithCurrentData(symbol, stockData, enhancedData);
    }
  }

  // Rule-based analysis with current data only - Expanded and more comprehensive
  private performRuleBasedAnalysisWithCurrentData(symbol: string, stockData: any, enhancedData: any): any {
    let score = 0;
    const reasoning: string[] = [];
    const analysis: any = {
      technical: [],
      fundamental: [],
      market: [],
      sentiment: []
    };

    // === TECHNICAL ANALYSIS ===
    // Price momentum (40% weight)
    if (stockData.changePercent > 5) {
      score += 32;
      reasoning.push(`Strong bullish momentum: +${stockData.changePercent.toFixed(2)}% daily gain`);
      analysis.technical.push('Bullish price momentum with significant daily gains');
    } else if (stockData.changePercent > 2) {
      score += 20;
      reasoning.push(`Positive momentum: +${stockData.changePercent.toFixed(2)}% today`);
      analysis.technical.push('Moderate bullish momentum');
    } else if (stockData.changePercent < -5) {
      score -= 32;
      reasoning.push(`Strong bearish momentum: ${stockData.changePercent.toFixed(2)}% daily decline`);
      analysis.technical.push('Bearish price momentum with significant daily losses');
    } else if (stockData.changePercent < -2) {
      score -= 20;
      reasoning.push(`Negative momentum: ${stockData.changePercent.toFixed(2)}% today`);
      analysis.technical.push('Moderate bearish momentum');
    } else {
      analysis.technical.push('Price movement within normal range');
    }

    // Volume analysis (25% weight)
    if (stockData.volume > 5000000) {
      score += 20;
      reasoning.push(`Exceptionally high volume: ${this.formatVolume(stockData.volume)} shares - strong institutional interest`);
      analysis.technical.push('Very high trading volume indicates strong market participation');
    } else if (stockData.volume > 2000000) {
      score += 15;
      reasoning.push(`High trading volume: ${this.formatVolume(stockData.volume)} shares`);
      analysis.technical.push('Above-average trading volume');
    } else if (stockData.volume < 500000) {
      score -= 5;
      reasoning.push(`Low trading volume: ${this.formatVolume(stockData.volume)} shares`);
      analysis.technical.push('Below-average trading volume may indicate lack of interest');
    } else {
      analysis.technical.push('Normal trading volume levels');
    }

    // === FUNDAMENTAL ANALYSIS ===
    // PE ratio analysis (35% weight)
    if (stockData.pe && stockData.pe > 0) {
      if (stockData.pe < 10) {
        score += 28;
        reasoning.push(`Strong value opportunity: PE ratio of ${stockData.pe} suggests significant undervaluation`);
        analysis.fundamental.push(`Exceptionally low PE ratio (${stockData.pe}) indicates potential strong value`);
      } else if (stockData.pe < 15) {
        score += 21;
        reasoning.push(`Attractive valuation: PE ratio of ${stockData.pe}`);
        analysis.fundamental.push(`Low PE ratio (${stockData.pe}) suggests good value proposition`);
      } else if (stockData.pe > 40) {
        score -= 28;
        reasoning.push(`High valuation concerns: PE ratio of ${stockData.pe} may indicate overvaluation`);
        analysis.fundamental.push(`High PE ratio (${stockData.pe}) suggests premium valuation`);
      } else if (stockData.pe > 25) {
        score -= 21;
        reasoning.push(`Elevated PE ratio: ${stockData.pe} suggests cautious approach`);
        analysis.fundamental.push(`Above-average PE ratio (${stockData.pe}) indicates growth expectations priced in`);
      } else {
        analysis.fundamental.push(`Moderate PE ratio (${stockData.pe}) in line with industry standards`);
      }
    } else {
      analysis.fundamental.push('PE ratio not available for valuation analysis');
    }

    // === MARKET ANALYSIS ===
    // Market cap analysis (20% weight)
    if (stockData.marketCap > 1000000000000) { // > $1T
      score += 16;
      reasoning.push(`Mega-cap stability: $${this.formatMarketCap(stockData.marketCap)} market cap provides institutional-grade stability`);
      analysis.market.push('Mega-cap company with exceptional stability and liquidity');
    } else if (stockData.marketCap > 100000000000) { // > $100B
      score += 12;
      reasoning.push(`Large-cap reliability: $${this.formatMarketCap(stockData.marketCap)} market cap`);
      analysis.market.push('Large-cap company with strong market position');
    } else if (stockData.marketCap > 10000000000) { // > $10B
      score += 8;
      reasoning.push(`Mid-cap growth potential: $${this.formatMarketCap(stockData.marketCap)} market cap`);
      analysis.market.push('Mid-cap company with balanced risk-reward profile');
    } else if (stockData.marketCap < 1000000000) { // < $1B
      score -= 16;
      reasoning.push(`Micro-cap risk: $${this.formatMarketCap(stockData.marketCap)} market cap carries higher volatility`);
      analysis.market.push('Small/micro-cap stock with higher risk and volatility');
    } else {
      score -= 8;
      reasoning.push(`Small-cap concerns: $${this.formatMarketCap(stockData.marketCap)} market cap`);
      analysis.market.push('Small-cap company with growth potential but higher risk');
    }

    // === ENHANCED DATA ANALYSIS ===
    // Advanced fundamental analysis from Alpha Vantage/Finnhub (25% weight total)
    if (enhancedData?.fundamentalData) {
      const fd = enhancedData.fundamentalData;
      let fundamentalScore = 0;

      if (fd.profitMargin !== undefined) {
        if (fd.profitMargin > 20) {
          fundamentalScore += 6;
          reasoning.push(`Excellent profitability: ${fd.profitMargin}% profit margin`);
          analysis.fundamental.push(`Strong profit margin (${fd.profitMargin}%) indicates operational excellence`);
        } else if (fd.profitMargin > 10) {
          fundamentalScore += 4;
          analysis.fundamental.push(`Healthy profit margin (${fd.profitMargin}%)`);
        } else if (fd.profitMargin < 2) {
          fundamentalScore -= 6;
          reasoning.push(`Profitability concerns: ${fd.profitMargin}% profit margin is very low`);
          analysis.fundamental.push(`Low profit margin (${fd.profitMargin}%) raises profitability concerns`);
        }
      }

      if (fd.returnOnEquity !== undefined) {
        if (fd.returnOnEquity > 20) {
          fundamentalScore += 6;
          reasoning.push(`Outstanding ROE: ${fd.returnOnEquity}% shows exceptional management efficiency`);
          analysis.fundamental.push(`Excellent ROE (${fd.returnOnEquity}%) demonstrates strong management performance`);
        } else if (fd.returnOnEquity > 12) {
          fundamentalScore += 4;
          analysis.fundamental.push(`Strong ROE (${fd.returnOnEquity}%)`);
        } else if (fd.returnOnEquity < 5) {
          fundamentalScore -= 6;
          reasoning.push(`Weak ROE: ${fd.returnOnEquity}% indicates inefficient capital utilization`);
          analysis.fundamental.push(`Low ROE (${fd.returnOnEquity}%) suggests capital inefficiency`);
        }
      }

      if (fd.beta !== undefined) {
        if (fd.beta < 0.8) {
          fundamentalScore += 3;
          reasoning.push(`Defensive characteristics: Low beta of ${fd.beta} indicates relative stability`);
          analysis.market.push(`Low beta (${fd.beta}) suggests defensive qualities against market volatility`);
        } else if (fd.beta > 1.5) {
          fundamentalScore -= 3;
          reasoning.push(`High volatility: Beta of ${fd.beta} indicates increased market sensitivity`);
          analysis.market.push(`High beta (${fd.beta}) indicates above-average volatility`);
        }
      }

      score += fundamentalScore;
    }

    // News sentiment analysis (10% weight)
    if (enhancedData?.newsSentiment) {
      const ns = enhancedData.newsSentiment;

      if (ns.sentiment === 'positive') {
        score += 8;
        reasoning.push(`Positive market sentiment: ${ns.newsCount || 0} recent articles show favorable coverage`);
        analysis.sentiment.push(`Positive news sentiment with ${ns.newsCount || 0} recent articles supporting bullish outlook`);
      } else if (ns.sentiment === 'negative') {
        score -= 8;
        reasoning.push(`Negative market sentiment: ${ns.newsCount || 0} recent articles suggest caution`);
        analysis.sentiment.push(`Negative news sentiment with ${ns.newsCount || 0} recent articles indicating bearish pressure`);
      } else {
        analysis.sentiment.push(`Neutral news sentiment with ${ns.newsCount || 0} articles providing balanced coverage`);
      }
    }

    // === DETERMINE FINAL ACTION AND CONFIDENCE ===
    // Professional portfolio advisor approach: Be confident and decisive
    let action: 'buy' | 'sell' | 'hold' | 'watch';
    let confidence: number;
    let riskLevel: 'low' | 'medium' | 'high';

    // Professional portfolio advisor approach: Be decisive and confident
    if (score >= 35) {
      if (score >= 65) {
        action = 'buy';
        confidence = Math.min(96, 85 + ((score - 65) * 0.15));
        riskLevel = score > 75 ? 'low' : 'medium';
        reasoning.unshift('BUY: Compelling fundamentals and technical alignment present clear opportunity');
      } else {
        action = 'buy';
        confidence = Math.min(88, 72 + ((score - 35) * 0.25));
        riskLevel = 'medium';
        reasoning.unshift('BUY: Well-positioned with solid growth prospects and attractive valuation');
      }
    } else if (score <= -35) {
      if (score <= -65) {
        action = 'sell';
        confidence = Math.min(94, 85 + (Math.abs(score + 65) * 0.15));
        riskLevel = score < -75 ? 'low' : 'medium';
        reasoning.unshift('SELL: Significant deterioration in fundamentals and technicals warrants position reduction');
      } else {
        action = 'sell';
        confidence = Math.min(86, 72 + (Math.abs(score + 35) * 0.25));
        riskLevel = 'medium';
        reasoning.unshift('SELL/REDUCE: Elevated risk profile requires position adjustment');
      }
    } else {
      // Most scenarios should lean toward buy/hold/sell rather than watch
      if (Math.abs(score) < 20) {
        action = 'hold';
        confidence = Math.max(70, 78 + Math.abs(score) * 0.1);
        riskLevel = score > 5 ? 'low' : score < -5 ? 'medium' : 'medium';
        reasoning.unshift('HOLD: Current position shows balance between opportunity and risk');
      } else if (score > 25 && score < 35) {
        action = 'buy';
        confidence = Math.min(85, 75 + ((score - 25) * 0.3));
        riskLevel = 'medium';
        reasoning.unshift('BUY: Emerging positive momentum warrants position consideration');
      } else if (score < -25 && score > -35) {
        action = 'sell';
        confidence = Math.min(85, 75 + (Math.abs(score + 25) * 0.3));
        riskLevel = 'medium';
        reasoning.unshift('SELL: Growing concerns suggest reduced exposure appropriate');
      } else if (Math.abs(score) <= 10) {
        action = 'hold';
        confidence = 75;
        riskLevel = 'medium';
        reasoning.unshift('HOLD: Maintain current allocation while monitoring developments');
      } else {
        // Reserved for truly unusual cases
        action = 'watch';
        confidence = Math.max(65, 78 - Math.abs(score) * 0.05);
        riskLevel = 'medium';
        reasoning.unshift('MONITOR: Await clearer signals before making allocation changes');
      }
    }

    // Generate comprehensive description
    const description = this.generateComprehensiveDescription(symbol, action, confidence, score, stockData, enhancedData, analysis, riskLevel);

    return {
      description,
      action,
      confidence: Math.max(30, Math.min(99, Math.round(confidence))),
      reasoning: reasoning.length > 0 ? reasoning : ['Analysis based on available market data', 'Recommend monitoring for additional signals', 'Consider overall market conditions'],
      analysis: analysis,
      riskLevel: riskLevel,
      score: Math.round(score)
    };
  }

  // Generate description based on current data analysis
  private generateCurrentDataDescription(symbol: string, action: string, score: number, stockData: any, enhancedData: any): string {
    const actionText = action.charAt(0).toUpperCase() + action.slice(1);

    if (action === 'buy') {
      let description = `${symbol} shows positive momentum with ${stockData.changePercent.toFixed(2)}% gain today and strong trading volume.`;

      if (stockData.pe && stockData.pe < 20) {
        description += ` Attractive valuation with PE ratio of ${stockData.pe}.`;
      }

      if (enhancedData?.fundamentalData?.profitMargin && enhancedData.fundamentalData.profitMargin > 10) {
        description += ` Strong fundamentals with ${enhancedData.fundamentalData.profitMargin}% profit margin.`;
      }

      description += ` Consider ${actionText.toLowerCase()} position.`;
      return description;
    } else if (action === 'sell') {
      let description = `${symbol} is showing weakness with ${stockData.changePercent.toFixed(2)}% decline today.`;

      if (stockData.pe && stockData.pe > 25) {
        description += ` Elevated PE ratio of ${stockData.pe} suggests potential overvaluation.`;
      }

      if (enhancedData?.newsSentiment?.sentiment === 'negative') {
        description += ` Negative news sentiment adds to bearish pressure.`;
      }

      description += ` Consider ${actionText.toLowerCase()}ing position to limit losses.`;
      return description;
    } else if (action === 'watch') {
      return `${symbol} shows mixed signals with current price at $${stockData.price}. ${actionText} for clearer direction before making investment decisions.`;
    } else {
      return `${symbol} appears stable at current levels with $${stockData.price}. ${actionText} current position while monitoring market conditions.`;
    }
  }

  // Fallback analysis when all AI services fail
  private getFallbackAnalysis(symbol: string): any {
    return {
      description: `Based on current market data, ${symbol} shows mixed signals. Consider monitoring price action and market conditions.`,
      action: 'hold',
      confidence: 50,
      reasoning: [
        'Limited data available for comprehensive analysis',
        'Mixed signals in current market conditions',
        'Recommend further research and monitoring',
        'Consider overall market volatility and external factors'
      ]
    };
  }

  // Generate market trend analysis
  private async generateMarketTrendAnalysis(stocksData: any[]): Promise<any> {
    if (this.GEMINI_API_KEY) {
      return this.generateGeminiMarketAnalysis(stocksData);
    } else {
      return this.generateFreeMarketAnalysis(stocksData);
    }
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
    } catch (error: any) {
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

  // Gemini market analysis (primary method)
  private async generateGeminiMarketAnalysis(stocksData: any[]): Promise<any> {
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
      console.log(`🤖 Using Gemini API for market analysis`);
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${this.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.candidates[0]?.content?.parts[0]?.text;
      if (!content) throw new Error('No response from Gemini');

      return JSON.parse(content);
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fallback to rule-based analysis
      console.log(`🤖 Using rule-based market analysis`);
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

  // Helper methods for formatting
  private formatVolume(volume: number): string {
    if (volume >= 1e9) {
      return `${(volume / 1e9).toFixed(1)}B`;
    } else if (volume >= 1e6) {
      return `${(volume / 1e6).toFixed(1)}M`;
    } else if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(1)}K`;
    } else {
      return volume.toString();
    }
  }

  private formatMarketCap(marketCap: number): string {
    if (marketCap >= 1e12) {
      return `${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `${(marketCap / 1e6).toFixed(2)}M`;
    } else if (marketCap >= 1e3) {
      return `${(marketCap / 1e3).toFixed(2)}K`;
    } else {
      return marketCap.toString();
    }
  }

  // Comprehensive description generator
  private generateComprehensiveDescription(
    symbol: string,
    action: string,
    confidence: number,
    score: number,
    stockData: any,
    enhancedData: any,
    analysis: any,
    riskLevel: 'low' | 'medium' | 'high'
  ): string {
    const actionText = action.charAt(0).toUpperCase() + action.slice(1);
    let description = '';

    if (action === 'buy') {
      description = `${symbol} demonstrates strong positive momentum with ${stockData.changePercent > 0 ? '+' : ''}${stockData.changePercent?.toFixed(2) || '0.00'}% daily performance. `;

      if (analysis.technical.length > 0) {
        description += `Technical indicators show ${analysis.technical[0].toLowerCase()}. `;
      }

      if (analysis.fundamental.length > 0) {
        description += `${analysis.fundamental[0]} `;
      }

      if (analysis.market.length > 0) {
        description += `${analysis.market[0]}. `;
      }

      description += `${actionText} with ${confidence}% confidence based on comprehensive analysis.`;

    } else if (action === 'sell') {
      description = `${symbol} exhibits concerning momentum with ${stockData.changePercent?.toFixed(2) || '0.00'}% daily performance. `;

      if (analysis.technical.length > 0) {
        description += `${analysis.technical[0]} signals caution. `;
      }

      if (analysis.fundamental.some((f: string) => f.toLowerCase().includes('high') || f.toLowerCase().includes('low') || f.toLowerCase().includes('concern'))) {
        description += 'Fundamental analysis reveals valuation concerns. ';
      }

      if (analysis.market.length > 0) {
        description += `${analysis.market[0]}. `;
      }

      description += `Consider ${actionText.toLowerCase()} to manage risk (Confidence: ${confidence}%).`;

    } else if (action === 'hold') {
      description = `${symbol} shows neutral to mixed signals at $${stockData.price?.toFixed(2) || 'N/A'}. `;

      if (analysis.technical.length > 0) {
        description += `${analysis.technical[0]}. `;
      }

      description += `Current position appears stable with no strong directional pressure. Hold and monitor for clearer signals (Confidence: ${confidence}%).`;

    } else { // watch
      description = `${symbol} displays mixed signals requiring further observation. `;

      if (stockData.volume > 2000000) {
        description += `High trading volume of ${this.formatVolume(stockData.volume)} shares indicates institutional interest. `;
      }

      if (analysis.technical.length > 0) {
        description += `${analysis.technical[0]}. `;
      }

      description += `Continue monitoring for confirmation of trend direction (Watch closely - Confidence: ${confidence}%).`;
    }

    // Add risk level summary
    const riskDescription = riskLevel === 'high' ? 'Higher risk' : riskLevel === 'medium' ? 'Moderate risk' : 'Conservative approach';
    description += `\n\nRisk Assessment: ${riskDescription}`;

    return description;
  }

  // AI Chat for follow-up questions about stocks
  async chatAboutStock(symbol: string, message: string, context?: any): Promise<any> {
    try {
      console.log(`💬 Chat request for ${symbol}: ${message}`);

      // Get current stock data for context
      const stockData = await stockDataService.getStockData(symbol);

      if (!stockData) {
        throw new Error(`Stock data not available for ${symbol}`);
      }

      // Get enhanced data if available
      let enhancedData = null;
      try {
        enhancedData = await enhancedStockDataService.instance.getEnhancedStockData(symbol);
      } catch (error) {
        console.warn(`Enhanced data not available for ${symbol} chat`);
      }

      // If Gemini is available and working, use it for chat
      if (this.GEMINI_API_KEY && await this.testGeminiAPI()) {
        console.log(`🤖 Using Gemini for chat response`);
        return this.generateGeminiChatResponse(symbol, message, stockData, enhancedData, context);
      } else {
        console.log(`📊 Using rule-based chat response`);
        return this.generateRuleBasedChatResponse(symbol, message, stockData, enhancedData, context);
      }
    } catch (error) {
      console.error('Chat about stock error:', error);
      return {
        response: this.getChatFallbackResponse(message),
        riskLevel: 'low',
        confidence: 70,
        timestamp: new Date()
      };
    }
  }

  // Gemini-powered chat response
  private async generateGeminiChatResponse(
    symbol: string,
    message: string,
    stockData: any,
    enhancedData: any,
    context?: any
  ): Promise<any> {
    const prompt = `
You are a financial AI assistant helping a user with questions about ${symbol}. Provide a helpful, accurate, and concise response.

Stock Data Context:
- Current Price: $${stockData.price}
- Daily Change: ${stockData.changePercent}%
- Volume: ${stockData.volume}
- Market Cap: $${this.formatMarketCap(stockData.marketCap) || 'N/A'}
- PE Ratio: ${stockData.pe || 'N/A'}

${enhancedData ? `
Additional Data:
- Sector: ${enhancedData.fundamentalData?.sector || 'N/A'}
- Profit Margin: ${enhancedData.fundamentalData?.profitMargin || 'N/A'}%
- ROE: ${enhancedData.fundamentalData?.returnOnEquity || 'N/A'}%
` : ''}

${context ? `Previous Analysis Context: ${JSON.stringify(context)}\n\n` : ''}

User Question: ${message}

Provide a clear, informative response focusing on the specific question. Keep responses concise but helpful.`;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${this.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const geminiResponse = response.data.candidates[0]?.content?.parts[0]?.text;

      return {
        response: geminiResponse || 'I\'m sorry, I couldn\'t generate a response to your question.',
        source: 'gemini',
        symbol,
        confidence: 85,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Gemini chat error:', error);
      return this.generateRuleBasedChatResponse(symbol, message, stockData, enhancedData, context);
    }
  }

  // Rule-based chat response
  private generateRuleBasedChatResponse(
    symbol: string,
    message: string,
    stockData: any,
    enhancedData: any,
    context?: any
  ): any {
    const messageLower = message.toLowerCase();
    let response = '';

    // Handle common question types
    if (messageLower.includes('price') || messageLower.includes('current')) {
      response = `${symbol} is currently trading at $${stockData.price?.toFixed(2)}, ` +
        `which is a ${stockData.changePercent > 0 ? '+' : ''}${stockData.changePercent?.toFixed(2)}% ` +
        `change from yesterday's close.`;
    } else if (messageLower.includes('volume') || messageLower.includes('trading')) {
      response = `${symbol} has traded ${this.formatVolume(stockData.volume) || 'N/A'} shares today, ` +
        `indicating ${stockData.volume > 5000000 ? 'strong' : stockData.volume > 2000000 ? 'moderate' : 'limited'} market participation.`;
    } else if (messageLower.includes('pe') || messageLower.includes('valuation')) {
      response = `The PE ratio for ${symbol} is ${stockData.pe || 'not available'}, ` +
        `suggesting ${stockData.pe < 15 ? 'potentially attractive valuation' : stockData.pe > 25 ? 'premium valuation' : 'fair valuation'} compared to industry averages.`;
    } else if (messageLower.includes('market cap') || messageLower.includes('size')) {
      const capText = this.formatMarketCap(stockData.marketCap);
      if (stockData.marketCap > 1000000000000) response = `${symbol} is a mega-cap company with a $${capText} market capitalization.`;
      else if (stockData.marketCap > 100000000000) response = `${symbol} is a large-cap company with a $${capText} market capitalization.`;
      else if (stockData.marketCap > 10000000000) response = `${symbol} is a mid-cap company with a $${capText} market capitalization.`;
      else response = `${symbol} is a small-cap company with a $${capText} market capitalization.`;
    } else if (messageLower.includes('why') && context) {
      // Use the reasoning from previous analysis
      response = `Based on the recent analysis: ${context.reasoning?.[0] || 'The analysis considered multiple technical and fundamental factors.'}`;
    } else {
      response = `I'd be happy to help you understand more about ${symbol}. You asked: "${message}". Based on current market data, the stock is trading at $${stockData.price?.toFixed(2)} with a ${stockData.changePercent > 0 ? '+' : ''}${stockData.changePercent?.toFixed(2)}% daily change. Could you clarify what specific aspect you'd like to know more about?`;
    }

    return {
      response,
      source: 'rule-based',
      symbol,
      confidence: 75,
      timestamp: new Date()
    };
  }

  // Fallback chat response
  private getChatFallbackResponse(message: string): string {
    return `Thank you for your question about "${message}". While I don't have specific data available right now, I'd recommend checking real-time market data, company financial reports, or consulting with a financial advisor for personalized investment guidance.`;
  }
}

export const aiService = new AIService();
