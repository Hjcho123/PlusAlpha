import mongoose, { Schema, Document, Types } from 'mongoose';
import { Portfolio as IPortfolio, Holding } from '../types';

export interface PortfolioDocument extends IPortfolio, Document {
  calculateTotalValue(): void;
  calculateGainLoss(): void;
}

const HoldingSchema = new Schema<Holding>({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  averagePrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  marketValue: {
    type: Number,
    default: 0,
    min: 0
  },
  gainLoss: {
    type: Number,
    default: 0
  },
  gainLossPercent: {
    type: Number,
    default: 0
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { _id: false });

const PortfolioSchema = new Schema<PortfolioDocument>({
  userId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  holdings: [HoldingSchema],
  totalValue: {
    type: Number,
    default: 0,
    min: 0
  },
  totalGainLoss: {
    type: Number,
    default: 0
  },
  totalGainLossPercent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
// Indexes for better performance (userId already has unique: true)
PortfolioSchema.index({ 'holdings.symbol': 1 });
PortfolioSchema.index({ updatedAt: -1 });

// Virtual for portfolio summary
PortfolioSchema.virtual('summary').get(function() {
  const totalInvested = this.holdings.reduce((sum, holding) => 
    sum + (holding.averagePrice * holding.quantity), 0
  );
  
  return {
    totalInvested,
    totalValue: this.totalValue,
    totalGainLoss: this.totalGainLoss,
    totalGainLossPercent: this.totalGainLossPercent,
    holdingsCount: this.holdings.length
  };
});

  // Method to calculate total portfolio value
  PortfolioSchema.methods.calculateTotalValue = function(): void {
    this.totalValue = this.holdings.reduce((sum, holding) =>
      sum + holding.marketValue, 0
    );
  };

  // Method to calculate gain/loss
  PortfolioSchema.methods.calculateGainLoss = function(): void {
    const totalInvested = this.holdings.reduce((sum, holding) =>
      sum + (holding.averagePrice * holding.quantity), 0
    );

    this.totalGainLoss = this.totalValue - totalInvested;
    this.totalGainLossPercent = totalInvested > 0 ?
      (this.totalGainLoss / totalInvested) * 100 : 0;
  };

// Pre-save middleware to update calculations
PortfolioSchema.pre('save', async function(next) {
  if (this.isModified('holdings')) {
    // Update individual holding calculations
    for (const holding of this.holdings) {
      holding.marketValue = holding.currentPrice * holding.quantity;
      holding.gainLoss = holding.marketValue - (holding.averagePrice * holding.quantity);
      holding.gainLossPercent = holding.averagePrice > 0 ? 
        (holding.gainLoss / (holding.averagePrice * holding.quantity)) * 100 : 0;
    }
    
    // Update portfolio totals
    this.calculateTotalValue();
    this.calculateGainLoss();
  }
  
  next();
});

export const Portfolio = mongoose.model<PortfolioDocument>('Portfolio', PortfolioSchema);
