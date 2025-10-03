import { Portfolio } from '../models/Portfolio';
import { StockDataService } from './StockDataService';

export class PortfolioPriceUpdater {
  private readonly stockDataService = new StockDataService();

  // Update prices for all portfolios
  async updateAllPortfolioPrices(): Promise<void> {
    try {
      const portfolios = await Portfolio.find({}).populate('userId');

      for (const portfolio of portfolios) {
        await this.updatePortfolioPrices(portfolio);
      }

      console.log(`✅ Updated prices for ${portfolios.length} portfolios`);
    } catch (error) {
      console.error('Error updating all portfolio prices:', error);
    }
  }

  // Update prices for a specific portfolio
  async updatePortfolioPrices(portfolio: any): Promise<void> {
    try {
      const symbols = portfolio.holdings.map((h: any) => h.symbol);
      const stockDataMap = new Map();

      // Fetch current prices for all holdings
      for (const symbol of symbols) {
        try {
          const stockData = await this.stockDataService.getStockData(symbol);
          if (stockData) {
            stockDataMap.set(symbol, stockData);
          }
        } catch (error) {
          console.warn(`Failed to fetch data for ${symbol}:`, error);
        }
      }

      // Update prices and calculate values
      for (const holding of portfolio.holdings) {
        const currentData = stockDataMap.get(holding.symbol);
        if (currentData) {
          holding.currentPrice = currentData.price;
          holding.marketValue = holding.quantity * currentData.price;
          holding.gainLoss = holding.marketValue - (holding.averagePrice * holding.quantity);
          holding.gainLossPercent = holding.averagePrice > 0 ?
            (holding.gainLoss / (holding.averagePrice * holding.quantity)) * 100 : 0;
        }
      }

      // Recalculate portfolio totals
      portfolio.calculateTotalValue();
      portfolio.calculateGainLoss();

      await portfolio.save();
    } catch (error) {
      console.error(`Error updating portfolio prices for ${portfolio.userId}:`, error);
    }
  }

  // Update price for a specific holding
  async updateHoldingPrice(portfolioId: string, symbol: string): Promise<void> {
    try {
      const portfolio = await Portfolio.findById(portfolioId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      const holding = portfolio.holdings.find((h: any) => h.symbol === symbol);
      if (!holding) {
        throw new Error(`Holding ${symbol} not found in portfolio`);
      }

      const stockData = await this.stockDataService.getStockData(symbol);
      if (!stockData) {
        throw new Error(`Stock data not available for ${symbol}`);
      }

      holding.currentPrice = stockData.price;
      holding.marketValue = holding.quantity * stockData.price;
      holding.gainLoss = holding.marketValue - (holding.averagePrice * holding.quantity);
      holding.gainLossPercent = holding.averagePrice > 0 ?
        (holding.gainLoss / (holding.averagePrice * holding.quantity)) * 100 : 0;

      portfolio.calculateTotalValue();
      portfolio.calculateGainLoss();

      await portfolio.save();
    } catch (error) {
      console.error(`Error updating holding price for ${symbol}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const portfolioPriceUpdater = new PortfolioPriceUpdater();
