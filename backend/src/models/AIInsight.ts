import mongoose, { Schema, Document } from 'mongoose';
import { AIInsight, TechnicalIndicator } from '../types';

export interface AIInsightDocument extends AIInsight, Document {}

const TechnicalIndicatorSchema = new Schema<TechnicalIndicator>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: Number,
    required: true
  },
  signal: {
    type: String,
    enum: ['buy', 'sell', 'hold'],
    required: true
  },
  strength: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, { _id: false });

const AIInsightSchema = new Schema<AIInsightDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for general market insights
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['trading_signal', 'market_analysis', 'risk_assessment', 'portfolio_optimization'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  action: {
    type: String,
    enum: ['buy', 'sell', 'hold', 'watch'],
    required: true
  },
  reasoning: [{
    type: String,
    trim: true,
    maxlength: 500
  }],
  technicalIndicators: [TechnicalIndicatorSchema],
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
AIInsightSchema.index({ symbol: 1, type: 1 });
AIInsightSchema.index({ userId: 1, createdAt: -1 });
AIInsightSchema.index({ createdAt: -1 });
AIInsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Compound index for user-specific insights
AIInsightSchema.index({ userId: 1, symbol: 1, type: 1 });

// Virtual for insight age
AIInsightSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for insight validity
AIInsightSchema.virtual('isValid').get(function() {
  if (!this.expiresAt) return true;
  return this.expiresAt > new Date();
});

// Pre-save middleware to set default expiration
AIInsightSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // Set expiration based on insight type
    const expirationHours = {
      'trading_signal': 24,      // Trading signals expire in 24 hours
      'market_analysis': 168,    // Market analysis expires in 1 week
      'risk_assessment': 720,    // Risk assessment expires in 1 month
      'portfolio_optimization': 168 // Portfolio optimization expires in 1 week
    };
    
    const hours = expirationHours[this.type] || 24;
    this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  }
  next();
});

// Static method to get insights by symbol and type
AIInsightSchema.statics.getInsightsBySymbol = function(symbol: string, type?: string) {
  const query: any = { symbol: symbol.toUpperCase() };
  if (type) query.type = type;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(10);
};

// Static method to get user insights
AIInsightSchema.statics.getUserInsights = function(userId: string, limit = 20) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to clean expired insights
AIInsightSchema.statics.cleanExpiredInsights = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

export const AIInsight = mongoose.model<AIInsightDocument>('AIInsight', AIInsightSchema);
