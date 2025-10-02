// PlusAlpha API Service
// This file provides easy-to-use functions to connect your frontend to the backend

const API_BASE_URL = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001/ws';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
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
  lastUpdated: string;
}

export interface AIInsight {
  _id: string;
  symbol: string;
  type: 'trading_signal' | 'market_analysis' | 'risk_assessment' | 'portfolio_optimization';
  title: string;
  description: string;
  confidence: number;
  action: 'buy' | 'sell' | 'hold' | 'watch';
  reasoning: string[];
  technicalIndicators: any[];
  createdAt: string;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals: string[];
  preferences: any;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Helper function to get auth headers
const getAuthHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data;
};

// Stock Data API
export const stockAPI = {
  // Get stock data by symbol
  getStockData: async (symbol: string): Promise<StockData> => {
    const response = await fetch(`${API_BASE_URL}/stocks/${symbol}`);
    const result = await handleResponse<StockData>(response);
    return result.data!;
  },

  // Search stocks
  searchStocks: async (query: string, limit: number = 20): Promise<StockData[]> => {
    const response = await fetch(`${API_BASE_URL}/stocks/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    const result = await handleResponse<StockData[]>(response);
    return result.data!;
  },

  // Get market overview
  getMarketOverview: async () => {
    const response = await fetch(`${API_BASE_URL}/stocks/overview`);
    const result = await handleResponse(response);
    return result.data;
  },

  // Get top gainers
  getTopGainers: async (limit: number = 10): Promise<StockData[]> => {
    const response = await fetch(`${API_BASE_URL}/stocks/top-gainers?limit=${limit}`);
    const result = await handleResponse<StockData[]>(response);
    return result.data!;
  },

  // Get top losers
  getTopLosers: async (limit: number = 10): Promise<StockData[]> => {
    const response = await fetch(`${API_BASE_URL}/stocks/top-losers?limit=${limit}`);
    const result = await handleResponse<StockData[]>(response);
    return result.data!;
  },

  // Get most active stocks
  getMostActive: async (limit: number = 10): Promise<StockData[]> => {
    const response = await fetch(`${API_BASE_URL}/stocks/most-active?limit=${limit}`);
    const result = await handleResponse<StockData[]>(response);
    return result.data!;
  },

  // Get historical market data
  getMarketData: async (symbol: string, period: string = '1mo', interval: string = '1day') => {
    const response = await fetch(`${API_BASE_URL}/stocks/${symbol}/market-data?period=${period}&interval=${interval}`);
    const result = await handleResponse(response);
    return result.data;
  },

  // Get multiple stocks data
  getMultipleStocksData: async (symbols: string[]): Promise<StockData[]> => {
    const response = await fetch(`${API_BASE_URL}/stocks/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ symbols })
    });
    const result = await handleResponse<StockData[]>(response);
    return result.data!;
  }
};

// AI API
export const aiAPI = {
  // Generate trading signal
  generateTradingSignal: async (symbol: string, token: string): Promise<AIInsight> => {
    const response = await fetch(`${API_BASE_URL}/ai/trading-signal/${symbol}`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });
    const result = await handleResponse<AIInsight>(response);
    return result.data!;
  },

  // Generate market analysis
  generateMarketAnalysis: async (symbols: string[]): Promise<AIInsight> => {
    const response = await fetch(`${API_BASE_URL}/ai/market-analysis`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ symbols })
    });
    const result = await handleResponse<AIInsight>(response);
    return result.data!;
  },

  // Generate risk assessment
  generateRiskAssessment: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/ai/risk-assessment`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });
    const result = await handleResponse(response);
    return result.data;
  },

  // Generate portfolio optimization
  generatePortfolioOptimization: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/ai/portfolio-optimization`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });
    const result = await handleResponse(response);
    return result.data;
  },

  // Get insights for symbol
  getInsightsForSymbol: async (symbol: string, type?: string, limit: number = 10): Promise<AIInsight[]> => {
    const url = new URL(`${API_BASE_URL}/ai/insights/symbol/${symbol}`);
    if (type) url.searchParams.set('type', type);
    url.searchParams.set('limit', limit.toString());
    
    const response = await fetch(url.toString());
    const result = await handleResponse<AIInsight[]>(response);
    return result.data!;
  },

  // Get user insights
  getUserInsights: async (token: string, type?: string, limit: number = 20): Promise<AIInsight[]> => {
    const url = new URL(`${API_BASE_URL}/ai/insights/user`);
    if (type) url.searchParams.set('type', type);
    url.searchParams.set('limit', limit.toString());
    
    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(token)
    });
    const result = await handleResponse<AIInsight[]>(response);
    return result.data!;
  }
};

// Authentication API
export const authAPI = {
  // Register user
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  }): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    const result = await handleResponse<AuthResponse>(response);
    return result.data!;
  },

  // Login user
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password })
    });
    const result = await handleResponse<AuthResponse>(response);
    return result.data!;
  },

  // Get user profile
  getProfile: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders(token)
    });
    const result = await handleResponse(response);
    return result.data;
  },

  // Update user profile
  updateProfile: async (token: string, updateData: Partial<User>) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updateData)
    });
    const result = await handleResponse(response);
    return result.data;
  },

  // Change password
  changePassword: async (token: string, currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const result = await handleResponse(response);
    return result.data;
  }
};

// Portfolio API
export const portfolioAPI = {
  // Get user portfolio
  getPortfolio: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      headers: getAuthHeaders(token)
    });
    const result = await handleResponse(response);
    return result.data;
  },

  // Add holding to portfolio
  addHolding: async (token: string, holding: {
    symbol: string;
    quantity: number;
    averagePrice: number;
    purchaseDate?: Date;
  }) => {
    const response = await fetch(`${API_BASE_URL}/portfolio/holdings`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(holding)
    });
    const result = await handleResponse(response);
    return result.data;
  },

  // Update holding
  updateHolding: async (token: string, symbol: string, updateData: {
    quantity?: number;
    averagePrice?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/portfolio/holdings/${symbol}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updateData)
    });
    const result = await handleResponse(response);
    return result.data;
  },

  // Remove holding
  removeHolding: async (token: string, symbol: string) => {
    const response = await fetch(`${API_BASE_URL}/portfolio/holdings/${symbol}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    const result = await handleResponse(response);
    return result.data;
  },

  // Refresh portfolio with current prices
  refreshPortfolio: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/portfolio/refresh`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });
    const result = await handleResponse(response);
    return result.data;
  },

  // Get portfolio performance
  getPortfolioPerformance: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/portfolio/performance`, {
      headers: getAuthHeaders(token)
    });
    const result = await handleResponse(response);
    return result.data;
  }
};

// WebSocket Service
export class WebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, (data: any) => void> = new Map();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onopen = () => {
        console.log('✅ Connected to PlusAlpha WebSocket');
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket connection closed');
        this.ws = null;
      };
    });
  }

  subscribe(symbols: string[]) {
    if (this.ws) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        symbols
      }));
    }
  }

  unsubscribe(symbols: string[]) {
    if (this.ws) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        symbols
      }));
    }
  }

  onPriceUpdate(callback: (data: any) => void) {
    this.subscribers.set('price_update', callback);
  }

  onInsightUpdate(callback: (data: any) => void) {
    this.subscribers.set('insight_update', callback);
  }

  onAlert(callback: (data: any) => void) {
    this.subscribers.set('alert', callback);
  }

  private handleMessage(message: any) {
    const callback = this.subscribers.get(message.type);
    if (callback) {
      callback(message.data);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// News & Calendar API
export const newsAPI = {
  // Get financial news
  getFinancialNews: async (limit: number = 10) => {
    const response = await fetch(`${API_BASE_URL}/news/financial?limit=${limit}`);
    const result = await handleResponse(response);
    return result.data;
  },

  // Get stock-specific news
  getStockNews: async (symbol: string, limit: number = 10) => {
    const response = await fetch(`${API_BASE_URL}/news/stock/${symbol}?limit=${limit}`);
    const result = await handleResponse(response);
    return result.data;
  },

  // Get economic calendar
  getEconomicCalendar: async (days: number = 7) => {
    const response = await fetch(`${API_BASE_URL}/news/calendar/economic?days=${days}`);
    const result = await handleResponse(response);
    return result.data;
  },

  // Get earnings calendar
  getEarningsCalendar: async (days: number = 7) => {
    const response = await fetch(`${API_BASE_URL}/news/calendar/earnings?days=${days}`);
    const result = await handleResponse(response);
    return result.data;
  }
};

// Export all APIs as a single object for convenience
export const api = {
  stock: stockAPI,
  ai: aiAPI,
  auth: authAPI,
  portfolio: portfolioAPI,
  news: newsAPI,
  WebSocketService
};

export default api;
