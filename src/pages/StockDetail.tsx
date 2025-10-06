import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import TradingViewWidget from '@/components/TradingViewWidget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, WebSocketService } from '@/services/api';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Loader2,
  BarChart3,
  Activity,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe?: number;
  eps?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  dividendYield?: number;
  // Remove RSI as it's not reliably available from yfinance
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
      
      <div className="container mx-auto py-24 px-6">
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

        {/* Key Metrics - Only show available data */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {stockData.open && (
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Open</div>
                <div className="text-lg font-bold text-foreground">{formatCurrency(stockData.open)}</div>
              </CardContent>
            </Card>
          )}
          
          {stockData.high && (
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">High</div>
                <div className="text-lg font-bold text-green-500">{formatCurrency(stockData.high)}</div>
              </CardContent>
            </Card>
          )}
          
          {stockData.low && (
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Low</div>
                <div className="text-lg font-bold text-red-500">{formatCurrency(stockData.low)}</div>
              </CardContent>
            </Card>
          )}
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Volume</div>
              <div className="text-lg font-bold text-foreground">
                {stockData.volume ? `${(stockData.volume / 1000000).toFixed(2)}M` : 'N/A'}
              </div>
            </CardContent>
          </Card>
          
          {stockData.marketCap > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Market Cap</div>
                <div className="text-lg font-bold text-foreground">{formatLargeNumber(stockData.marketCap)}</div>
              </CardContent>
            </Card>
          )}
          
          {stockData.pe && (
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">P/E Ratio</div>
                <div className="text-lg font-bold text-foreground">{stockData.pe.toFixed(2)}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="chart" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
            <TabsTrigger value="chart">
              <Activity className="w-4 h-4 mr-2" />
              Chart
            </TabsTrigger>
            <TabsTrigger value="fundamentals">
              <DollarSign className="w-4 h-4 mr-2" />
              Fundamentals
            </TabsTrigger>
          </TabsList>

          {/* Chart Tab */}
          <TabsContent value="chart">
            <div style={{ height: "600px", width: "100%" }}>
              <TradingViewWidget symbol={stockData.symbol} />
            </div>
          </TabsContent>

          {/* Fundamentals Tab - Only show available data */}
          <TabsContent value="fundamentals">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-nanum">Fundamental Analysis</CardTitle>
                <CardDescription>Available financial metrics and ratios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-foreground">Valuation</h3>
                    <div className="space-y-3">
                      {stockData.pe && (
                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="text-muted-foreground">P/E Ratio</span>
                          <span className="font-mono font-semibold text-foreground">{stockData.pe.toFixed(2)}</span>
                        </div>
                      )}
                      {stockData.eps && (
                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="text-muted-foreground">EPS</span>
                          <span className="font-mono font-semibold text-foreground">${stockData.eps.toFixed(2)}</span>
                        </div>
                      )}
                      {stockData.dividendYield && (
                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="text-muted-foreground">Dividend Yield</span>
                          <span className="font-mono font-semibold text-foreground">{stockData.dividendYield.toFixed(2)}%</span>
                        </div>
                      )}
                      {stockData.marketCap > 0 && (
                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="text-muted-foreground">Market Cap</span>
                          <span className="font-mono font-semibold text-foreground">{formatLargeNumber(stockData.marketCap)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-foreground">Performance</h3>
                    <div className="space-y-3">
                      {stockData.high && (
                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="text-muted-foreground">Day High</span>
                          <span className="font-mono font-semibold text-green-500">{formatCurrency(stockData.high)}</span>
                        </div>
                      )}
                      {stockData.low && (
                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="text-muted-foreground">Day Low</span>
                          <span className="font-mono font-semibold text-red-500">{formatCurrency(stockData.low)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="text-muted-foreground">Volume</span>
                        <span className="font-mono font-semibold text-foreground">
                          {stockData.volume ? stockData.volume.toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="text-muted-foreground">Daily Change</span>
                        <span className={`font-mono font-semibold ${
                          stockData.change >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {formatCurrency(Math.abs(stockData.change))} ({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Availability Notice */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Data Availability Notice</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        Some financial metrics may not be available through Yahoo Finance. 
                        The displayed data represents all available information for this stock.
                        Technical indicators like RSI are not included as they are not reliably available.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StockDetail;
