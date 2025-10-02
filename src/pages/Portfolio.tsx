import React, { useState, useEffect } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { api, StockData } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  DollarSign, 
  Percent,
  Calendar,
  Target,
  AlertCircle,
  Edit3,
  Save,
  X,
  Loader2
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  sector: string;
  purchaseDate: string;
}

interface PortfolioSummary {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  totalInvested: number;
}

const Portfolio = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary>({
    totalValue: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    dayChange: 0,
    dayChangePercent: 0,
    totalInvested: 0
  });
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingHolding, setEditingHolding] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<StockData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [newHolding, setNewHolding] = useState({
    symbol: '',
    shares: '',
    averagePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadPortfolio();
    }
  }, [isAuthenticated]);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      // Load saved portfolio from localStorage or API
      const savedPortfolio = localStorage.getItem(`portfolio_${user?.email}`);
      if (savedPortfolio) {
        const portfolio = JSON.parse(savedPortfolio);
        await updateHoldingsWithCurrentPrices(portfolio);
      } else {
        // Initialize with sample data
        const sampleHoldings = [
          {
            id: '1',
            symbol: 'AAPL',
            name: 'Apple Inc.',
            shares: 10,
            averagePrice: 150.00,
            sector: 'Technology',
            purchaseDate: '2024-01-15'
          },
          {
            id: '2',
            symbol: 'GOOGL',
            name: 'Alphabet Inc.',
            shares: 5,
            averagePrice: 2800.00,
            sector: 'Technology',
            purchaseDate: '2024-02-01'
          }
        ];
        await updateHoldingsWithCurrentPrices(sampleHoldings);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolio data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateHoldingsWithCurrentPrices = async (holdingsData: any[]) => {
    try {
      const updatedHoldings = await Promise.all(
        holdingsData.map(async (holding) => {
          try {
            const stockData = await api.stock.getStockData(holding.symbol);
            const currentPrice = stockData.price;
            const totalValue = holding.shares * currentPrice;
            const totalCost = holding.shares * holding.averagePrice;
            const gainLoss = totalValue - totalCost;
            const gainLossPercent = (gainLoss / totalCost) * 100;

            return {
              ...holding,
              currentPrice,
              totalValue,
              gainLoss,
              gainLossPercent,
              name: stockData.name || holding.name
            };
          } catch (error) {
            console.error(`Error fetching data for ${holding.symbol}:`, error);
            return {
              ...holding,
              currentPrice: holding.averagePrice,
              totalValue: holding.shares * holding.averagePrice,
              gainLoss: 0,
              gainLossPercent: 0
            };
          }
        })
      );

      setHoldings(updatedHoldings);
      calculatePortfolioSummary(updatedHoldings);
      
      // Save to localStorage
      localStorage.setItem(`portfolio_${user?.email}`, JSON.stringify(updatedHoldings));
    } catch (error) {
      console.error('Error updating holdings:', error);
    }
  };

  const calculatePortfolioSummary = (holdingsData: Holding[]) => {
    const totalValue = holdingsData.reduce((sum, holding) => sum + holding.totalValue, 0);
    const totalInvested = holdingsData.reduce((sum, holding) => sum + (holding.shares * holding.averagePrice), 0);
    const totalGainLoss = totalValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
    
    // Mock day change (in real app, this would come from API)
    const dayChange = totalValue * (Math.random() - 0.5) * 0.02; // ±1% random change
    const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

    setPortfolioSummary({
      totalValue,
      totalGainLoss,
      totalGainLossPercent,
      dayChange,
      dayChangePercent,
      totalInvested
    });
  };

  // Popular stock suggestions
  const popularStocks = [
    'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META', 'NFLX', 
    'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'UBER', 'SPOT',
    'JPM', 'BAC', 'WFC', 'GS', 'V', 'MA', 'DIS', 'KO', 'PEP', 'WMT'
  ];

  const searchStock = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);

    // If query is short, show popular suggestions that match
    if (query.length <= 2) {
      const suggestions = popularStocks
        .filter(symbol => symbol.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 8);
      
      try {
        const stockPromises = suggestions.map(symbol => api.stock.getStockData(symbol));
        const stocks = await Promise.all(stockPromises);
        setSearchResults(stocks.filter(stock => stock !== null));
      } catch (error) {
        setSearchResults([]);
      }
      return;
    }

    // For longer queries, try exact match first
    try {
      const stockData = await api.stock.getStockData(query.toUpperCase());
      setSearchResults([stockData]);
    } catch (error) {
      // If exact match fails, show popular suggestions
      const suggestions = popularStocks
        .filter(symbol => symbol.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
      
      try {
        const stockPromises = suggestions.map(symbol => api.stock.getStockData(symbol));
        const stocks = await Promise.all(stockPromises);
        setSearchResults(stocks.filter(stock => stock !== null));
      } catch (error) {
        setSearchResults([]);
      }
    }
  };

  const addHolding = async () => {
    if (!newHolding.symbol || !newHolding.shares || !newHolding.averagePrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const stockData = await api.stock.getStockData(newHolding.symbol.toUpperCase());
      
      const holding: Holding = {
        id: Date.now().toString(),
        symbol: stockData.symbol,
        name: stockData.name,
        shares: parseFloat(newHolding.shares),
        averagePrice: parseFloat(newHolding.averagePrice),
        currentPrice: stockData.price,
        totalValue: parseFloat(newHolding.shares) * stockData.price,
        gainLoss: (parseFloat(newHolding.shares) * stockData.price) - (parseFloat(newHolding.shares) * parseFloat(newHolding.averagePrice)),
        gainLossPercent: ((stockData.price - parseFloat(newHolding.averagePrice)) / parseFloat(newHolding.averagePrice)) * 100,
        sector: 'Technology', // In real app, this would come from stock data
        purchaseDate: newHolding.purchaseDate
      };

      const updatedHoldings = [...holdings, holding];
      setHoldings(updatedHoldings);
      calculatePortfolioSummary(updatedHoldings);
      
      // Save to localStorage
      localStorage.setItem(`portfolio_${user?.email}`, JSON.stringify(updatedHoldings));

      setNewHolding({
        symbol: '',
        shares: '',
        averagePrice: '',
        purchaseDate: new Date().toISOString().split('T')[0]
      });
      setShowAddDialog(false);
      setSearchResults([]);

      toast({
        title: "Holding Added",
        description: `${holding.symbol} has been added to your portfolio`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add holding to portfolio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeHolding = (holdingId: string) => {
    const updatedHoldings = holdings.filter(h => h.id !== holdingId);
    setHoldings(updatedHoldings);
    calculatePortfolioSummary(updatedHoldings);
    
    // Save to localStorage
    localStorage.setItem(`portfolio_${user?.email}`, JSON.stringify(updatedHoldings));

    toast({
      title: "Holding Removed",
      description: "The holding has been removed from your portfolio",
    });
  };

  const updateHolding = async (holdingId: string, updatedData: Partial<Holding>) => {
    const updatedHoldings = holdings.map(holding => {
      if (holding.id === holdingId) {
        const updated = { ...holding, ...updatedData };
        // Recalculate values
        updated.totalValue = updated.shares * updated.currentPrice;
        const totalCost = updated.shares * updated.averagePrice;
        updated.gainLoss = updated.totalValue - totalCost;
        updated.gainLossPercent = (updated.gainLoss / totalCost) * 100;
        return updated;
      }
      return holding;
    });

    setHoldings(updatedHoldings);
    calculatePortfolioSummary(updatedHoldings);
    
    // Save to localStorage
    localStorage.setItem(`portfolio_${user?.email}`, JSON.stringify(updatedHoldings));
    
    setEditingHolding(null);
    toast({
      title: "Holding Updated",
      description: "Your holding has been updated successfully",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Prepare data for charts
  const pieChartData = holdings.map(holding => ({
    name: holding.symbol,
    value: holding.totalValue,
    percentage: (holding.totalValue / portfolioSummary.totalValue) * 100
  }));

  const barChartData = holdings.map(holding => ({
    symbol: holding.symbol,
    invested: holding.shares * holding.averagePrice,
    current: holding.totalValue,
    gainLoss: holding.gainLoss
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-24 px-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Please log in to view your portfolio.</p>
          <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-24 px-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-nanum mb-2">Portfolio</h1>
            <p className="text-muted-foreground">Track and manage your investment holdings</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Holding
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Holding</DialogTitle>
                <DialogDescription>
                  Add a stock to your portfolio by entering the details below.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="relative">
                  <Label htmlFor="symbol">Stock Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., AAPL, GOOGL, MSFT..."
                    value={newHolding.symbol}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setNewHolding(prev => ({ ...prev, symbol: value }));
                      searchStock(value);
                    }}
                    onFocus={() => {
                      if (newHolding.symbol) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicking
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                  />
                  
                  {showSuggestions && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((stock, index) => (
                        <div
                          key={stock.symbol}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setNewHolding(prev => ({ ...prev, symbol: stock.symbol }));
                            setSearchResults([stock]);
                            setShowSuggestions(false);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{stock.symbol}</div>
                              <div className="text-sm text-muted-foreground truncate">{stock.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(stock.price)}</div>
                              <div className={`text-sm ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(stock.changePercent)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!showSuggestions && searchResults.length > 0 && newHolding.symbol && (
                    <div className="mt-2 p-3 border rounded-md bg-muted">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{searchResults[0].symbol} - {searchResults[0].name}</div>
                          <div className="text-sm text-muted-foreground">Current Price: {formatCurrency(searchResults[0].price)}</div>
                        </div>
                        <div className={`text-sm ${searchResults[0].changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(searchResults[0].changePercent)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="shares">Number of Shares</Label>
                  <Input
                    id="shares"
                    type="number"
                    step="0.001"
                    placeholder="e.g., 10"
                    value={newHolding.shares}
                    onChange={(e) => setNewHolding(prev => ({ ...prev, shares: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="averagePrice">Average Purchase Price</Label>
                  <Input
                    id="averagePrice"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 150.00"
                    value={newHolding.averagePrice}
                    onChange={(e) => setNewHolding(prev => ({ ...prev, averagePrice: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={newHolding.purchaseDate}
                    onChange={(e) => setNewHolding(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={addHolding} disabled={loading} className="flex-1">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Holding
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.totalValue)}</div>
              <div className={`text-sm flex items-center gap-1 ${
                portfolioSummary.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolioSummary.dayChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {formatCurrency(Math.abs(portfolioSummary.dayChange))} ({formatPercentage(portfolioSummary.dayChangePercent)}) today
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                portfolioSummary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(portfolioSummary.totalGainLoss)}
              </div>
              <div className={`text-sm ${
                portfolioSummary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(portfolioSummary.totalGainLossPercent)} return
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.totalInvested)}</div>
              <div className="text-sm text-muted-foreground">
                {holdings.length} holdings
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
            </CardHeader>
            <CardContent>
              {holdings.length > 0 ? (
                <>
                  <div className="text-2xl font-bold">
                    {holdings.reduce((best, holding) => 
                      holding.gainLossPercent > best.gainLossPercent ? holding : best
                    ).symbol}
                  </div>
                  <div className="text-sm text-green-600">
                    {formatPercentage(Math.max(...holdings.map(h => h.gainLossPercent)))}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No holdings yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="holdings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Holdings Tab */}
          <TabsContent value="holdings" className="space-y-6">
            {holdings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="font-nanum">Your Holdings</CardTitle>
                  <CardDescription>Manage your investment positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Symbol</th>
                          <th className="text-right p-3">Shares</th>
                          <th className="text-right p-3">Avg Price</th>
                          <th className="text-right p-3">Current Price</th>
                          <th className="text-right p-3">Total Value</th>
                          <th className="text-right p-3">Gain/Loss</th>
                          <th className="text-right p-3">%</th>
                          <th className="text-center p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((holding) => (
                          <tr key={holding.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div>
                                <div className="font-medium">{holding.symbol}</div>
                                <div className="text-xs text-muted-foreground">{holding.name}</div>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              {editingHolding === holding.id ? (
                                <Input
                                  type="number"
                                  step="0.001"
                                  defaultValue={holding.shares}
                                  className="w-20 text-right"
                                  onBlur={(e) => updateHolding(holding.id, { shares: parseFloat(e.target.value) })}
                                />
                              ) : (
                                holding.shares.toFixed(3)
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {editingHolding === holding.id ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  defaultValue={holding.averagePrice}
                                  className="w-24 text-right"
                                  onBlur={(e) => updateHolding(holding.id, { averagePrice: parseFloat(e.target.value) })}
                                />
                              ) : (
                                formatCurrency(holding.averagePrice)
                              )}
                            </td>
                            <td className="p-3 text-right">{formatCurrency(holding.currentPrice)}</td>
                            <td className="p-3 text-right font-medium">{formatCurrency(holding.totalValue)}</td>
                            <td className={`p-3 text-right ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(holding.gainLoss)}
                            </td>
                            <td className={`p-3 text-right ${holding.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(holding.gainLossPercent)}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingHolding(editingHolding === holding.id ? null : holding.id)}
                                >
                                  {editingHolding === holding.id ? <Save className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeHolding(holding.id)}
                                  className="text-red-600 hover:text-red-700"
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
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <PieChart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Holdings Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your portfolio by adding your first holding
                  </p>
                  <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Holding
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Allocation Tab */}
          <TabsContent value="allocation" className="space-y-6">
            {holdings.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-nanum">Portfolio Allocation</CardTitle>
                    <CardDescription>Distribution by holdings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-nanum">Allocation Details</CardTitle>
                    <CardDescription>Breakdown by percentage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pieChartData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(item.value)}</div>
                            <div className="text-sm text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Data Available</h3>
                  <p className="text-muted-foreground">Add holdings to see allocation charts</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {holdings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="font-nanum">Performance Comparison</CardTitle>
                  <CardDescription>Invested vs Current Value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="symbol" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="invested" fill="#8884d8" name="Invested" />
                        <Bar dataKey="current" fill="#82ca9d" name="Current Value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No Performance Data</h3>
                  <p className="text-muted-foreground">Add holdings to track performance</p>
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

export default Portfolio;
