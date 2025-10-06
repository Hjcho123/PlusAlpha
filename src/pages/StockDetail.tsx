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

        {/* COMPACT FUNDAMENTALS LAYOUT */}
        <div className="space-y-4">

          {/* VALUATION & ANALYST ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* VALUATION METRICS - COMPACT */}
            <Card className="terminal-card h-fit">
              <CardHeader className="pb-2 border-b border-slate-700">
                <CardTitle className="text-white text-sm font-mono flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  VALUATION METRICS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">P/E Ratio</span>
                    <span className="font-mono text-blue-400">{stockData.pe ? stockData.pe.toFixed(2) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">EPS</span>
                    <span className="font-mono text-green-400">${stockData.eps ? stockData.eps.toFixed(2) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">Market Cap</span>
                    <span className="font-mono text-purple-400">{stockData.marketCap ? formatLargeNumber(stockData.marketCap) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">PEG Ratio</span>
                    <span className="font-mono text-cyan-400">{financialData?.pegRatio ? financialData.pegRatio.toFixed(2) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">Forward P/E</span>
                    <span className="font-mono text-blue-400">{financialData?.forwardPE ? financialData.forwardPE.toFixed(2) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">Forward EPS</span>
                    <span className="font-mono text-green-400">${financialData?.forwardEPS ? financialData.forwardEPS.toFixed(2) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-mono text-slate-400 text-sm">Dividend Yield</span>
                    <span className="font-mono text-yellow-400">{financialData?.dividendYield ? `${(financialData.dividendYield * 100).toFixed(2)}%` : '--'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ANALYST CONSENSUS - COMPACT */}
            <Card className="terminal-card h-fit">
              <CardHeader className="pb-2 border-b border-slate-700">
                <CardTitle className="text-white text-sm font-mono flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  ANALYST CONSENSUS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {financialData?.analystRatings ? (
                  <>
                    {/* Compact analyst ratings */}
                    <div className="grid grid-cols-5 gap-2 mb-4 text-center">
                      <div className="text-green-500 font-mono text-sm">{financialData.analystRatings.strongBuy}</div>
                      <div className="text-blue-500 font-mono text-sm">{financialData.analystRatings.buy}</div>
                      <div className="text-slate-500 font-mono text-sm">{financialData.analystRatings.hold}</div>
                      <div className="text-orange-500 font-mono text-sm">{financialData.analystRatings.sell}</div>
                      <div className="text-red-500 font-mono text-sm">{financialData.analystRatings.strongSell}</div>
                    </div>
                    {/* Labels */}
                    <div className="grid grid-cols-5 gap-2 mb-4 text-center text-xs text-slate-500">
                      <div>Strong<br/>Buy</div>
                      <div>Buy</div>
                      <div>Hold</div>
                      <div>Sell</div>
                      <div>Strong<br/>Sell</div>
                    </div>

                    {/* Consensus summary - compact */}
                    <div className="p-3 bg-slate-800 rounded text-center">
                      <div className="text-sm font-bold text-white mb-1">{financialData.analystRatings.consensus} CONSENSUS</div>
                      <div className="text-xs text-slate-400 mb-2">
                        {financialData.analystRatings.bullishPercent?.toFixed(1)}% bullish
                      </div>
                      <div className="mb-2">
                        <Progress value={financialData.analystRatings.bullishPercent} className="h-2" />
                      </div>
                      <div className="text-xs text-slate-500">{financialData.analystRatings.total} analysts</div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-500 text-sm py-4">No analyst data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* COMPANY PROFILE & FINANCIAL HEALTH ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* COMPANY PROFILE - COMPACT */}
            <Card className="terminal-card h-fit">
              <CardHeader className="pb-2 border-b border-slate-700">
                <CardTitle className="text-white text-sm font-mono flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  COMPANY PROFILE
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">Name</span>
                    <span className="font-mono text-slate-300 text-right max-w-[60%] truncate">{stockData.name || '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">Symbol</span>
                    <span className="font-mono text-blue-400">{stockData.symbol || '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">Sector</span>
                    <span className="font-mono text-green-400 text-right max-w-[60%] truncate">{financialData?.sector || '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">Industry</span>
                    <span className="font-mono text-green-400 text-right max-w-[60%] truncate">{financialData?.industry || '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">CEO</span>
                    <span className="font-mono text-yellow-400 text-right max-w-[60%] truncate">{financialData?.ceo || '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-mono text-slate-400 text-sm">Employees</span>
                    <span className="font-mono text-slate-400">{financialData?.employees ? financialData.employees.toLocaleString() : '--'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FINANCIAL HEALTH - COMPACT */}
            <Card className="terminal-card h-fit">
              <CardHeader className="pb-2 border-b border-slate-700">
                <CardTitle className="text-white text-sm font-mono flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-400" />
                  FINANCIAL HEALTH
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">ROA</span>
                    <span className="font-mono text-purple-400">{financialData?.roa ? `${(financialData.roa * 100).toFixed(2)}%` : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">ROE</span>
                    <span className="font-mono text-purple-400">{financialData?.roe ? `${(financialData.roe * 100).toFixed(2)}%` : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">Beta</span>
                    <span className="font-mono text-cyan-400">{financialData?.beta ? financialData.beta.toFixed(2) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">Quick Ratio</span>
                    <span className="font-mono text-blue-400">{financialData?.quickRatio ? financialData.quickRatio.toFixed(2) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">Debt/Equity</span>
                    <span className="font-mono text-orange-400">{financialData?.debtToEquity ? financialData.debtToEquity.toFixed(2) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">Current Ratio</span>
                    <span className="font-mono text-red-400">{financialData?.currentRatio ? financialData.currentRatio.toFixed(2) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="font-mono text-slate-400 text-sm">Free Cash Flow</span>
                    <span className="font-mono text-green-400">{financialData?.freeCashFlow ? formatLargeNumber(financialData.freeCashFlow) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-mono text-slate-400 text-sm">Total Cash</span>
                    <span className="font-mono text-green-400">{financialData?.totalCash ? formatLargeNumber(financialData.totalCash) : '--'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
