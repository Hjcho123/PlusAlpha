import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Activity, Loader2, BarChart as BarChartIcon, LineChart as LineChartIcon } from 'lucide-react';
import { api, WebSocketService } from '../services/api';

interface StockChartProps {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

interface ChartDataPoint {
  date: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
  dateObj?: Date;
  ma5?: number;
  ma20?: number;
  ma50?: number;
  rsi?: number;
}

const StockChart: React.FC<StockChartProps> = ({ 
  symbol, 
  name, 
  currentPrice, 
  change, 
  changePercent 
}) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'candlestick'>('line');
  const [timeframe, setTimeframe] = useState('1mo');
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.stock.getMarketData(symbol, timeframe, '1day');
      
      if (Array.isArray(data) && data.length > 0) {
        const transformedData = transformApiData(data);
        const dataWithIndicators = addTechnicalIndicators(transformedData);
        setChartData(dataWithIndicators);
      } else {
        generateMockData();
      }
    } catch (err: any) {
      console.warn('API fetch failed, using mock data:', err);
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const transformApiData = (apiData: any[]): ChartDataPoint[] => {
    return apiData.map((item: any) => {
      const date = item.date ? new Date(item.date) : new Date();
      const close = item.close || item.price || currentPrice;
      const open = item.open || close;
      const high = item.high || close; // Use close if high unavailable
      const low = item.low || close; // Use close if low unavailable
      const volume = item.volume || 0; // Explicit 0 if no volume

      return {
        date: date.toISOString().split('T')[0],
        price: close,
        volume,
        high: Math.max(high, low + 0.01),
        low: Math.min(low, high - 0.01),
        open,
        close
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const addTechnicalIndicators = (data: ChartDataPoint[]): ChartDataPoint[] => {
    const closes = data.map(d => d.close);
    
    return data.map((point, index) => {
      const result = { ...point };
      
      if (index >= 4) {
        result.ma5 = closes.slice(index - 4, index + 1).reduce((a, b) => a + b) / 5;
      }
      if (index >= 19) {
        result.ma20 = closes.slice(index - 19, index + 1).reduce((a, b) => a + b) / 20;
      }
      if (index >= 49) {
        result.ma50 = closes.slice(index - 49, index + 1).reduce((a, b) => a + b) / 50;
      }
      
      if (index >= 14) {
        const periodCloses = closes.slice(index - 14, index + 1);
        let gains = 0;
        let losses = 0;
        
        for (let i = 1; i < periodCloses.length; i++) {
          const change = periodCloses[i] - periodCloses[i - 1];
          if (change > 0) {
            gains += change;
          } else {
            losses += Math.abs(change);
          }
        }
        
        const avgGain = gains / 14;
        const avgLoss = losses / 14;
        
        if (avgLoss === 0) {
          result.rsi = 100;
        } else {
          const rs = avgGain / avgLoss;
          result.rsi = 100 - (100 / (1 + rs));
        }
      }
      
      return result;
    });
  };

  const generateMockData = () => {
    const mockData: ChartDataPoint[] = [];
    const basePrice = currentPrice;

    const now = new Date();
    now.setHours(16, 0, 0, 0); // Set to 4:00 PM market close
    
    const timeframeConfig: { [key: string]: number } = {
      '1d': 24,
      '5d': 5,
      '1w': 7,
      '1mo': 30,
      '3mo': 90,
      '6mo': 180,
      '1y': 252,
      '2y': 504,
      '5y': 1260,
      'max': 2520
    };

    const dataPoints = timeframeConfig[timeframe] || 30;
    let currentPricePoint = basePrice * 0.95;

    // Generate deterministic values based on symbol
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    console.log(`Generating ${dataPoints} data points for ${symbol}, starting from ${now.toISOString().split('T')[0]}`);

    for (let i = 0; i < dataPoints; i++) {
      // Calculate date properly - go backwards from today
      const date = new Date(now);
      // For 30 data points: i=0 is 29 days ago, i=29 is today (markets are open on non-weekends)
      const daysBack = dataPoints - 1 - i;
      date.setDate(date.getDate() - daysBack);

      // Skip weekends if we're doing intraday data, but for now include all days
      const progress = i / Math.max(dataPoints - 1, 1); // 0 to 1 progression
      const volatility = 0.02;
      const trend = changePercent / 100;

      // Price fluctuations removed - use only real data
      const open = currentPricePoint;
      const close = currentPricePoint;
      const high = currentPricePoint;
      const low = currentPricePoint;

      // Ensure valid high/low relationships
      const validHigh = Math.max(high, Math.max(open, close));
      const validLow = Math.min(low, Math.min(open, close));
      const validClose = Math.max(validLow, Math.min(validHigh, close));
      const validOpen = Math.max(validLow, Math.min(validHigh, open));

      mockData.push({
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        dateObj: date, // Keep date object for tooltip formatting
        price: validClose,
        volume: Math.floor(Math.abs(Math.sin(i * 456.789 + seed)) * 10000000) + 1000000,
        high: validHigh,
        low: validLow,
        open: validOpen,
        close: validClose
      });

      console.log(`${symbol} - Index ${i}: Date ${date.toISOString().split('T')[0]}, Price: ${validClose.toFixed(2)}`);
    }

    // Ensure the last data point matches current price
    mockData[mockData.length - 1].close = currentPrice;
    mockData[mockData.length - 1].price = currentPrice;
    mockData[mockData.length - 1].high = Math.max(mockData[mockData.length - 1].high, currentPrice);
    mockData[mockData.length - 1].low = Math.min(mockData[mockData.length - 1].low, currentPrice);

    const dataWithIndicators = addTechnicalIndicators(mockData);
    setChartData(dataWithIndicators);
  };

  useEffect(() => {
    fetchChartData();
  }, [symbol, timeframe, fetchChartData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (timeframe === '1d') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: timeframe.includes('y') || timeframe === 'max' ? 'numeric' : undefined
    });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      // Use the dateObj if available, otherwise parse the date string
      const date = data.dateObj || new Date(data.date + 'T16:00:00'); // Default to 4 PM market close

      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2 text-foreground">
            {date.toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
          <div className="space-y-1 text-sm">
            {chartType === 'candlestick' ? (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Open:</span>
                  <span className="font-medium text-foreground">{formatCurrency(data.open)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">High:</span>
                  <span className="font-medium text-green-500">{formatCurrency(data.high)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Low:</span>
                  <span className="font-medium text-red-500">{formatCurrency(data.low)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Close:</span>
                  <span className="font-medium text-foreground">{formatCurrency(data.close)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium text-foreground">{formatCurrency(data.price)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium text-foreground">{(data.volume / 1000000).toFixed(2)}M</span>
            </div>
            {data.ma20 && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">MA20:</span>
                <span className="font-medium text-blue-500">{formatCurrency(data.ma20)}</span>
              </div>
            )}
            {/* RSI removed - data unavailable */}
          </div>
        </div>
      );
    }
    return null;
  };

  const CandlestickChart: React.FC = () => {
    if (chartData.length === 0) return null;

    const minPrice = Math.min(...chartData.map(d => d.low));
    const maxPrice = Math.max(...chartData.map(d => d.high));
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="date"
            tick={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            domain={[minPrice - padding, maxPrice + padding]}
            tickFormatter={(value) => `$${value.toFixed(value < 10 ? 2 : 0)}`}
            tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="close" 
            fill="transparent"
            shape={(props: any) => {
              const { x, y, width, height, payload } = props;
              if (!payload) return null;

              const { open, close, high, low } = payload;
              const isGreen = close >= open;
              const color = isGreen ? '#22c55e' : '#ef4444';

              const yScale = height / (maxPrice - minPrice + padding * 2);
              const openY = y + (maxPrice + padding - open) * yScale;
              const closeY = y + (maxPrice + padding - close) * yScale;
              const highY = y + (maxPrice + padding - high) * yScale;
              const lowY = y + (maxPrice + padding - low) * yScale;

              const bodyHeight = Math.abs(closeY - openY);
              const bodyY = Math.min(openY, closeY);
              const candleWidth = Math.min(width * 0.6, 8);
              const xCenter = x + width / 2;

              return (
                <g>
                  <line
                    x1={xCenter}
                    y1={highY}
                    x2={xCenter}
                    y2={lowY}
                    stroke={color}
                    strokeWidth={1}
                  />
                  <rect
                    x={xCenter - candleWidth / 2}
                    y={bodyY}
                    width={candleWidth}
                    height={Math.max(bodyHeight, 1)}
                    fill={color}
                    stroke={color}
                    strokeWidth={1}
                  />
                </g>
              );
            }}
          />
          {chartData.some(d => d.ma20) && (
            <Line
              type="monotone"
              dataKey="ma20"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="MA20"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>No chart data available</p>
        </div>
      );
    }

    if (chartType === 'candlestick') {
      return <CandlestickChart />;
    }

    const ChartComponent = chartType === 'area' ? AreaChart : 
                          chartType === 'bar' ? BarChart : LineChart;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="date"
            tick={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(value < 10 ? 2 : 0)}`}
            tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {chartType === 'area' ? (
            <Area
              type="monotone"
              dataKey="price"
              stroke={change >= 0 ? '#22c55e' : '#ef4444'}
              fill={change >= 0 ? '#22c55e' : '#ef4444'}
              fillOpacity={0.1}
              strokeWidth={2}
            />
          ) : chartType === 'bar' ? (
            <Bar 
              dataKey="price" 
              fill={change >= 0 ? '#22c55e' : '#ef4444'}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="price"
              stroke={change >= 0 ? '#22c55e' : '#ef4444'}
              strokeWidth={2}
              dot={false}
            />
          )}
          
          {chartData.some(d => d.ma5) && chartType === 'line' && (
            <Line
              type="monotone"
              dataKey="ma5"
              stroke="#ff7300"
              strokeWidth={1}
              dot={false}
              strokeDasharray="3 3"
              name="MA5"
            />
          )}
          {chartData.some(d => d.ma20) && chartType === 'line' && (
            <Line
              type="monotone"
              dataKey="ma20"
              stroke="#3b82f6"
              strokeWidth={1}
              dot={false}
              strokeDasharray="3 3"
              name="MA20"
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-nanum text-foreground">{symbol} Chart</CardTitle>
            <CardDescription className="text-muted-foreground">{name}</CardDescription>
          </div>
          <Badge variant={change >= 0 ? 'default' : 'destructive'}>
            {change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {formatCurrency(Math.abs(change))} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-24 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">1D</SelectItem>
                  <SelectItem value="5d">5D</SelectItem>
                  <SelectItem value="1w">1W</SelectItem>
                  <SelectItem value="1mo">1M</SelectItem>
                  <SelectItem value="3mo">3M</SelectItem>
                  <SelectItem value="6mo">6M</SelectItem>
                  <SelectItem value="1y">1Y</SelectItem>
                  <SelectItem value="2y">2Y</SelectItem>
                  <SelectItem value="5y">5Y</SelectItem>
                  <SelectItem value="max">MAX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-1">
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                className="border-border"
              >
                <Activity className="w-3 h-3" />
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('area')}
                className="border-border"
              >
                <BarChart3 className="w-3 h-3" />
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="border-border"
              >
                <BarChartIcon className="w-3 h-3" />
              </Button>
              <Button
                variant={chartType === 'candlestick' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('candlestick')}
                className="border-border"
              >
                <LineChartIcon className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>{error}</p>
              </div>
            ) : (
              renderChart()
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockChart;
