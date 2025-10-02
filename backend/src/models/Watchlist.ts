import mongoose, { Schema, Document } from 'mongoose';
import { Watchlist as IWatchlist } from '../types';

export interface WatchlistDocument extends IWatchlist, Document {}

const WatchlistSchema = new Schema<WatchlistDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  symbols: [{
    type: String,
    uppercase: true,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
WatchlistSchema.index({ userId: 1 });
WatchlistSchema.index({ userId: 1, name: 1 }, { unique: true });
WatchlistSchema.index({ symbols: 1 });

// Virtual for watchlist size
WatchlistSchema.virtual('size').get(function() {
  return this.symbols.length;
});

// Method to add symbol to watchlist
WatchlistSchema.methods.addSymbol = function(symbol: string): boolean {
  const upperSymbol = symbol.toUpperCase();
  if (!this.symbols.includes(upperSymbol)) {
    this.symbols.push(upperSymbol);
    return true;
  }
  return false;
};

// Method to remove symbol from watchlist
WatchlistSchema.methods.removeSymbol = function(symbol: string): boolean {
  const upperSymbol = symbol.toUpperCase();
  const index = this.symbols.indexOf(upperSymbol);
  if (index > -1) {
    this.symbols.splice(index, 1);
    return true;
  }
  return false;
};

// Method to check if symbol is in watchlist
WatchlistSchema.methods.hasSymbol = function(symbol: string): boolean {
  return this.symbols.includes(symbol.toUpperCase());
};

// Static method to get user watchlists
WatchlistSchema.statics.getUserWatchlists = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Static method to get default watchlist
WatchlistSchema.statics.getDefaultWatchlist = function(userId: string) {
  return this.findOne({ userId, name: 'Default' });
};

// Pre-save middleware to ensure symbols are unique
WatchlistSchema.pre('save', function(next) {
  // Remove duplicates and ensure uppercase
  this.symbols = [...new Set(this.symbols.map(s => s.toUpperCase()))];
  next();
});

export const Watchlist = mongoose.model<WatchlistDocument>('Watchlist', WatchlistSchema);
