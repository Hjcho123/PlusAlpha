import mongoose, { Schema, Document } from 'mongoose';
import { PriceAlert as IPriceAlert } from '../types';

export interface PriceAlertDocument extends IPriceAlert, Document {}

const PriceAlertSchema = new Schema<PriceAlertDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  condition: {
    type: String,
    enum: ['above', 'below'],
    required: true
  },
  targetPrice: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  triggeredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
PriceAlertSchema.index({ userId: 1 });
PriceAlertSchema.index({ symbol: 1 });
PriceAlertSchema.index({ isActive: 1 });
PriceAlertSchema.index({ userId: 1, symbol: 1 });
PriceAlertSchema.index({ triggeredAt: 1 });

// Virtual for alert status
PriceAlertSchema.virtual('status').get(function() {
  if (this.triggeredAt) return 'triggered';
  if (!this.isActive) return 'inactive';
  return 'active';
});

// Method to check if alert should trigger
PriceAlertSchema.methods.shouldTrigger = function(currentPrice: number): boolean {
  if (!this.isActive || this.triggeredAt) return false;
  
  if (this.condition === 'above') {
    return currentPrice >= this.targetPrice;
  } else {
    return currentPrice <= this.targetPrice;
  }
};

// Method to trigger alert
PriceAlertSchema.methods.trigger = function(): void {
  this.isActive = false;
  this.triggeredAt = new Date();
};

// Static method to get active alerts for symbol
PriceAlertSchema.statics.getActiveAlertsForSymbol = function(symbol: string) {
  return this.find({
    symbol: symbol.toUpperCase(),
    isActive: true,
    triggeredAt: null
  });
};

// Static method to get user alerts
PriceAlertSchema.statics.getUserAlerts = function(userId: string, activeOnly = false) {
  const query: any = { userId };
  if (activeOnly) {
    query.isActive = true;
    query.triggeredAt = null;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to check and trigger alerts
PriceAlertSchema.statics.checkAlerts = async function(symbol: string, currentPrice: number) {
  const alerts = await this.getActiveAlertsForSymbol(symbol);
  const triggeredAlerts = [];
  
  for (const alert of alerts) {
    if (alert.shouldTrigger(currentPrice)) {
      alert.trigger();
      await alert.save();
      triggeredAlerts.push(alert);
    }
  }
  
  return triggeredAlerts;
};

// Static method to clean old triggered alerts (older than 30 days)
PriceAlertSchema.statics.cleanOldAlerts = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.deleteMany({
    triggeredAt: { $lt: thirtyDaysAgo }
  });
};

export const PriceAlert = mongoose.model<PriceAlertDocument>('PriceAlert', PriceAlertSchema);
