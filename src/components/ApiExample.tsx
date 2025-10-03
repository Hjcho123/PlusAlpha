import React, { useState, useEffect } from 'react';
import { api, StockData, AIInsight } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, TrendingUp, TrendingDown, Brain, AlertCircle, BarChart3, Lightbulb } from 'lucide-react';
import Navigation from './Navigation';
import StockChart from './StockChart';

const ApiExample: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [searchQuery, setSearchQuery] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState<string | null>(null); // Track which symbol is loading
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket connection
  useEffect(() => {
    const wsService = new api.WebSocketService();
    
    wsService.connect()
      .then(() => {
        setWsConnected(true);
        wsService.subscribe(['AAPL', 'GOOGL', 'MSFT']);
        
        wsService.onPriceUpdate((data) => {
          console.log('Real-time price update:', data);
          // Update stocks in real-time
          setStocks(prev => prev.map(stock => 
            stock.symbol === data.symbol 
              ? { ...stock, price: data.price, change: data.change, changePercent: data.changePercent }
              : stock
          ));
        });

        wsService.onInsightUpdate((data) => {
          console.log('New AI insight:', data);
          setInsights(prev => [data, ...prev.slice(0, 4)]); // Keep only latest 5
        });
      })
      .catch(err => {
        console.error('WebSocket connection failed:', err);
        setWsConnected(false);
      });

    return () => {
      wsService.disconnect();
    };
  }, []);

  // Search stocks
  const searchStocks = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const results = await api.stock.searchStocks(searchQuery, 10);
      setStocks(results);
    } catch (err: any) {
      setError(err.message || 'Failed to search stocks');
    } finally {
      setLoading(false);
    }
  };

  // Get market overview
  const getMarketOverview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const overview = await api.stock.getMarketOverview();
      // Type check and extract stocks from overview
      if (overview && typeof overview === 'object') {
        const overviewData = overview as { 
          topGainers?: StockData[]; 
          topLosers?: StockData[]; 
          mostActive?: StockData[] 
        };
        const allStocks = [
          ...(overviewData.topGainers?.slice(0, 3) || []),
          ...(overviewData.topLosers?.slice(0, 3) || []),
          ...(overviewData.mostActive?.slice(0, 3) || [])
        ];
        setStocks(allStocks);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get market overview');
    } finally {
      setLoading(false);
    }
  };

  // Generate AI insight
  const generateInsight = async (symbol: string) => {
    setInsightLoading(symbol);
    setError(null);
    
    try {
      const insight = await api.ai.generateDemoTradingSignal(symbol);
      
      // Enhance the insight with additional details
      const enhancedInsight = {
        ...insight,
        marketContext: {
          marketTrend: Math.random() > 0.5 ? 'bullish' : 'bearish',
          volatility: Math.random() * 50 + 10, // 10-60%
          volume: Math.random() > 0.3 ? 'high' : 'low',
          newsScore: Math.floor(Math.random() * 100),
        },
        riskFactors: [
          'Market volatility may increase due to upcoming earnings',
          'Geopolitical tensions affecting sector performance',
          'Federal Reserve policy changes impacting growth stocks',
          'Supply chain disruptions in technology sector'
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        priceTargets: {
          optimistic: insight.technicalIndicators?.[0]?.value * 1.15,
          realistic: insight.technicalIndicators?.[0]?.value * 1.05,
          conservative: insight.technicalIndicators?.[0]?.value * 0.95
        }
      };
      
      setInsights(prev => [enhancedInsight, ...prev.slice(0, 4)]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI insight');
    } finally {
      setInsightLoading(null);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="container mx-auto py-8 px-4 space-y-8 pt-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-nanum mb-4 text-foreground">PlusAlpha API Demo</h1>
        <p className="text-lg text-muted-foreground mb-6">
          See your backend in action! This component demonstrates real-time stock data and AI insights.
        </p>
        
        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">
            WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Search Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Stock Search & Market Data</CardTitle>
          <CardDescription className="text-muted-foreground">
            Search for stocks and get real-time market data from your backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter stock symbol (e.g., AAPL)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && searchStocks()}
              className="bg-input border-border text-foreground"
            />
            <Button onClick={searchStocks} disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </Button>
            <Button variant="outline" onClick={getMarketOverview} disabled={loading}>
              Market Overview
            </Button>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-foreground">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stocks Display with Charts and Insights */}
      {stocks.length > 0 && (
        <div className="space-y-6">
          {stocks.map((stock) => (
            <div key={stock.symbol} className="space-y-4">
              <Tabs defaultValue="chart" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chart" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Chart Analysis
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    AI Insights
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="chart" className="space-y-4">
                  <StockChart
                    symbol={stock.symbol}
                    name={stock.name}
                    currentPrice={stock.price}
                    change={stock.change}
                    changePercent={stock.changePercent}
                  />
                  
                  {/* Stock Summary Card */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-foreground">
                        <span>{stock.symbol} - {stock.name}</span>
                        <Badge variant={stock.change >= 0 ? 'default' : 'destructive'}>
                          {stock.change >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {formatPercentage(stock.changePercent)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Current Price</div>
                          <div className="font-semibold text-lg">{formatCurrency(stock.price)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Volume</div>
                          <div className="font-semibold">{stock.volume.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Market Cap</div>
                          <div className="font-semibold">{formatCurrency(stock.marketCap)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">P/E Ratio</div>
                          <div className="font-semibold">{stock.pe.toFixed(2)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="insights" className="space-y-4">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-foreground">
                        <span>AI Insights for {stock.symbol}</span>
                        <Button 
                          size="sm" 
                          onClick={() => generateInsight(stock.symbol)}
                          disabled={insightLoading === stock.symbol}
                        >
                          {insightLoading === stock.symbol ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Brain className="w-3 h-3 mr-1" />
                          )}
                          {insightLoading === stock.symbol ? 'Generating...' : 'Generate New Insight'}
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        AI-powered analysis and trading signals for {stock.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {insightLoading === stock.symbol && (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground">
                              AI is analyzing {stock.symbol}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Processing market data, technical indicators, and news sentiment
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {insights.filter(insight => insight.symbol === stock.symbol).length > 0 ? (
                        <div className="space-y-4">
                          {insights
                            .filter(insight => insight.symbol === stock.symbol)
                            .map((insight: any) => (
                              <Card key={insight._id} className="p-4 bg-muted border-border">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-semibold text-foreground">{insight.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {insight.type.replace('_', ' ')} • {new Date(insight.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Badge variant={
                                    insight.action === 'buy' ? 'default' : 
                                    insight.action === 'sell' ? 'destructive' : 'secondary'
                                  }>
                                    {insight.action.toUpperCase()}
                                  </Badge>
                                </div>
                                
                                <p className="text-sm mb-4 text-foreground">{insight.description}</p>
                                
                                {/* Enhanced Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm">Market Context</h5>
                                    {insight.marketContext && (
                                      <div className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                          <span>Market Trend:</span>
                                          <Badge variant={insight.marketContext.marketTrend === 'bullish' ? 'default' : 'destructive'} className="text-xs">
                                            {insight.marketContext.marketTrend}
                                          </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Volatility:</span>
                                          <span>{insight.marketContext.volatility?.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Volume:</span>
                                          <span className={insight.marketContext.volume === 'high' ? 'text-green-600' : 'text-yellow-600'}>
                                            {insight.marketContext.volume}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>News Score:</span>
                                          <span>{insight.marketContext.newsScore}/100</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm">Price Targets</h5>
                                    {insight.priceTargets && (
                                      <div className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                          <span>Conservative:</span>
                                          <span>{formatCurrency(insight.priceTargets.conservative)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Realistic:</span>
                                          <span>{formatCurrency(insight.priceTargets.realistic)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Optimistic:</span>
                                          <span>{formatCurrency(insight.priceTargets.optimistic)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Confidence Level</span>
                                    <span className="font-semibold">{insight.confidence}%</span>
                                  </div>
                                  
                                  {insight.reasoning.length > 0 && (
                                    <div className="text-xs">
                                      <strong>Key Reasoning:</strong>
                                      <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                                        {insight.reasoning.slice(0, 3).map((reason: string, index: number) => (
                                          <li key={index}>{reason}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {insight.riskFactors && insight.riskFactors.length > 0 && (
                                    <div className="text-xs">
                                      <strong>Risk Factors:</strong>
                                      <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5 text-yellow-700 dark:text-yellow-300">
                                        {insight.riskFactors.slice(0, 2).map((risk: string, index: number) => (
                                          <li key={index}>{risk}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {insight.technicalIndicators && insight.technicalIndicators.length > 0 && (
                                    <div className="text-xs">
                                      <strong>Technical Indicators:</strong>
                                      <div className="grid grid-cols-2 gap-2 mt-1">
                                        {insight.technicalIndicators.slice(0, 3).map((indicator: any, index: number) => (
                                          <div key={index} className="flex justify-between">
                                            <span>{indicator.name}:</span>
                                            <Badge variant={
                                              indicator.signal === 'buy' ? 'default' : 
                                              indicator.signal === 'sell' ? 'destructive' : 'secondary'
                                            } className="text-xs">
                                              {indicator.signal}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No AI insights available yet.</p>
                          <p className="text-sm">Click "Generate New Insight" to get started.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ))}
        </div>
      )}


      {/* Instructions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-nanum text-foreground">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground">
          <p>1. <strong>Start your backend:</strong> Run <code>npm run dev</code> in the backend directory</p>
          <p>2. <strong>Search stocks:</strong> Enter a symbol like AAPL, GOOGL, or MSFT</p>
          <p>3. <strong>Get AI insights:</strong> Click "AI Insight" on any stock to generate trading signals</p>
          <p>4. <strong>Real-time updates:</strong> WebSocket connection provides live price updates</p>
          <p>5. <strong>Market overview:</strong> Click "Market Overview" to see top gainers, losers, and most active stocks</p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default ApiExample;
