import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import TradingViewWidget from '@/components/TradingViewWidget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api, WebSocketService } from '@/services/api';

import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Loader2,
  BarChart3,
  Activity,
  DollarSign,
  AlertCircle,
  Brain,
  Users,
  Building2,
  Target,
  PieChart,
  LineChart
} from 'lucide-react';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number | null;
  eps: number | null;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  dividendYield?: number;
}

interface ComprehensiveFinancialData {
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
  analystRatings: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
    total: number;
    bullishPercent: number;
    consensus: 'BUY' | 'SELL' | 'HOLD';
  } | null;
  // Company info
  sector: string | null;
  industry: string | null;
  ceo: string | null;
  employees: number | null;
  headquarters: string | null;
  businessSummary: string | null;
}

const StockDetail: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [financialData, setFinancialData] = useState<ComprehensiveFinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashingStocks, setFlashingStocks] = useState<{[key: string]: 'up' | 'down' | null}>({});
  const [wsInstance, setWsInstance] = useState<WebSocketService | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (symbol) {
      loadStockData(symbol);
      loadComprehensiveData(symbol);
    }
  }, [symbol]);

  // Fetch comprehensive financial data for this specific stock from backend
  const loadComprehensiveData = async (sym: string) => {
    try {
      console.log(`Loading comprehensive data for ${sym}...`);

      // Get comprehensive financial data from backend Yahoo Finance endpoint
      const data = await api.stock.getFundamentals(sym);
      setFinancialData(data as ComprehensiveFinancialData);

    } catch (err) {
      console.error(`Error loading comprehensive data for ${sym}:`, err);
      // Set default -- values on error
      setFinancialData({
        pe: null, eps: null, pegRatio: null, priceToBook: null,
        forwardPE: null, forwardEPS: null, beta: null,
        debtToEquity: null, currentRatio: null, quickRatio: null,
        totalCash: null, freeCashFlow: null, roa: null, roe: null,
        dividendRate: null, dividendYield: null, dividendPayoutRatio: null,
        analystRatings: null,
        sector: null, industry: null, ceo: null, employees: null,
        headquarters: null, businessSummary: null
      });
    }
  };

  // Automatic refresh every 10 seconds
  useEffect(() => {
    if (stockData && symbol) {
      // Start automatic refresh
      refreshIntervalRef.current = setInterval(() => {
        console.log('[STOCK_DETAIL] Auto-refreshing price data...');
        refreshStockData(symbol);
      }, 10000); // 10 seconds

      console.log('[STOCK_DETAIL] Started automatic price refresh every 10 seconds');

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          console.log('[STOCK_DETAIL] Stopped automatic refresh');
        }
      };
    }
  }, [stockData?.symbol]); // Only restart when stock symbol changes

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (stockData && symbol) {
      console.log('[STOCK_DETAIL] Initializing WebSocket connection for stock:', symbol);

      const ws = new WebSocketService();

      // Connect to WebSocket
      ws.connect().then(() => {
        console.log('[STOCK_DETAIL] WebSocket connected for real-time updates');

        // Subscribe to this stock's symbol
        ws.subscribe([symbol]);
        console.log('[STOCK_DETAIL] Subscribed to real-time updates for:', symbol);

        // Handle real-time price updates
        ws.onPriceUpdate((data) => {
          if (data.symbol.toUpperCase() === symbol.toUpperCase()) {
            console.log('[STOCK_DETAIL] Received real-time price update:', data);

            const oldPrice = stockData.price;
            const newPrice = data.price;

            // Trigger flash animation if price changed significantly
            if (Math.abs(newPrice - oldPrice) >= 0.01) {
              const direction = newPrice > oldPrice ? 'up' : 'down';
              setFlashingStocks(prev => ({ ...prev, [symbol]: direction }));

              // Clear the flash after animation completes
              setTimeout(() => {
                setFlashingStocks(prev => ({ ...prev, [symbol]: null }));
              }, 800);
            }

            // Update the stock data with real-time price
            setStockData(prev => prev ? {
              ...prev,
              price: data.price,
              change: data.change || 0,
              changePercent: data.changePercent || 0,
            } : null);
          }
        });

        setWsInstance(ws);

      }).catch(error => {
        console.error('[STOCK_DETAIL] WebSocket connection failed:', error);
      });

      // Cleanup WebSocket on unmount
      return () => {
        if (ws) {
          ws.disconnect();
          console.log('[STOCK_DETAIL] WebSocket disconnected');
        }
      };
    }
  }, [stockData?.symbol]); // Reconnect when stock symbol changes

  const refreshStockData = async (sym: string) => {
    console.log(`[STOCK_DETAIL] Refreshing data for ${sym}...`);
    try {
      const data = await api.stock.getStockData(sym);

      if (!data || !data.price || data.price <= 0) {
        console.warn(`[STOCK_DETAIL] Invalid refresh data for ${sym}:`, data);
        return; // Don't update if invalid data
      }

      // Use current stock data as baseline for flash comparison
      const oldPrice = stockData?.price || 0;
      const newPrice = data.price;

      // Trigger flash animation if price changed significantly
      if (Math.abs(newPrice - oldPrice) >= 0.01) {
        const direction = newPrice > oldPrice ? 'up' : 'down';
        setFlashingStocks(prev => ({ ...prev, [sym]: direction }));

        // Clear the flash after animation completes
        setTimeout(() => {
          setFlashingStocks(prev => ({ ...prev, [sym]: null }));
        }, 800);
      }

      // Update the stock data with new price info
      setStockData(prev => prev ? {
        ...prev,
        price: data.price,
        change: data.change !== undefined ? data.change : data.price * (data.changePercent / 100),
        changePercent: data.changePercent,
        volume: data.volume || prev.volume,
        marketCap: data.marketCap || prev.marketCap,
        // Keep other properties the same unless they changed
        pe: data.pe ?? prev.pe,
        eps: data.eps ?? prev.eps,
      } : null);

      console.log(`[STOCK_DETAIL] Successfully refreshed ${sym}: $${newPrice.toFixed(2)}`);
    } catch (err) {
      console.warn(`[STOCK_DETAIL] Error refreshing ${sym}:`, err);
      // Silent failure for auto-refresh - don't disrupt user experience
    }
  };

  const loadStockData = async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.stock.getStockData(sym);
      
      if (!data || !data.price || data.price <= 0) {
        throw new Error('Invalid or no data received from API');
      }

      setStockData({
        symbol: data.symbol || sym,
        name: data.name || `${sym} Company`,
        price: data.price,
        change: data.change !== undefined ? data.change : data.price * (data.changePercent / 100),
        changePercent: data.changePercent,
        volume: data.volume || 0,
        marketCap: data.marketCap || 0,
        pe: data.pe,
        eps: data.eps,
      });
    } catch (err) {
      console.error('Error loading stock data:', err);
      setError('Could not load stock data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return formatCurrency(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-24 px-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !stockData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-24 px-6">
          <Card className="bg-card border-border">
            <CardContent className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <p className="text-destructive mb-4">{error || 'Stock data unavailable'}</p>
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto py-6 px-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold font-mono text-foreground mb-2">
                {stockData.symbol}
              </h1>
              <p className="text-xl text-muted-foreground">{stockData.name}</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold mb-2 transition-all duration-300 ${
                flashingStocks[stockData.symbol] === 'up' ? 'text-green-500 scale-110' :
                flashingStocks[stockData.symbol] === 'down' ? 'text-red-500 scale-110' :
                'text-foreground scale-100'
              }`}>
                {formatCurrency(stockData.price)}
              </div>
              <Badge variant={stockData.change >= 0 ? 'default' : 'destructive'} className={`text-lg px-4 py-2 ${
                stockData.change >= 0 ? 'bg-green-500 hover:bg-green-600 border-green-500' : ''
              }`}>
                <span className={`inline-block mr-2 ${
                  flashingStocks[stockData.symbol] === 'up' ? 'text-green-500' :
                  flashingStocks[stockData.symbol] === 'down' ? 'text-red-500' :
                  'text-current'
                }`}>
                  {stockData.change >= 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </span>
                {formatCurrency(Math.abs(stockData.change))} ({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
              </Badge>
            </div>
          </div>
        </div>

        {/* TRADING CHART - GOVERNMENTAL TOP POSITION */}
        <div className="mb-8">
          <div style={{ height: "600px", width: "100%" }} className="bg-slate-950 rounded-lg border border-slate-700">
            <TradingViewWidget symbol={stockData.symbol} />
          </div>
        </div>

        {/* PROFESSIONAL METRICS DASHBOARD */}
        <div className="space-y-6">

          {/* PRIMARY METRICS ROW - LARGE SCREENS */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-1">
            {/* VALUATION CARD */}
            <Card className="bg-gradient-to-br from-slate-50/5 to-slate-100/10 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200/20 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">P/E Ratio</p>
                      <p className="text-2xl font-bold text-foreground">{stockData.pe ? stockData.pe.toFixed(2) : '--'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>EPS (FY0)</span>
                    <span>${stockData.eps ? stockData.eps.toFixed(2) : '--'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MARKET CAP CARD */}
            <Card className="bg-gradient-to-br from-slate-50/5 to-slate-100/10 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200/20 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Market Cap</p>
                      <p className="text-2xl font-bold text-foreground">{stockData.marketCap ? formatLargeNumber(stockData.marketCap) : '--'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Fwd P/E (FY1)</span>
                    <span>{financialData?.forwardPE ? financialData.forwardPE.toFixed(2) : '--'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DIVIDEND YIELD CARD */}
            <Card className="bg-gradient-to-br from-slate-50/5 to-slate-100/10 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200/20 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dividend Yield</p>
                      <p className="text-2xl font-bold text-foreground">{financialData?.dividendYield ? `${(financialData.dividendYield * 100).toFixed(2)}%` : '--'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>ROE (TTM)</span>
                    <span>{financialData?.roe ? `${(financialData.roe * 100).toFixed(2)}%` : '--'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BETA CARD */}
            <Card className="bg-gradient-to-br from-slate-50/5 to-slate-100/10 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200/20 dark:border-slate-700/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Beta (5Y)</p>
                      <p className="text-2xl font-bold text-foreground">{financialData?.beta ? financialData.beta.toFixed(2) : '--'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>ROA (TTM)</span>
                    <span>{financialData?.roa ? `${(financialData.roa * 100).toFixed(2)}%` : '--'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DETAILED ANALYTICS SECTION */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* VALUATION & FINANCIAL TABLES */}
            <div className="space-y-6">
              {/* VALUATION METRICS TABLE */}
              <Card className="bg-card border-2 border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <CardHeader className="pb-3 bg-gradient-to-r from-slate-50/80 to-slate-100/40 dark:from-slate-800/80 dark:to-slate-900/40 border-b border-slate-200/50 dark:border-slate-700/50">
                  <CardTitle className="text-foreground text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Valuation Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">P/E Ratio (TTM)</span>
                      <span className="text-sm font-semibold text-foreground text-right">{stockData.pe ? stockData.pe.toFixed(2) : '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">EPS (FY0)</span>
                      <span className="text-sm font-semibold text-foreground text-right">${stockData.eps ? stockData.eps.toFixed(2) : '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Market Cap</span>
                      <span className="text-sm font-semibold text-foreground text-right">{stockData.marketCap ? formatLargeNumber(stockData.marketCap) : '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">PEG Ratio (5Y)</span>
                      <span className="text-sm font-semibold text-foreground text-right">{financialData?.pegRatio ? financialData.pegRatio.toFixed(2) : '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Forward P/E (FY1)</span>
                      <span className="text-sm font-semibold text-foreground text-right">{financialData?.forwardPE ? financialData.forwardPE.toFixed(2) : '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Forward EPS (FY1)</span>
                      <span className="text-sm font-semibold text-foreground text-right">${financialData?.forwardEPS ? financialData.forwardEPS.toFixed(2) : '--'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FINANCIAL HEALTH TABLE */}
              <Card className="bg-card border-2 border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <CardHeader className="pb-3 bg-gradient-to-r from-slate-50/80 to-slate-100/40 dark:from-slate-800/80 dark:to-slate-900/40 border-b border-slate-200/50 dark:border-slate-700/50">
                  <CardTitle className="text-foreground text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Financial Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">ROA (TTM)</span>
                      <span className="text-sm font-semibold text-foreground text-right">{financialData?.roa ? `${(financialData.roa * 100).toFixed(2)}%` : '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">ROE (TTM)</span>
                      <span className="text-sm font-semibold text-foreground text-right">{financialData?.roe ? `${(financialData.roe * 100).toFixed(2)}%` : '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Beta (5Y Monthly)</span>
                      <span className="text-sm font-semibold text-foreground text-right">{financialData?.beta ? financialData.beta.toFixed(2) : '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Quick Ratio (MRQ)</span>
                      <span className="text-sm font-semibold text-foreground text-right">{financialData?.quickRatio ? financialData.quickRatio.toFixed(2) : '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Debt/Equity (MRQ)</span>
                      <span className="text-sm font-semibold text-foreground text-right">{financialData?.debtToEquity ? financialData.debtToEquity.toFixed(2) : '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Current Ratio (MRQ)</span>
                      <span className="text-sm font-semibold text-foreground text-right">{financialData?.currentRatio ? financialData.currentRatio.toFixed(2) : '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Free Cash Flow (TTM)</span>
                      <span className="text-sm font-semibold text-foreground text-right">{financialData?.freeCashFlow ? formatLargeNumber(financialData.freeCashFlow) : '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Total Cash (MRQ)</span>
                      <span className="text-sm font-semibold text-foreground text-right">{financialData?.totalCash ? formatLargeNumber(financialData.totalCash) : '--'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* COMPANY PROFILE & ANALYST CONSENSUS */}
            <div className="space-y-6">
              {/* COMPANY PROFILE TABLE */}
              <Card className="bg-card border-2 border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <CardHeader className="pb-3 bg-gradient-to-r from-slate-50/80 to-slate-100/40 dark:from-slate-800/80 dark:to-slate-900/40 border-b border-slate-200/50 dark:border-slate-700/50">
                  <CardTitle className="text-foreground text-lg font-semibold flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-500" />
                    Company Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Company Name</span>
                      <span className="text-sm font-semibold text-foreground text-right truncate">{stockData.name || '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Symbol</span>
                      <span className="text-sm font-semibold text-foreground text-right">{stockData.symbol || '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Sector</span>
                      <span className="text-sm font-semibold text-foreground text-right truncate">{financialData?.sector || '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Industry</span>
                      <span className="text-sm font-semibold text-foreground text-right truncate">{financialData?.industry || '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">CEO</span>
                      <span className="text-sm font-semibold text-foreground text-right truncate">{financialData?.ceo || '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground">Employees</span>
                      <span className="text-sm font-semibold text-foreground text-right">{financialData?.employees ? financialData.employees.toLocaleString() : '--'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ANALYST CONSENSUS - FIXED LAYOUT */}
              <Card className="bg-card border-2 border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <CardHeader className="pb-3 bg-gradient-to-r from-slate-50/80 to-slate-100/40 dark:from-slate-800/80 dark:to-slate-900/40 border-b border-slate-200/50 dark:border-slate-700/50">
                  <CardTitle className="text-foreground text-lg font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-500" />
                    Analyst Consensus
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {financialData?.analystRatings ? (
                    <div className="grid grid-cols-3 gap-6">
                      {/* Left side - Compact analyst ratings table */}
                      <div className="col-span-2 space-y-3">
                        <div className="grid grid-cols-2 gap-2 p-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg">
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Strong Buy</span>
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 text-right">{financialData.analystRatings.strongBuy}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-2 bg-green-50/50 dark:bg-green-900/20 rounded-lg">
                          <span className="text-xs font-semibold text-green-700 dark:text-green-300">Buy</span>
                          <span className="text-xs font-bold text-green-800 dark:text-green-200 text-right">{financialData.analystRatings.buy}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-2 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg">
                          <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">Hold</span>
                          <span className="text-xs font-bold text-yellow-800 dark:text-yellow-200 text-right">{financialData.analystRatings.hold}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-2 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg">
                          <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">Sell</span>
                          <span className="text-xs font-bold text-orange-800 dark:text-orange-200 text-right">{financialData.analystRatings.sell}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-2 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
                          <span className="text-xs font-semibold text-red-700 dark:text-red-300">Strong Sell</span>
                          <span className="text-xs font-bold text-red-800 dark:text-red-200 text-right">{financialData.analystRatings.strongSell}</span>
                        </div>
                        <div className="mt-4 p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg text-center">
                          <div className="text-sm font-bold text-foreground">{financialData.analystRatings.consensus}</div>
                          <div className="text-xs text-muted-foreground">{financialData.analystRatings.total} analysts</div>
                        </div>
                      </div>

                      {/* Right side - Pie Chart */}
                      <div className="flex flex-col items-center justify-center p-4">
                        <div className="relative w-24 h-24 mb-2">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            {/* Strong Buy slice */}
                            {financialData.analystRatings.strongBuy > 0 && (
                              <circle
                                cx="18"
                                cy="18"
                                r="15.9155"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="4"
                                strokeDasharray={`${(financialData.analystRatings.strongBuy / financialData.analystRatings.total) * 100} 100`}
                              />
                            )}
                            {/* Buy slice */}
                            {financialData.analystRatings.buy > 0 && (
                              <circle
                                cx="18"
                                cy="18"
                                r="15.9155"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="4"
                                strokeDasharray={`${(financialData.analystRatings.buy / financialData.analystRatings.total) * 100} 100`}
                                transform={`rotate(${((financialData.analystRatings.strongBuy / financialData.analystRatings.total) * 360)}, 18, 18)`}
                              />
                            )}
                            {/* Hold slice */}
                            {financialData.analystRatings.hold > 0 && (
                              <circle
                                cx="18"
                                cy="18"
                                r="15.9155"
                                fill="none"
                                stroke="#eab308"
                                strokeWidth="4"
                                strokeDasharray={`${(financialData.analystRatings.hold / financialData.analystRatings.total) * 100} 100`}
                                transform={`rotate(${(((financialData.analystRatings.strongBuy + financialData.analystRatings.buy) / financialData.analystRatings.total) * 360)}, 18, 18)`}
                              />
                            )}
                            {/* Sell slice */}
                            {financialData.analystRatings.sell > 0 && (
                              <circle
                                cx="18"
                                cy="18"
                                r="15.9155"
                                fill="none"
                                stroke="#f97316"
                                strokeWidth="4"
                                strokeDasharray={`${(financialData.analystRatings.sell / financialData.analystRatings.total) * 100} 100`}
                                transform={`rotate(${(((financialData.analystRatings.strongBuy + financialData.analystRatings.buy + financialData.analystRatings.hold) / financialData.analystRatings.total) * 360)}, 18, 18)`}
                              />
                            )}
                            {/* Strong Sell slice */}
                            {financialData.analystRatings.strongSell > 0 && (
                              <circle
                                cx="18"
                                cy="18"
                                r="15.9155"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="4"
                                strokeDasharray={`${(financialData.analystRatings.strongSell / financialData.analystRatings.total) * 100} 100`}
                                transform={`rotate(${(((financialData.analystRatings.strongBuy + financialData.analystRatings.buy + financialData.analystRatings.hold + financialData.analystRatings.sell) / financialData.analystRatings.total) * 360)}, 18, 18)`}
                              />
                            )}
                          </svg>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-foreground">
                            {financialData.analystRatings.bullishPercent.toFixed(2)}% BULLISH
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <PieChart className="w-12 h-12 text-muted-foreground/50 mb-3" />
                      <div className="text-center">
                        <p className="font-semibold text-muted-foreground text-lg mb-1">No Analyst Data</p>
                        <p className="text-sm text-muted-foreground">Analyst ratings not available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>

        </div>

        {/* DATA SOURCE NOTICE */}
        <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-300 mb-2">DATA SOURCES & LIMITATIONS</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                This comprehensive analysis uses Yahoo Finance as the primary data source.
                Full analyst sentiment visualization requires additional module integration. 
                Real-time updates occur every 10 seconds. Some advanced metrics may not be available for
                all stocks depending on market and region.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StockDetail;
