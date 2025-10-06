import { Types } from 'mongoose';

// Core Types for PlusAlpha Backend

export interface WatchlistItem {
  symbol: string;
  addedAt: Date;
  notes?: string;
}

export interface User {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals: string[];
  portfolio?: Types.ObjectId;
  watchlist: WatchlistItem[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface Portfolio {
  userId: Types.ObjectId;
  holdings: Holding[];
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Holding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  purchaseDate: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: {
    priceAlerts: boolean;
    portfolioUpdates: boolean;
    marketNews: boolean;
  };
  defaultCurrency: string;
  timezone: string;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  eps: number;
  dividend: number;
  high52Week: number;
  low52Week: number;
  lastUpdated: Date;
}

export interface AnalystRatings {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  total: number;
  bullishPercent: number;
  consensus: 'BUY' | 'SELL' | 'HOLD';
}

export interface ComprehensiveFinancialData {
  // Valuation metrics
  pe: number | null;
  eps: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  forwardPE: number | null;
  forwardEPS: number | null;
  beta: number | null;
  // Financial health
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  totalCash: number | null;
  freeCashFlow: number | null;
  roa: number | null;
  roe: number | null;
  // Dividends
  dividendRate: number | null;
  dividendYield: number | null;
  dividendPayoutRatio: number | null;
  // Analyst data
  analystRatings: AnalystRatings | null;
  // Company info
  sector: string | null;
  industry: string | null;
  ceo: string | null;
  employees: number | null;
  headquarters: string | null;
  businessSummary: string | null;
}

export interface MarketData {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'hold';
  strength: number; // 0-100
}

export interface AIInsight {
  _id: string;
  userId?: string;
  symbol: string;
  type: 'trading_signal' | 'market_analysis' | 'risk_assessment' | 'portfolio_optimization';
  title: string;
  description: string;
  confidence: number; // 0-100
  action: 'buy' | 'sell' | 'hold' | 'watch';
  reasoning: string[];
  technicalIndicators: TechnicalIndicator[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface TradingSignal {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  priceTarget: number;
  stopLoss: number;
  reasoning: string[];
  technicalAnalysis: TechnicalIndicator[];
  fundamentalAnalysis: {
    pe: number;
    eps: number;
    revenue: number;
    growth: number;
  };
  createdAt: Date;
}

export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
}

export interface RiskAssessment {
  portfolioRisk: number; // 0-100
  diversificationScore: number; // 0-100
  volatilityScore: number; // 0-100
  recommendations: string[];
  riskFactors: RiskFactor[];
}

export interface PortfolioOptimization {
  currentAllocation: { [symbol: string]: number };
  recommendedAllocation: { [symbol: string]: number };
  expectedReturn: number;
  expectedRisk: number;
  sharpeRatio: number;
  recommendations: string[];
}

export interface MarketNews {
  _id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  symbols: string[];
  impact: 'low' | 'medium' | 'high';
}

export interface Watchlist {
  _id: string;
  userId: string;
  name: string;
  symbols: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceAlert {
  _id: string;
  userId: string;
  symbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  isActive: boolean;
  triggeredAt?: Date;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// WebSocket Message Types
export interface WSMessage {
  type: 'price_update' | 'insight_update' | 'alert' | 'error' | 'connection' | 'pong' | 'subscription_confirmed' | 'unsubscription_confirmed';
  data: any;
  timestamp: Date;
}

export interface PriceUpdateMessage extends WSMessage {
  type: 'price_update';
  data: {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
  };
}

export interface InsightUpdateMessage extends WSMessage {
  type: 'insight_update';
  data: AIInsight;
}

// Request/Response DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface CreatePortfolioRequest {
  holdings: Omit<Holding, 'currentPrice' | 'marketValue' | 'gainLoss' | 'gainLossPercent'>[];
}

export interface UpdatePortfolioRequest {
  holdings: Partial<Holding>[];
}

export interface CreateInsightRequest {
  symbol: string;
  type: AIInsight['type'];
  customPrompt?: string;
}

export interface SearchStocksRequest {
  query: string;
  limit?: number;
}

export interface GetMarketDataRequest {
  symbol: string;
  interval: '1min' | '5min' | '15min' | '30min' | '1hour' | '1day';
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max';
}
