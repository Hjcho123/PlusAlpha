import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User as IUser, UserPreferences, WatchlistItem } from '../types';

export interface IUserDocument extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals: string[];
  portfolio?: mongoose.Types.ObjectId;
  watchlist: WatchlistItem[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserPreferencesSchema = new Schema<UserPreferences>({
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  notifications: {
    priceAlerts: { type: Boolean, default: true },
    portfolioUpdates: { type: Boolean, default: true },
    marketNews: { type: Boolean, default: false }
  },
  defaultCurrency: { type: String, default: 'USD' },
  timezone: { type: String, default: 'UTC' }
}, { _id: false });

const UserSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  riskTolerance: {
    type: String,
    enum: ['conservative', 'moderate', 'aggressive'],
    default: 'moderate'
  },
  investmentGoals: [{
    type: String,
    trim: true
  }],
  portfolio: {
    type: Schema.Types.ObjectId,
    ref: 'Portfolio',
    default: null
  },
  watchlist: [{
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 200
    }
  }],
  preferences: {
    type: UserPreferencesSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: any) {
      if (ret.password) {
        delete ret.password;
      }
      return ret;
    }
  }
});

// Index for faster queries (email already has unique: true)
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
