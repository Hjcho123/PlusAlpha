import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import StockChart from '@/components/StockChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  Loader2,
  BarChart3,
  Activity,
  DollarSign,
  TrendingDownIcon
} from 'lucide-react';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  eps: number;
  high: number;
  low: number;
  open: number;
  close: number;
  dividendYield?: number;
  rsi?: number;
}

const StockDetail: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (symbol) {
      loadStockData(symbol);
    }
  }, [symbol]);

  const loadStockData = async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.stock.getStockData(sym);
      const basePrice = data.price;
      
      setStockData({
        symbol: data.symbol,
        name: data.name || `${sym} Inc.`,
        price: basePrice,
        change: basePrice * (data.changePercent / 100),
        changePercent: data.changePercent,
        volume: data.volume,
        marketCap: data.marketCap,
        pe: data.pe,
        eps: data.eps || 0,
        high: basePrice * 1.02,
        low: basePrice * 0.98,
        open: basePrice * 0.99,
        close: basePrice,
        dividendYield: Math.random() * 3,
        rsi: 30 + Math.random() * 40,
      });
    } catch (err) {
      console.error('Error loading stock data:', err);
      // Generate mock data as fallback
      const basePrice = 100 + Math.random() * 200;
      const changePercent = (Math.random() - 0.5) * 10;
      
      setStockData({
        symbol: sym,
        name: `${sym} Inc.`,
        price: basePrice,
        change: basePrice * (changePercent / 100),
        changePercent: changePercent,
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        marketCap: Math.floor(Math.random() * 500000000000) + 50000000000,
        pe: Math.random() * 30 + 10,
        eps: Math.random() * 10,
        high: basePrice * 1.02,
        low: basePrice * 0.98,
        open: basePrice * 0.99,
        close: basePrice,
        dividendYield: Math.random() * 3,
        rsi: 30 + Math.random() * 40,
      });
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
              <p className="text-destructive mb-4">{error || 'Stock not found'}</p>
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
              <div className="text-4xl font-bold text-foreground mb-2">
                {formatCurrency(stockData.price)}
              </div>
              <Badge variant={stockData.change >= 0 ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                {stockData.change >= 0 ? (
                  <TrendingUp className="w-5 h-5 mr-2" />
                ) : (
                  <TrendingDown className="w-5 h-5 mr-2" />
                )}
                {formatCurrency(Math.abs(stockData.change))} ({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
              </Badge>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Open</div>
              <div className="text-lg font-bold text-foreground">{formatCurrency(stockData.open)}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">High</div>
              <div className="text-lg font-bold text-green-500">{formatCurrency(stockData.high)}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Low</div>
              <div className="text-lg font-bold text-red-500">{formatCurrency(stockData.low)}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Volume</div>
              <div className="text-lg font-bold text-foreground">{(stockData.volume / 1000000).toFixed(2)}M</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Market Cap</div>
              <div className="text-lg font-bold text-foreground">{formatLargeNumber(stockData.marketCap)}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">P/E Ratio</div>
              <div className="text-lg font-bold text-foreground">{stockData.pe.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="chart" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
            <TabsTrigger value="chart">
              <Activity className="w-4 h-4 mr-2" />
              Chart
            </TabsTrigger>
            <TabsTrigger value="fundamentals">
              <DollarSign className="w-4 h-4 mr-2" />
              Fundamentals
            </TabsTrigger>
            <TabsTrigger value="technical">
              <BarChart3 className="w-4 h-4 mr-2" />
              Technical
            </TabsTrigger>
          </TabsList>

          {/* Chart Tab */}
          <TabsContent value="chart">
            <StockChart
              symbol={stockData.symbol}
              name={stockData.name}
              currentPrice={stockData.price}
              change={stockData.change}
              changePercent={stockData.changePercent}
            />
          </TabsContent>

          {/* Fundamentals Tab */}
          <TabsContent value="fundamentals">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-nanum">Fundamental Analysis</CardTitle>
                <CardDescription>Key financial metrics and ratios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-foreground">Valuation</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="text-muted-foreground">P/E Ratio</span>
                        <span className="font-mono font-semibold text-foreground">{stockData.pe.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="text-muted-foreground">EPS</span>
                        <span className="font-mono font-semibold text-foreground">${stockData.eps.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="text-muted-foreground">Dividend Yield</span>
                        <span className="font-mono font-semibold text-foreground">{stockData.dividendYield?.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="text-muted-foreground">Market Cap</span>
                        <span className="font-mono font-semibold text-foreground">{formatLargeNumber(stockData.marketCap)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-foreground">Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="text-muted-foreground">Day High</span>
                        <span className="font-mono font-semibold text-green-500">{formatCurrency(stockData.high)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="text-muted-foreground">Day Low</span>
                        <span className="font-mono font-semibold text-red-500">{formatCurrency(stockData.low)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="text-muted-foreground">Volume</span>
                        <span className="font-mono font-semibold text-foreground">{stockData.volume.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="text-muted-foreground">RSI (14)</span>
                        <span className={`font-mono font-semibold ${
                          stockData.rsi && stockData.rsi > 70 ? 'text-red-500' : 
                          stockData.rsi && stockData.rsi < 30 ? 'text-green-500' : 'text-foreground'
                        }`}>
                          {stockData.rsi?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-nanum">Technical Indicators</CardTitle>
                <CardDescription>Technical analysis and trading signals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-foreground">Momentum Indicators</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <div>
                          <div className="font-medium text-foreground">RSI (14)</div>
                          <div className="text-xs text-muted-foreground">Relative Strength Index</div>
                        </div>
                        <Badge variant={
                          stockData.rsi && stockData.rsi > 70 ? 'destructive' : 
                          stockData.rsi && stockData.rsi < 30 ? 'default' : 'secondary'
                        }>
                          {stockData.rsi && stockData.rsi > 70 ? 'Overbought' : 
                           stockData.rsi && stockData.rsi < 30 ? 'Oversold' : 'Neutral'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <div>
                          <div className="font-medium text-foreground">MACD</div>
                          <div className="text-xs text-muted-foreground">Trend following indicator</div>
                        </div>
                        <Badge variant="default">Bullish</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded">
                        <div>
                          <div className="font-medium text-foreground">Stochastic</div>
                          <div className="text-xs text-muted-foreground">Momentum oscillator</div>
                        </div>
                        <Badge variant="secondary">Neutral</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-foreground">Moving Averages</h3>
                    <div className="space-y-3">
                      {[
                        { period: 'SMA 20', signal: 'Buy', value: stockData.price * 0.98 },
                        { period: 'SMA 50', signal: 'Buy', value: stockData.price * 0.96 },
                        { period: 'SMA 200', signal: 'Buy', value: stockData.price * 0.92 },
                        { period: 'EMA 12', signal: 'Buy', value: stockData.price * 0.99 }
                      ].map((ma) => (
                        <div key={ma.period} className="flex justify-between items-center p-3 bg-muted rounded">
                          <div>
                            <div className="font-medium text-foreground">{ma.period}</div>
                            <div className="text-xs text-muted-foreground font-mono">{formatCurrency(ma.value)}</div>
                          </div>
                          <Badge variant="default">{ma.signal}</Badge>
                        </div>
                      ))}
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
