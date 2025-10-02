import mongoose, { Schema, Document } from 'mongoose';
import { StockData, MarketData } from '../types';

export interface StockDataDocument extends StockData, Document {}

export interface MarketDataDocument extends MarketData, Document {}

// Stock Data Schema for current stock information
const StockDataSchema = new Schema<StockDataDocument>({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  change: {
    type: Number,
    required: true
  },
  changePercent: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    required: true,
    min: 0
  },
  marketCap: {
    type: Number,
    min: 0
  },
  pe: {
    type: Number,
    min: 0
  },
  eps: {
    type: Number
  },
  dividend: {
    type: Number,
    min: 0
  },
  high52Week: {
    type: Number,
    min: 0
  },
  low52Week: {
    type: Number,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Market Data Schema for historical price data
const MarketDataSchema = new Schema<MarketDataDocument>({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  open: {
    type: Number,
    required: true,
    min: 0
  },
  high: {
    type: Number,
    required: true,
    min: 0
  },
  low: {
    type: Number,
    required: true,
    min: 0
  },
  close: {
    type: Number,
    required: true,
    min: 0
  },
  volume: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for StockData
// Indexes for better performance (symbol already has unique: true)
StockDataSchema.index({ lastUpdated: -1 });
StockDataSchema.index({ price: -1 });
StockDataSchema.index({ changePercent: -1 });

// Indexes for MarketData
MarketDataSchema.index({ symbol: 1, timestamp: -1 });
MarketDataSchema.index({ timestamp: -1 });

// Compound index for efficient queries
MarketDataSchema.index({ symbol: 1, timestamp: 1 }, { unique: true });

// Virtual for price direction
StockDataSchema.virtual('direction').get(function() {
  return this.change >= 0 ? 'up' : 'down';
});

// Virtual for market cap category
StockDataSchema.virtual('marketCapCategory').get(function() {
  if (!this.marketCap) return 'unknown';
  
  if (this.marketCap >= 200000000000) return 'mega'; // $200B+
  if (this.marketCap >= 10000000000) return 'large'; // $10B+
  if (this.marketCap >= 2000000000) return 'mid'; // $2B+
  if (this.marketCap >= 300000000) return 'small'; // $300M+
  return 'micro'; // < $300M
});

// Static method to get top gainers
StockDataSchema.statics.getTopGainers = function(limit = 10) {
  return this.find({ changePercent: { $gt: 0 } })
    .sort({ changePercent: -1 })
    .limit(limit);
};

// Static method to get top losers
StockDataSchema.statics.getTopLosers = function(limit = 10) {
  return this.find({ changePercent: { $lt: 0 } })
    .sort({ changePercent: 1 })
    .limit(limit);
};

// Static method to get most active
StockDataSchema.statics.getMostActive = function(limit = 10) {
  return this.find()
    .sort({ volume: -1 })
    .limit(limit);
};

// Static method to search stocks
StockDataSchema.statics.searchStocks = function(query: string, limit = 20) {
  const regex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { symbol: regex },
      { name: regex }
    ]
  })
  .sort({ marketCap: -1 })
  .limit(limit);
};

// Static method to get market data for a symbol
MarketDataSchema.statics.getMarketData = function(symbol: string, startDate?: Date, endDate?: Date) {
  const query: any = { symbol: symbol.toUpperCase() };
  
  if (startDate && endDate) {
    query.timestamp = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).sort({ timestamp: 1 });
};

// Static method to get latest market data
MarketDataSchema.statics.getLatestMarketData = function(symbol: string) {
  return this.findOne({ symbol: symbol.toUpperCase() })
    .sort({ timestamp: -1 });
};

// Static method to clean old market data (keep only last 2 years)
MarketDataSchema.statics.cleanOldData = function() {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  return this.deleteMany({
    timestamp: { $lt: twoYearsAgo }
  });
};

export const StockData = mongoose.model<StockDataDocument>('StockData', StockDataSchema);
export const MarketData = mongoose.model<MarketDataDocument>('MarketData', MarketDataSchema);
