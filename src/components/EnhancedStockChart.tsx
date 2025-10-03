import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Volume2,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

interface EnhancedStockChartProps {
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
}

const EnhancedStockChart: React.FC<EnhancedStockChartProps> = ({
  symbol,
  name,
  currentPrice,
  change,
  changePercent
}) => {
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [timeframe, setTimeframe] = useState('1mo');
  const [error, setError] = useState<string | null>(null);

  // Generate mock data for chart display
  const generateChartData = useMemo((): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const now = new Date();
    now.setHours(16, 0, 0, 0); // Market close

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
    };

    const dataPoints = timeframeConfig[timeframe] || 30;
    let closePrice = currentPrice;

    // Seed for deterministic price movements
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let i = 0; i < dataPoints; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (dataPoints - 1 - i));

      // Generate realistic price movements
      const volatility = 0.02;
      const trend = changePercent / 100 / dataPoints;

      const rand1 = Math.sin(i * 12.9898 + seed) * 0.5 + 0.5;
      const rand2 = Math.cos(i * 78.233 + seed) * 0.5 + 0.5;
      const rand3 = Math.sin(i * 45.678 + seed) * 0.5 + 0.5;

      const dailyVolatility = closePrice * volatility;
      const dailyChange = (rand1 - 0.5) * dailyVolatility * 2 + trend * closePrice;

      const open = closePrice;
      const close = open + dailyChange;
      const high = Math.max(open, close) + Math.abs(rand2) * dailyVolatility * 0.5;
      const low = Math.min(open, close) - Math.abs(rand3) * dailyVolatility * 0.5;

      data.push({
        date: date.toISOString().split('T')[0],
        price: close,
        volume: Math.floor((rand1 * 10000000 + 1000000)),
        high: high,
        low: low,
        open: open,
        close: close
      });

      closePrice = close;
    }

    // Ensure last data point matches current price
    if (data.length > 0) {
      data[data.length - 1].close = currentPrice;
      data[data.length - 1].price = currentPrice;
    }

    return data;
  }, [symbol, currentPrice, changePercent, timeframe]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2 text-foreground">
            {new Date(label).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: timeframe.includes('y') ? 'numeric' : undefined
            })}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-medium text-foreground">{formatCurrency(data.price || data.close)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium text-foreground">{(data.volume / 1000000).toFixed(2)}M</span>
            </div>
            {data.high && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">High:</span>
                <span className="font-medium text-green-500">{formatCurrency(data.high)}</span>
              </div>
            )}
            {data.low && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Low:</span>
                <span className="font-medium text-red-500">{formatCurrency(data.low)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartType === 'area') {
      return (
        <AreaChart data={generateChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
            stroke="hsl(var(--foreground))"
          />
          <YAxis
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
            stroke="hsl(var(--foreground))"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke={change >= 0 ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"}
            fillOpacity={0.2}
            fill={change >= 0 ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"}
            strokeWidth={2}
          />
        </AreaChart>
      );
    }

    return (
      <LineChart data={generateChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
          stroke="hsl(var(--foreground))"
        />
        <YAxis
          tickFormatter={(value) => `$${value.toFixed(0)}`}
          tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
          stroke="hsl(var(--foreground))"
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="price"
          stroke={change >= 0 ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    );
  };

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-nanum text-foreground">{symbol} Advanced Chart</CardTitle>
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
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-1">
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                className="border-border"
                disabled={loading}
              >
                <Activity className="w-3 h-3" />
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('area')}
                className="border-border"
                disabled={loading}
              >
                <Volume2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="h-96 w-full">
              {loading ? (
                <div className="flex items-center justify-center h-full w-full">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                  <p>{error}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span>Recharts Enhanced - {generateChartData.length} data points</span>
            </div>
            <div className="text-xs">
              Hover for details • Professional financial charting
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedStockChart;
