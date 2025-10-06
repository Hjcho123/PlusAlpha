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
import { WebSocketService } from "@/services/api";

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
      // Remove maximumFractionDigits constraint to show full precision from Yahoo Finance
      useGrouping: true,
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
  const [wsInstance, setWsInstance] = useState<WebSocketService | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [flashingStocks, setFlashingStocks] = useState<{[key: string]: 'up' | 'down' | null}>({});
  const [watchlistSize, setWatchlistSize] = useState<'compact' | 'normal' | 'spacious'>('normal');
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [refreshCompleted, setRefreshCompleted] = useState(false);

  // Load watchlist size preference from localStorage
  useEffect(() => {
    const savedSize = localStorage.getItem('watchlistSize');
    if (savedSize && ['compact', 'normal', 'spacious'].includes(savedSize)) {
      setWatchlistSize(savedSize as 'compact' | 'normal' | 'spacious');
    }
  }, []);

  // Save watchlist size preference to localStorage
  useEffect(() => {
    localStorage.setItem('watchlistSize', watchlistSize);
  }, [watchlistSize]);

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

  // Automatic refresh every 10 seconds
  useEffect(() => {
    if (watchlist.length > 0) {
      // Start automatic refresh
      refreshIntervalRef.current = setInterval(() => {
        console.log('[AUTO-REFRESH] Refreshing watchlist data...');
        refreshAllData();
      }, 10000); // 10 seconds

      console.log('[AUTO-REFRESH] Started automatic refresh every 10 seconds');

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          console.log('[AUTO-REFRESH] Stopped automatic refresh');
        }
      };
    }
  }, [watchlist.length]); // Only restart when watchlist length changes

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (watchlist.length > 0) {
      console.log('[WEBSOCKET] Initializing WebSocket connection...');

      const ws = new WebSocketService();

      // Connect to WebSocket
      ws.connect().then(() => {
        console.log('[WEBSOCKET] Connected successfully');

        // Subscribe to watchlist symbols
        const symbols = watchlist.map(stock => stock.symbol);
        ws.subscribe(symbols);
        console.log('[WEBSOCKET] Subscribed to symbols:', symbols);

        // Handle real-time price updates
        ws.onPriceUpdate((data) => {
          console.log('[WEBSOCKET] Received price update:', data);

          setWatchlist(prev => prev.map(stock => {
            if (stock.symbol === data.symbol) {
              const oldPrice = stock.price;
              const newPrice = data.price;

              // Trigger flash animation if price changed significantly
            if (Math.abs(newPrice - oldPrice) >= 0.01) {
              const direction = newPrice > oldPrice ? 'down' : 'up'; // INVERTED: green for up, red for down
              setFlashingStocks(prev => ({ ...prev, [data.symbol]: direction }));

              // Clear the flash after animation completes
              setTimeout(() => {
                setFlashingStocks(prev => ({ ...prev, [data.symbol]: null }));
              }, 800);
            }

              return {
                ...stock,
                price: data.price,
                change: data.change || 0,
                changePercent: data.changePercent || 0,
                lastUpdated: new Date().toISOString()
              };
            }
            return stock;
          }));

          setLastUpdated(new Date());
        });

        setWsInstance(ws);

      }).catch(error => {
        console.error('[WEBSOCKET] Connection failed:', error);
      });

      // Cleanup WebSocket on unmount
      return () => {
        if (ws) {
          ws.disconnect();
          console.log('[WEBSOCKET] Disconnected');
        }
      };
    }
  }, [watchlist.length]); // Reconnect when watchlist changes

  // Update WebSocket subscriptions when watchlist changes
  useEffect(() => {
    if (wsInstance && watchlist.length > 0) {
      const symbols = watchlist.map(stock => stock.symbol);
      wsInstance.subscribe(symbols);
      console.log('[WEBSOCKET] Updated subscriptions:', symbols);
    }
  }, [watchlist.map(stock => stock.symbol).join(','), wsInstance]); // Watch for symbol changes

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
    setIsRefreshingData(true);
    setLoading(true);
    const startTime = Date.now();

    try {
      // CRITICAL FIX: Keep existing stock data if fetch fails (don't remove stocks from watchlist)
      const updatedStocks = await Promise.all(
        watchlist.map(async (stock) => {
          const newData = await fetchRealStockData(stock.symbol);
          return newData || stock; // KEEP EXISTING DATA if fetch fails
        })
      );

      console.log(`[REFRESH] Fetched ${updatedStocks.length} stocks (force refresh) - no data loss possible`);

      // Track price changes for debugging
      const priceChanges = updatedStocks.map((newStock, index) => {
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

      // Trigger flash animations for price changes
      updatedStocks.forEach((newStock, index) => {
        const oldStock = watchlist[index];
        if (oldStock && Math.abs(newStock.price - oldStock.price) >= 0.01) {
          const direction = newStock.price > oldStock.price ? 'down' : 'up'; // FIXED: green for up, red for down
          setFlashingStocks(prev => ({ ...prev, [newStock.symbol]: direction }));

          // Clear the flash after animation completes
          setTimeout(() => {
            setFlashingStocks(prev => ({ ...prev, [newStock.symbol]: null }));
          }, 800);
        }
      });

      // Update watchlist with new data (CRITICAL: No stocks removed)
      setWatchlist(updatedStocks);
      setLastUpdated(new Date());

      // Debug logging for price changes
      const significantChanges = priceChanges.filter(change => change.significant);
      console.log(`[REFRESH] Price changes: ${significantChanges.length} significant, ${priceChanges.length - significantChanges.length} minor`);

      if (significantChanges.length > 0) {
        console.log(`[REFRESH] Significant changes:`, significantChanges);
      }

      const refreshTime = Date.now() - startTime;

      // TRIGGER GREEN FLASH INSTEAD OF TOAST
      setRefreshCompleted(true);
      setTimeout(() => setRefreshCompleted(false), 1000); // Flash green for 1 second

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

      // No toast - just log error
    } finally {
      setLoading(false);
      setIsRefreshingData(false);
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

          {/* Bloomberg-Style Terminal Watchlist */}
          <TabsContent value="watchlist" className="space-y-6">
            <Card className="bg-slate-900 border-slate-700 terminal-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* LEFT SIDE: SIZE CONTROLS */}
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${marketStatus === 'open' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                      <span className="text-green-700 dark:text-green-400 text-sm font-mono">LIVE WATCHLIST</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400 mr-1 font-mono">SIZE:</span>
                      <Button
                        size="sm"
                        variant={watchlistSize === 'compact' ? 'default' : 'ghost'}
                        onClick={() => setWatchlistSize('compact')}
                        className={`h-6 px-2 text-xs font-mono ${
                          watchlistSize === 'compact' ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        COMPACT
                      </Button>
                      <Button
                        size="sm"
                        variant={watchlistSize === 'normal' ? 'default' : 'ghost'}
                        onClick={() => setWatchlistSize('normal')}
                        className={`h-6 px-2 text-xs font-mono ${
                          watchlistSize === 'normal' ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        NORMAL
                      </Button>
                      <Button
                        size="sm"
                        variant={watchlistSize === 'spacious' ? 'default' : 'ghost'}
                        onClick={() => setWatchlistSize('spacious')}
                        className={`h-6 px-2 text-xs font-mono ${
                          watchlistSize === 'spacious' ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        SPACIOUS
                      </Button>
                    </div>
                  </div>

                  {/* RIGHT SIDE: SYMBOLS COUNT + AUTO-REFRESH INDICATOR */}
                  <div className="flex items-center gap-4">
                    <div className="text-slate-400 text-xs font-mono">
                      {watchlist.length} SYMBOLS • {lastUpdated.toLocaleTimeString()}
                    </div>
                    <Badge
                      variant="outline"
                      className={`font-mono transition-all duration-300 ${
                        isRefreshingData
                          ? 'border-orange-400 bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300'
                          : refreshCompleted
                          ? 'border-green-400 bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300'
                          : 'border-gray-600 dark:border-gray-300 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      {isRefreshingData ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          UPDATING
                        </>
                      ) : (
                        'Auto-Refresh: 10s'
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Watchlist Terminal Table with Size Options */}
                <div className="terminal-table-container">
                  <table className={`terminal-table ${watchlistSize}`}>
                    <thead className={`terminal-table-header ${watchlistSize}`}>
                      <tr>
                        <th className={`terminal-th text-left pl-6 ${watchlistSize}`}>SYMBOL</th>
                        <th className={`terminal-th text-left ${watchlistSize}`}>NAME</th>
                        <th className={`terminal-th text-right pr-6 ${watchlistSize}`}>PRICE</th>
                        <th className={`terminal-th text-right ${watchlistSize}`}>CHANGE</th>
                        <th className={`terminal-th text-right ${watchlistSize}`}>%CHG</th>
                        <th className={`terminal-th text-center ${watchlistSize}`}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {watchlist.map((stock, index) => (
                        <tr
                          key={stock.symbol}
                          className={`terminal-tr hover:bg-slate-800/50 ${
                            index % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/10'
                          } ${
                            flashingStocks[stock.symbol] === 'up' ? 'price-flash-row-up' :
                            flashingStocks[stock.symbol] === 'down' ? 'price-flash-row-down' :
                            ''
                          } ${watchlistSize}`}
                        >
                          {/* Symbol */}
                          <td className={`terminal-td pl-6 ${watchlistSize}`}>
                            <div className={`terminal-symbol ${
                              flashingStocks[stock.symbol] === 'up' ? 'price-flash-up' :
                              flashingStocks[stock.symbol] === 'down' ? 'price-flash-down' :
                              'price-flash-no-animation'
                            }`}>
                              {stock.symbol}
                            </div>
                          </td>

                          {/* Company Name */}
                          <td className={`terminal-td ${watchlistSize}`}>
                            <div className={`terminal-company truncate max-w-xs ${watchlistSize}`} title={stock.name}>
                              {stock.name}
                            </div>
                          </td>

                          {/* Price */}
                          <td className={`terminal-td text-right pr-6 ${watchlistSize}`}>
                            <div className={`terminal-price ${
                              flashingStocks[stock.symbol] === 'up' ? 'price-flash-up' :
                              flashingStocks[stock.symbol] === 'down' ? 'price-flash-down' :
                              'price-flash-no-animation'
                            } text-blue-700`}>
                              {formatCurrency(stock.price)}
                            </div>
                          </td>

                          {/* Change */}
                          <td className={`terminal-td text-right ${watchlistSize}`}>
                            <div className={`terminal-change ${
                              stock.change >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-red-600'
                            } ${
                              flashingStocks[stock.symbol] === 'up' ? 'price-flash-up' :
                              flashingStocks[stock.symbol] === 'down' ? 'price-flash-down' :
                              'price-flash-no-animation'
                            }`}>
                              {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)}
                            </div>
                          </td>

                          {/* Change Percent */}
                          <td className={`terminal-td text-right ${watchlistSize}`}>
                            <div className={`terminal-change-percent ${
                              stock.changePercent >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-red-600'
                            } ${
                              flashingStocks[stock.symbol] === 'up' ? 'price-flash-up' :
                              flashingStocks[stock.symbol] === 'down' ? 'price-flash-down' :
                              'price-flash-no-animation'
                            } flex items-center justify-end gap-1`}>
                              {stock.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {formatPercentage(stock.changePercent)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className={`terminal-td text-center ${watchlistSize}`}>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateInsight(stock.symbol);
                                }}
                                disabled={isGeneratingInsight}
                                className={`terminal-action-button ${watchlistSize}`}
                              >
                                {isGeneratingInsight ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Brain className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/stock/${stock.symbol}#chart`;
                                }}
                                className={`terminal-action-button ${watchlistSize}`}
                              >
                                <LineChartIcon className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromWatchlist(stock.symbol)}
                                className={`terminal-action-button text-red-400 hover:text-red-300 ${watchlistSize}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {watchlist.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="text-slate-500 mb-4">
                      <BarChart3 className="w-12 h-12 mx-auto" />
                    </div>
                    <h3 className="text-slate-400 mb-2">NO SYMBOLS IN WATCHLIST</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                      Add stocks using the search bar above to populate your live terminal view
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
