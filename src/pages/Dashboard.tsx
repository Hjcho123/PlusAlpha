import React, { useState, useEffect, useRef } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TickerTapeWidget from "@/components/TickerTapeWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import SearchSuggestions from "@/components/SearchSuggestions";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Brain,
  Search,
  Plus,
  Loader2,
  Activity,
  Target,
  Zap,
  PieChart,
  AlertCircle,
  Calendar,
  DollarSign,
  Percent,
  ArrowUpDown,
  ExternalLink,
  Clock,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Shield,
  Lightbulb,
  TargetIcon,
  LineChart as LineChartIcon,
  CandlestickChart,
  X,
  Trash2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

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
  dividend: number;
  high52Week: number;
  low52Week: number;
  lastUpdated: string;
}

interface DetailedStockData extends StockData {
  sector?: string;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  dividendYield?: number;
  rsi?: number;
}

// Utility functions - Now bulletproof against any data
const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    console.warn('Error formatting currency:', value, error);
    return 'N/A';
  }
};

const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  try {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  } catch (error) {
    console.warn('Error formatting percentage:', value, error);
    return 'N/A';
  }
};

const formatMarketCap = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  try {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  } catch (error) {
    console.warn('Error formatting market cap:', value, error);
    return 'N/A';
  }
};

const formatVolume = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  try {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    } else {
      return value.toFixed(0);
    }
  } catch (error) {
    console.warn('Error formatting volume:', value, error);
    return 'N/A';
  }
};

const formatNumber = (value: number | undefined | null, decimals: number = 1): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  try {
    return value.toFixed(decimals);
  } catch (error) {
    console.warn('Error formatting number:', value, error);
    return 'N/A';
  }
};

// Safe stock data validator
const validateAndFixStockData = (data: any): DetailedStockData => {
  return {
    symbol: data?.symbol || 'UNKNOWN',
    name: data?.name || 'Unknown Stock',
    price: typeof data?.price === 'number' && data.price > 0 ? data.price : 0,
    change: typeof data?.change === 'number' ? data.change : 0,
    changePercent: typeof data?.changePercent === 'number' ? data.changePercent : 0,
    volume: typeof data?.volume === 'number' ? data.volume : undefined,
    marketCap: typeof data?.marketCap === 'number' ? data.marketCap : undefined,
    pe: typeof data?.pe === 'number' ? data.pe : undefined,
    eps: typeof data?.eps === 'number' ? data.eps : undefined,
    dividend: typeof data?.dividend === 'number' ? data.dividend : undefined,
    high52Week: typeof data?.high52Week === 'number' ? data.high52Week : undefined,
    low52Week: typeof data?.low52Week === 'number' ? data.low52Week : undefined,
    lastUpdated: data?.lastUpdated || new Date().toISOString(),
    sector: data?.sector || undefined,
    high: typeof data?.high === 'number' ? data.high : undefined,
    low: typeof data?.low === 'number' ? data.low : undefined,
    open: typeof data?.open === 'number' ? data.open : undefined,
    close: typeof data?.close === 'number' ? data.close : undefined,
    dividendYield: typeof data?.dividendYield === 'number' ? data.dividendYield : undefined,
    rsi: typeof data?.rsi === 'number' ? data.rsi : undefined,
  };
};

const Dashboard = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [watchlist, setWatchlist] = useState<DetailedStockData[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('watchlist');
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed' | 'after-hours'>('open');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [chatMessages, setChatMessages] = useState<{[key: string]: Array<{question: string, answer: string, timestamp: Date}>}>({});
  const [chatInput, setChatInput] = useState<{[key: string]: string}>({});
  const [chatLoading, setChatLoading] = useState<{[key: string]: boolean}>({});
  const chatRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [refreshCounters, setRefreshCounters] = useState<{[key: string]: number}>({});
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  // Load user's watchlist from backend
  useEffect(() => {
    if (isAuthenticated && token) {
      loadUserWatchlist();
    }
  }, [isAuthenticated, token]);

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    Object.keys(chatMessages).forEach(insightId => {
      const containerRef = chatRefs.current[insightId];
      if (containerRef) {
        containerRef.scrollTop = containerRef.scrollHeight;
      }
    });
  }, [chatMessages]);

  const loadUserWatchlist = async () => {
    if (!isAuthenticated || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view your watchlist",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.watchlist.getWatchlist(token);
      if (response && response.data && (response.data as any).stocks) {
        setWatchlist((response.data as any).stocks);
      } else {
        setWatchlist([]);
      }
    } catch (error: any) {
      console.error('Error loading user watchlist:', error);
      if (error.response?.status === 401) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load your watchlist",
          variant: "destructive"
        });
      }
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealStockData = async (symbol: string): Promise<DetailedStockData | null> => {
    try {
      const response = await api.stock.getStockData(symbol);

      if (!response) {
        throw new Error('No response received');
      }

      // Use our bulletproof validator to handle any missing or malformed data
      const validatedData = validateAndFixStockData(response);

      // Ensure we have at least a valid price
      if (validatedData.price <= 0) {
        throw new Error('Invalid price data');
      }

      return validatedData;
    } catch (error) {
      console.error(`Error fetching real data for ${symbol}:`, error);
      return null;
    }
  };

  // Simple dummy market indices (these would need real API integration)
  const marketIndices = [
    { symbol: 'SPX', name: 'S&P 500', price: 0, change: 0, changePercent: 0, sector: 'Broad Market' },
    { symbol: 'DJI', name: 'Dow Jones', price: 0, change: 0, changePercent: 0, sector: 'Blue Chips' },
    { symbol: 'IXIC', name: 'NASDAQ', price: 0, change: 0, changePercent: 0, sector: 'Technology' }
  ];

  // Backend-connected handlers
  const addToWatchlist = async (symbol: string) => {
    if (!isAuthenticated || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add stocks to your watchlist",
        variant: "destructive"
      });
      return;
    }

    if (watchlist.find(stock => stock.symbol === symbol)) {
      toast({
        title: "Already in watchlist",
        description: `${symbol} is already in your watchlist`,
      });
      return;
    }

    setLoading(true);
    try {
      // First verify the stock exists and get its data
      const stockData = await fetchRealStockData(symbol);
      if (!stockData) {
        toast({
          title: "Error",
          description: `Could not fetch data for ${symbol}`,
          variant: "destructive"
        });
        return;
      }

      // Add to backend watchlist
      await api.watchlist.addToWatchlist(token, symbol);

      // Update local state
      setWatchlist(prev => [...prev, stockData]);

      // Clear the search bar after successful addition
      setSearchQuery('');

      toast({
        title: "Success",
        description: `Item added to watchlist`,
      });
    } catch (error: any) {
      console.error('Error adding to watchlist:', error);
      if (error.response?.status === 401) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive"
        });
      } else if (error.response?.status === 400) {
        toast({
          title: "Already in Watchlist",
          description: `${symbol} is already in your watchlist`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to add ${symbol} to watchlist`,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    if (!isAuthenticated || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to remove stocks from your watchlist",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Remove from backend
      await api.watchlist.removeFromWatchlist(token, symbol);

      // Update local state
      setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
      setSelectedStocks(prev => prev.filter(s => s !== symbol));

      toast({
        title: "Success",
        description: `${symbol} removed from watchlist`,
      });
    } catch (error: any) {
      console.error('Error removing from watchlist:', error);
      if (error.response?.status === 401) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to remove ${symbol} from watchlist`,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async (symbol: string) => {
    if (isGeneratingInsight) {
      toast({
        title: "Please Wait",
        description: "AI analysis is already in progress. Please wait for the current analysis to complete.",
      });
      return;
    }

    setIsGeneratingInsight(true);

    try {
      const insight = await api.ai.generateDemoTradingSignal(symbol);

      if (insight) {
        const newInsight = {
          _id: insight._id || insight.id || `insight-${Date.now()}`,
          symbol: insight.symbol,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          action: insight.action,
          reasoning: insight.reasoning,
          timestamp: new Date(insight.createdAt),
          priority: insight.confidence >= 80 ? 'high' : insight.confidence >= 60 ? 'medium' : 'low',
          type: insight.type
        };
        setInsights(prev => [newInsight, ...prev.slice(0, 5)]);
        setActiveTab('insights'); // Switch to insights tab
        toast({
          title: "AI Analysis Complete",
          description: `${insight.action.toUpperCase()} - ${insight.confidence}% confidence`,
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: "Could not generate AI insight",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error generating AI insight:', error);
      toast({
        title: "AI Analysis Error",
        description: "Failed to analyze stock data",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const refreshAllData = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const updatedStocks = await Promise.all(
        watchlist.map(stock => fetchRealStockData(stock.symbol))
      );

      const validStocks = updatedStocks.filter(stock => stock !== null) as DetailedStockData[];
      console.log(`[REFRESH] Fetched ${validStocks.length} stocks (force refresh)`);

      // Track price changes for debugging
      const priceChanges = validStocks.map((newStock, index) => {
        const oldStock = watchlist[index];
        const priceDiff = oldStock ? newStock.price - oldStock.price : 0;
        return {
          symbol: newStock.symbol,
          oldPrice: oldStock ? oldStock.price : 'new',
          newPrice: newStock.price,
          diff: priceDiff,
          significant: Math.abs(priceDiff) >= 0.01
        };
      });

      // Always update refresh counters (regardless of data success)
      setRefreshCounters(prev => {
        const newCounters = { ...prev };
        watchlist.forEach(stock => {
          const symbol = stock.symbol;
          newCounters[symbol] = ((newCounters[symbol] || 0) + 1) % 1000;
        });
        return newCounters;
      });

      // Update watchlist with new data
      setWatchlist(validStocks);
      setLastUpdated(new Date());

      // Debug logging for price changes
      const significantChanges = priceChanges.filter(change => change.significant);
      console.log(`[REFRESH] Price changes: ${significantChanges.length} significant, ${priceChanges.length - significantChanges.length} minor`);

      if (significantChanges.length > 0) {
        console.log(`[REFRESH] Significant changes:`, significantChanges);
      }

      const refreshTime = Date.now() - startTime;
      toast({
        title: `Refreshed (${refreshTime}ms)`,
        description: `${validStocks.length} stocks updated • ${significantChanges.length} price changes`,
      });
    } catch (error) {
      console.error('[REFRESH] Error:', error);
      // Still increment counters even on error
      setRefreshCounters(prev => {
        const newCounters = { ...prev };
        watchlist.forEach(stock => {
          const symbol = stock.symbol;
          newCounters[symbol] = ((newCounters[symbol] || 0) + 1) % 1000;
        });
        return newCounters;
      });

      toast({
        title: "Refresh Failed",
        description: "Could not update all stock data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Chat functionality
  const sendChatMessage = async (symbol: string, message: string, insightContext?: any) => {
    if (!isAuthenticated || !token || !message.trim()) return;

    const insightId = symbol;

    // First add the user question to chat messages
    const chatEntry = {
      question: message.trim(),
      answer: '', // Will be filled when response arrives
      timestamp: new Date(),
      isLoading: true
    };

    setChatMessages(prev => ({
      ...prev,
      [insightId]: [...(prev[insightId] || []), chatEntry]
    }));

    // Clear input immediately
    setChatInput(prev => ({ ...prev, [insightId]: '' }));

    // Set loading state
    setChatLoading(prev => ({ ...prev, [insightId]: true }));

    try {
      const response = await api.ai.chatAboutStock(token, symbol, message.trim(), insightContext);

      if (response) {
        // Update the last message with the response
        setChatMessages(prev => ({
          ...prev,
          [insightId]: (prev[insightId] || []).map((msg, idx) =>
            idx === (prev[insightId] || []).length - 1
              ? { ...msg, answer: response.response, isLoading: false }
              : msg
          )
        }));

        toast({
          title: "AI Response",
          description: "Received answer to your question",
        });
      }
    } catch (error: any) {
      console.error('Error sending chat message:', error);
      // Update with error state
      setChatMessages(prev => ({
        ...prev,
        [insightId]: (prev[insightId] || []).map((msg, idx) =>
          idx === (prev[insightId] || []).length - 1
            ? { ...msg, answer: 'Sorry, there was an error generating a response.', isLoading: false }
            : msg
        )
      }));
      toast({
        title: "Chat Error",
        description: "Could not send message",
        variant: "destructive"
      });
    } finally {
      setChatLoading(prev => ({ ...prev, [insightId]: false }));
    }
  };

  const updateChatInput = (insightId: string, value: string) => {
    setChatInput(prev => ({ ...prev, [insightId]: value }));
  };

  // Remove all technical analysis sections that rely on fake data
  // Keep only the basic overview and real data display

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Professional Market Status Bar */}
      <div className="terminal-panel py-3 border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                marketStatus === 'open'
                  ? 'market-status-active'
                  : 'market-status-closed'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  marketStatus === 'open' ? 'bg-green-500 animate-pulse' :
                  marketStatus === 'after-hours' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span className="font-medium text-foreground">
                  {marketStatus === 'open' ? 'Market Open' :
                   marketStatus === 'after-hours' ? 'After Hours' : 'Market Closed'}
                </span>
              </div>
              <span className="text-muted-foreground font-mono">
                Last Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>Live Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
                <span>AI Powered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold font-nanum mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Stock Dashboard
              </h1>
              <p className="text-muted-foreground">
                Real market data and analysis for {user?.firstName}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="text-muted-foreground text-sm">
                Real-time market data
              </div>
            </div>
          </div>
        </div>



        {/* TradingView Ticker Tape */}
        <div className="mb-5 bg-black border border-blue-600 rounded-lg overflow-hidden" style={{minHeight: '40px'}}>
          <TickerTapeWidget />
        </div>

        {/* Enhanced Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex gap-2 flex-1">
            <SearchSuggestions
              value={searchQuery}
              onChange={setSearchQuery}
              onStockSelect={(symbol) => {
                addToWatchlist(symbol);
              }}
              placeholder="Search stocks (AAPL, TSLA, etc.)"
              disabled={loading}
            />
            <Button onClick={() => searchQuery && addToWatchlist(searchQuery)} disabled={loading || !searchQuery} className="gap-2 bg-primary hover:bg-primary/90">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/portfolio'}
              className="gap-2 border-border"
            >
              <PieChart className="w-4 h-4" />
              Portfolio
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
            <TabsTrigger value="watchlist" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Watchlist</TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">AI Insights</TabsTrigger>
          </TabsList>

          {/* Enhanced Watchlist Tab */}
          <TabsContent value="watchlist" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {watchlist.map((stock) => (
                <Card
                  key={stock.symbol}
                  className={`card-financial ${stock.changePercent >= 0 ? 'bullish-bg' : 'bearish-bg'}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="stock-symbol">{stock.symbol}</div>
                        <div className="stock-name text-sm">{stock.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`font-mono text-sm ${
                            stock.changePercent >= 0
                              ? 'bullish-text border-[#22c55e]/30 bg-[#22c55e]/10'
                              : 'bearish-text border-[#ef4444]/30 bg-[#ef4444]/10'
                          }`}
                        >
                          {stock.changePercent >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {formatPercentage(stock.changePercent)}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(stock.symbol);
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:bearish-text hover:bg-destructive/10"
                          title="Remove from watchlist"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Price Display */}
                      <div className="text-center py-2">
                        <div className="text-3xl font-bold font-mono text-foreground">
                          {formatCurrency(stock.price)}
                        </div>
                        <div className={`text-sm font-semibold ${
                          stock.change >= 0 ? 'bullish-text' : 'bearish-text'
                        }`}>
                          {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)}
                        </div>
                      </div>

                      {/* Market Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="metric-label">Volume</div>
                          <div className="metric-value text-sm">{formatVolume(stock.volume)}</div>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="metric-label">P/E Ratio</div>
                          <div className="metric-value text-sm">{formatNumber(stock.pe, 1)}</div>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="metric-label">Market Cap</div>
                          <div className="metric-value text-sm truncate">{formatMarketCap(stock.marketCap)}</div>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="metric-label">Sector</div>
                          <div className="metric-value text-sm">{stock.sector || 'N/A'}</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStocks(prev =>
                              prev.includes(stock.symbol)
                                ? prev.filter(s => s !== stock.symbol)
                                : [...prev, stock.symbol]
                            );
                          }}
                          className="trading-button-secondary"
                        >
                          {selectedStocks.includes(stock.symbol) ? 'Deselect' : 'Compare'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateInsight(stock.symbol);
                          }}
                          disabled={isGeneratingInsight}
                          className="trading-button-primary"
                        >
                          {isGeneratingInsight ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Brain className="w-3 h-3 mr-1" />
                          )}
                          {isGeneratingInsight ? 'Analyzing...' : 'Analyze'}
                        </Button>
                      </div>

                      {/* View Stock Chart Button */}
                      <div className="flex justify-center pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/stock/${stock.symbol}#chart`;
                          }}
                          className="bg-accent/5 border-accent/20 hover:bg-accent/10 hover:border-accent/30"
                        >
                          <LineChartIcon className="w-3 h-3 mr-1" />
                          View Stock Graph
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {watchlist.length === 0 && !loading && (
              <Card className="bg-card border-border">
                <CardContent className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-xl mb-2 text-foreground">No Stocks in Watchlist</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Add stocks to your watchlist using the search bar above to see real-time market data.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Comparison Table - Only show real data */}
            {selectedStocks.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-nanum text-foreground">Detailed Metrics Comparison</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Side-by-side comparison of {selectedStocks.join(', ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="data-table-header">
                        <tr>
                          <th className="text-left p-4 text-muted-foreground font-semibold">Metric</th>
                          {watchlist
                            .filter(stock => selectedStocks.includes(stock.symbol))
                            .map(stock => (
                              <th key={stock.symbol} className="text-center p-4 text-foreground font-mono font-bold">
                                {stock.symbol}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Price', key: 'price', formatter: formatCurrency },
                          { label: 'Change %', key: 'changePercent', formatter: formatPercentage },
                          { label: 'Volume', key: 'volume', formatter: formatVolume },
                          { label: 'P/E Ratio', key: 'pe', formatter: (v: number | undefined | null) => formatNumber(v, 1) },
                          { label: 'Market Cap', key: 'marketCap', formatter: formatMarketCap }
                        ].map((metric, index) => (
                          <tr key={metric.label} className={`market-data-row ${index % 2 === 0 ? 'bg-muted/20' : ''}`}>
                            <td className="p-4 font-medium text-foreground">{metric.label}</td>
                            {watchlist
                              .filter(stock => selectedStocks.includes(stock.symbol))
                              .map(stock => (
                                <td key={`${stock.symbol}-${metric.key}`} className={`p-4 text-center font-mono ${
                                  metric.key === 'changePercent'
                                    ? stock.changePercent >= 0 ? 'price-gain' : 'price-loss'
                                    : 'text-foreground'
                                }`}>
                                  {metric.formatter((stock as any)[metric.key])}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Refresh Controls */}
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAllData}
                disabled={loading}
                className="gap-2 border-blue-500/50 hover:bg-blue-500/10 hover:border-blue-500"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </TabsContent>

          {/* Enhanced AI Insights Tab - Only basic insights based on real data */}
          <TabsContent value="insights" className="space-y-6">
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight: any) => (
                  <Card key={insight._id} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="font-nanum text-lg text-foreground">{insight.title}</CardTitle>
                            <Badge
                          variant={insight.confidence >= 80 ? 'default' : insight.confidence >= 60 ? 'secondary' : 'outline'}
                          className={`text-xs ${
                            insight.confidence >= 80 ? 'bg-green-500 text-white' :
                            insight.confidence >= 60 ? 'bg-blue-500 text-white' : ''
                          }`}
                        >
                          Analysis ({insight.score || 0} pts)
                        </Badge>
                          </div>
                          <CardDescription className="text-muted-foreground">
                            {insight.symbol} • {new Date(insight.timestamp).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            insight.action === 'buy' ? 'default' :
                            insight.action === 'sell' ? 'destructive' :
                            'secondary'
                          }
                          className={`text-sm ${
                            insight.action === 'buy' ? 'bg-green-500 hover:bg-green-600' :
                            insight.action === 'sell' ? 'bg-red-500 hover:bg-red-600' :
                            ''
                          }`}
                        >
                          {insight.action?.toUpperCase()} ({insight.confidence}%)
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-foreground leading-relaxed">{insight.description}</p>
                      <div className="p-3 bg-muted rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground">
                          <strong>Note:</strong> This is a basic analysis based on available market data.
                          For comprehensive technical analysis, please use dedicated financial analysis tools.
                        </p>
                      </div>

                      {/* Chat Interface */}
                      <div className="border-t border-border pt-4">
                        {/* Prominent Chat Prompt */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 mb-4 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <Brain className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                🤖 Want to know more?
                              </h4>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                Ask me anything about {insight.symbol} - I can explain trends, market conditions, and more!
                              </p>
                            </div>
                            <div className="flex-shrink-0 animate-bounce">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-blue-500" />
                          <h4 className="text-sm font-medium text-foreground">Ask questions about {insight.symbol}</h4>
                        </div>

                        {/* Chat Messages */}
                        {chatMessages[insight.symbol] && chatMessages[insight.symbol].length > 0 && (
                          <div
                            className="space-y-3 mb-4 max-h-60 overflow-y-auto"
                            ref={(el) => chatRefs.current[insight.symbol] = el}
                          >
                            {chatMessages[insight.symbol].map((message, index) => {
                              const isThinking = chatLoading[insight.symbol] && index === chatMessages[insight.symbol].length - 1;
                              return (
                                <div key={index} className="space-y-2">
                                  {/* User Question */}
                                  <div className="flex justify-end">
                                    <div className="bg-blue-500 text-white px-3 py-2 rounded-lg max-w-xs text-sm">
                                      {message.question}
                                    </div>
                                  </div>
                                  {/* AI Answer */}
                                  <div className="flex justify-start items-start gap-2">
                                    {/* Crystal ball on the left side */}
                                    <div className="flex-shrink-0 flex items-start justify-center w-8 h-8 rounded-full shadow-lg relative overflow-hidden">
                                      {isThinking ? (
                                        <div className="w-full h-full animate-spin">
                                          <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                                        </div>
                                      ) : (
                                        <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                                      )}
                                      {/* Mystical shine */}
                                      <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
                                        isThinking ? 'bg-gradient-to-br from-white/20 via-transparent to-white/20 opacity-60' : 'opacity-0'
                                      }`}></div>
                                    </div>
                                    {/* Text bubble */}
                                    <div className="bg-muted text-foreground px-3 py-2 rounded-lg max-w-md text-sm">
                                      {isThinking ? (
                                        <div className="flex items-center gap-2">
                                          <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                          </div>
                                          <span className="text-xs italic text-muted-foreground">Gemini is thinking...</span>
                                        </div>
                                      ) : (
                                        message.answer
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Chat Input */}
                        <div className="flex gap-2">
                          <Input
                            value={chatInput[insight.symbol] || ''}
                            onChange={(e) => updateChatInput(insight.symbol, e.target.value)}
                            placeholder={`Ask about ${insight.symbol}... (e.g., "Why is the price up?", "What are the risks?")`}
                            className="flex-1 text-sm"
                            disabled={chatLoading[insight.symbol]}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const message = chatInput[insight.symbol];
                                if (message?.trim()) {
                                  sendChatMessage(insight.symbol, message, {
                                    insight: insight,
                                    reasoning: insight.reasoning,
                                    action: insight.action,
                                    confidence: insight.confidence
                                  });
                                }
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            disabled={chatLoading[insight.symbol] || !chatInput[insight.symbol]?.trim()}
                            onClick={() => {
                              const message = chatInput[insight.symbol];
                              if (message?.trim()) {
                                sendChatMessage(insight.symbol, message, {
                                  insight: insight,
                                  reasoning: insight.reasoning,
                                  action: insight.action,
                                  confidence: insight.confidence
                                });
                              }
                            }}
                            className="px-4"
                          >
                            {chatLoading[insight.symbol] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Ask'
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="text-center py-12">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-xl mb-2 text-foreground">No AI Insights Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Generate basic insights by clicking "Analyze" on any stock in your watchlist.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>


        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
