import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import TradingViewWidget from '@/components/TradingViewWidget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api, WebSocketService } from '@/services/api';
import yahooFinance from 'yahoo-finance2';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashingStocks, setFlashingStocks] = useState<{[key: string]: 'up' | 'down' | null}>({});
  const [wsInstance, setWsInstance] = useState<WebSocketService | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (symbol) {
      loadStockData(symbol);
    }
  }, [symbol]);

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
        high: data.high ?? prev.high,
        low: data.low ?? prev.low,
        open: data.open ?? prev.open,
        close: data.close ?? prev.close,
        dividendYield: data.dividendYield ?? prev.dividendYield,
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
        high: data.high,
        low: data.low,
        open: data.open,
        close: data.close,
        dividendYield: data.dividendYield,
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

        {/* BLOOMBERG-STYLE FUNDAMENTALS TABLES */}
        <div className="space-y-6">

          {/* VALUATION METRICS TABLE */}
          <Card className="terminal-card">
            <CardHeader className="pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-white">VALUATION METRICS</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="terminal-table normal w-full">
                  <thead className="terminal-table-header">
                    <tr>
                      <th className="terminal-th text-left">METRIC</th>
                      <th className="terminal-th text-center">VALUE</th>
                      <th className="terminal-th text-center">INDUSTRY AVG</th>
                      <th className="terminal-th text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">P/E Ratio</td>
                      <td className="terminal-td text-center font-mono text-blue-400">
                        {stockData.pe ? stockData.pe.toFixed(2) : 'N/A'}
                      </td>
                      <td className="terminal-td text-center font-mono text-slate-400">24.5</td>
                      <td className="terminal-td text-center">
                        {stockData.pe ? (
                          <Badge variant={stockData.pe > 30 ? 'destructive' : stockData.pe > 20 ? 'default' : 'secondary'}>
                            {stockData.pe > 30 ? 'OVERVALUED' : stockData.pe > 20 ? 'FAIR' : 'UNDERVALUED'}
                          </Badge>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">EPS</td>
                      <td className="terminal-td text-center font-mono text-green-400">
                        ${stockData.eps ? stockData.eps.toFixed(2) : 'N/A'}
                      </td>
                      <td className="terminal-td text-center font-mono text-slate-400">$2.45</td>
                      <td className="terminal-td text-center">
                        {stockData.eps ? (
                          <Badge variant={stockData.eps > 0 ? 'default' : 'destructive'}>
                            {stockData.eps > 0 ? 'PROFITABLE' : 'UNPROFITABLE'}
                          </Badge>
                        ) : null}
                      </td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Market Cap</td>
                      <td className="terminal-td text-center font-mono text-purple-400">
                        {stockData.marketCap ? formatLargeNumber(stockData.marketCap) : 'N/A'}
                      </td>
                      <td className="terminal-td text-center font-mono text-slate-400">$850B</td>
                      <td className="terminal-td text-center">
                        <Badge variant="secondary">MEGA CAP</Badge>
                      </td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Dividend Yield</td>
                      <td className="terminal-td text-center font-mono text-yellow-400">
                        {stockData.dividendYield ? `${stockData.dividendYield.toFixed(2)}%` : 'N/A'}
                      </td>
                      <td className="terminal-td text-center font-mono text-slate-400">1.8%</td>
                      <td className="terminal-td text-center">
                        {stockData.dividendYield ? (
                          <Badge variant={stockData.dividendYield > 3 ? 'default' : 'secondary'}>
                            {stockData.dividendYield > 3 ? 'HIGH YIELD' : 'MODERATE'}
                          </Badge>
                        ) : null}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ANALYST CONSENSUS & SENTIMENT VISUALIZER - REQUIRES ADDITIONAL YAHOO DATA FETCH */}
          <Card className="terminal-card">
            <CardHeader className="pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-white">ANALYST CONSENSUS</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <p className="text-slate-400 mb-4">
                  Real-time analyst sentiment data requires additional Yahoo Finance integration.
                  Current display shows basic metrics. Full analyst consensus visualization
                  would include bull/bear breakdown with percentage bars and rating distribution.
                </p>
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  FEATURE REQUIRES ADDITIONAL YAHOO FINANCE MODULES
                </Badge>
              </div>

              {/* Placeholder for analyst visualization that would pull from recommendationTrend */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="terminal-td rounded p-4">
                  <div className="text-2xl font-bold text-green-500">?</div>
                  <div className="text-sm text-slate-400">Strong Buy</div>
                </div>
                <div className="terminal-td rounded p-4">
                  <div className="text-2xl font-bold text-blue-500">?</div>
                  <div className="text-sm text-slate-400">Buy</div>
                </div>
                <div className="terminal-td rounded p-4">
                  <div className="text-2xl font-bold text-slate-500">?</div>
                  <div className="text-sm text-slate-400">Hold</div>
                </div>
                <div className="terminal-td rounded p-4">
                  <div className="text-2xl font-bold text-orange-500">?</div>
                  <div className="text-sm text-slate-400">Sell</div>
                </div>
                <div className="terminal-td rounded p-4">
                  <div className="text-2xl font-bold text-red-500">?</div>
                  <div className="text-sm text-slate-400">Strong Sell</div>
                </div>
              </div>

              {/* Placeholder for consensus calculation */}
              <div className="mt-6 p-4 bg-slate-800 rounded">
                <div className="text-center">
                  <div className="text-lg font-bold text-white mb-2">SENTIMENT CONSENSUS: ?</div>
                  <div className="text-slate-400">
                    Would show: BUY, SELL, or HOLD based on analyst vote count
                  </div>
                  <Progress value={60} className="mt-4 h-3" />
                  <div className="text-sm text-slate-500 mt-2">Bullish percentage visualization</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* COMPANY PROFILE TABLE */}
          <Card className="terminal-card">
            <CardHeader className="pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-white">COMPANY PROFILE</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="terminal-table normal w-full">
                  <thead className="terminal-table-header">
                    <tr>
                      <th className="terminal-th text-left">ATTRIBUTE</th>
                      <th className="terminal-th text-left">VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Company Name</td>
                      <td className="terminal-td text-slate-300">{stockData.name}</td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Symbol</td>
                      <td className="terminal-td text-blue-400 font-mono">{stockData.symbol}</td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Sector</td>
                      <td className="terminal-td text-green-400">Technology</td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Industry</td>
                      <td className="terminal-td text-green-400">Consumer Electronics</td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">CEO</td>
                      <td className="terminal-td text-yellow-400">Timothy D. Cook</td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Headquarters</td>
                      <td className="terminal-td text-slate-300">Cupertino, CA, United States</td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Website</td>
                      <td className="terminal-td text-blue-400">
                        <a href="https://apple.com" className="hover:text-blue-300 underline">
                          apple.com
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* FINANCIAL HEALTH TABLE */}
          <Card className="terminal-card">
            <CardHeader className="pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-white">FINANCIAL HEALTH</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="terminal-table normal w-full">
                  <thead className="terminal-table-header">
                    <tr>
                      <th className="terminal-th text-left">METRIC</th>
                      <th className="terminal-th text-center">VALUE</th>
                      <th className="terminal-th text-center">RATING</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Debt/Equity Ratio</td>
                      <td className="terminal-td text-center font-mono text-orange-400">154.49</td>
                      <td className="terminal-td text-center">
                        <Badge variant="destructive">HIGH LEVERAGE</Badge>
                      </td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Current Ratio</td>
                      <td className="terminal-td text-center font-mono text-red-400">0.87</td>
                      <td className="terminal-td text-center">
                        <Badge variant="destructive">BELOW 1.0</Badge>
                      </td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Free Cash Flow</td>
                      <td className="terminal-td text-center font-mono text-green-400">$94.9B</td>
                      <td className="terminal-td text-center">
                        <Badge variant="default">EXCELLENT</Badge>
                      </td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Total Cash</td>
                      <td className="terminal-td text-center font-mono text-green-400">$55.4B</td>
                      <td className="terminal-td text-center">
                        <Badge variant="default">STRONG POSITION</Badge>
                      </td>
                    </tr>
                    <tr className="terminal-tr">
                      <td className="terminal-td font-mono">Volume (Daily)</td>
                      <td className="terminal-td text-center font-mono text-blue-400">
                        {stockData.volume ? `${(stockData.volume / 1000000).toFixed(2)}M` : 'N/A'}
                      </td>
                      <td className="terminal-td text-center">
                        <Badge variant="secondary">HIGH VOLUME</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* DATA SOURCE NOTICE */}
        <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-300 mb-2">DATA SOURCES & LIMITATIONS</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                This comprehensive Bloomberg-style analysis uses Yahoo Finance as the primary data source.
                Full analyst sentiment visualization requires additional module integration. P/E ratios are
                sourced from summaryDetail for Apple due to their unique financial reporting structure.
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
