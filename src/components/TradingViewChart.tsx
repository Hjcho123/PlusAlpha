import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  AreaData,
  BarData,
  HistogramData,
  ColorType,
  CrosshairMode,
  PriceScaleMode,
  TickMarkType,
  UTCTimestamp,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  HistogramSeries
} from 'lightweight-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Volume2,
  LineChart as LineChartIcon,
  BarChart3,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

interface TradingViewChartProps {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  className?: string;
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

interface CandlestickDataPoint {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface VolumeDataPoint {
  time: UTCTimestamp;
  value: number;
  color: string;
}

interface LineAreaDataPoint {
  time: UTCTimestamp;
  value: number;
}

export interface TradingViewChartRef {
  updateData: (data: ChartDataPoint[]) => void;
  setChartType: (type: 'candlestick' | 'line' | 'area' | 'bar') => void;
  addIndicator: (type: string, data: ChartDataPoint[]) => void;
}

const TradingViewChart = forwardRef<TradingViewChartRef, TradingViewChartProps>(({
  symbol,
  name,
  currentPrice,
  change,
  changePercent,
  className
}, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'> | ISeriesApi<'Bar'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [chartType, setChartTypeState] = React.useState<'candlestick' | 'line' | 'area' | 'bar'>('candlestick');

  const updateChartType = useCallback((type: 'candlestick' | 'line' | 'area' | 'bar') => {
    if (!chartRef.current) return;

    const chart = chartRef.current;

    // Remove existing series
    if (candlestickSeriesRef.current) {
      chart.removeSeries(candlestickSeriesRef.current);
      candlestickSeriesRef.current = null;
    }

    // Create new series based on type
    switch (type) {
      case 'candlestick': {
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: 'hsl(142 76% 36%)', // green-500
          downColor: 'hsl(0 84% 60%)',  // red-500
          borderVisible: false,
          wickUpColor: 'hsl(142 76% 36%)',
          wickDownColor: 'hsl(0 84% 60%)',
        });
        candlestickSeriesRef.current = candlestickSeries;
        break;
      }
      case 'line': {
        const lineSeries = chart.addSeries(LineSeries, {
          color: change >= 0 ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)',
          lineWidth: 2,
        });
        candlestickSeriesRef.current = lineSeries;
        break;
      }
      case 'area': {
        const areaSeries = chart.addSeries(AreaSeries, {
          topColor: change >= 0 ? 'hsl(142 76% 36% / 0.56)' : 'hsl(0 84% 60% / 0.56)',
          bottomColor: change >= 0 ? 'hsl(142 76% 36% / 0.04)' : 'hsl(0 84% 60% / 0.04)',
          lineColor: change >= 0 ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)',
          lineWidth: 2,
        });
        candlestickSeriesRef.current = areaSeries;
        break;
      }
      case 'bar': {
        const barSeries = chart.addSeries(BarSeries, {
          upColor: 'hsl(142 76% 36%)',
          downColor: 'hsl(0 84% 60%)',
        });
        candlestickSeriesRef.current = barSeries;
        break;
      }
    }
  }, [change]);

  // Initialize chart
  useEffect(() => {
    if (chartContainerRef.current) {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'hsl(var(--background))' },
          textColor: 'hsl(var(--foreground))',
        },
        grid: {
          vertLines: { color: 'hsl(var(--border))' },
          horzLines: { color: 'hsl(var(--border))' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: 'hsl(var(--border))',
        },
        timeScale: {
          borderColor: 'hsl(var(--border))',
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
      });

      chartRef.current = chart;

      // Create volume series (bottom)
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: 'hsl(var(--primary))',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '', // Empty string for volume
      });
      volumeSeriesRef.current = volumeSeries;

      // Add volume price scale
      chart.priceScale('').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
        mode: PriceScaleMode.Normal,
      });

      // Resize handler
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }
  }, []);

  // Update chart type when it changes
  useEffect(() => {
    updateChartType(chartType);
  }, [chartType, updateChartType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const transformToCandlestickData = (data: ChartDataPoint[]): CandlestickData[] => {
    return data.map(point => ({
      time: Math.floor(new Date(point.date).getTime() / 1000) as UTCTimestamp,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close
    }));
  };

  const transformToVolumeData = (data: ChartDataPoint[]): HistogramData[] => {
    return data.map(point => ({
      time: Math.floor(new Date(point.date).getTime() / 1000) as UTCTimestamp,
      value: point.volume,
      color: point.close >= point.open ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
    }));
  };

  const transformToLineData = (data: ChartDataPoint[]): LineData[] => {
    return data.map(point => ({
      time: Math.floor(new Date(point.date).getTime() / 1000) as UTCTimestamp,
      value: point.close
    }));
  };

  const transformToAreaData = (data: ChartDataPoint[]): AreaData[] => {
    return data.map(point => ({
      time: Math.floor(new Date(point.date).getTime() / 1000) as UTCTimestamp,
      value: point.close
    }));
  };

  const transformToBarData = (data: ChartDataPoint[]): BarData[] => {
    return data.map(point => ({
      time: Math.floor(new Date(point.date).getTime() / 1000) as UTCTimestamp,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close
    }));
  };

  const addIndicator = (type: string, data: ChartDataPoint[]) => {
    if (!chartRef.current) return;

    switch (type) {
      case 'moving-average': {
        const maSeries = chartRef.current.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 1,
          title: 'MA',
        });
        const maData = data.map((point) => ({
          time: Math.floor(new Date(point.date).getTime() / 1000) as UTCTimestamp,
          value: point.ma20 || point.close
        } as LineData));
        maSeries.setData(maData);
        break;
      }
      case 'rsi': {
        // Add RSI as overlay - this would need a separate RSI chart
        break;
      }
    }
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    updateData: (data: ChartDataPoint[]) => {
      if (!chartRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;

      setLoading(false);

      switch (chartType) {
        case 'candlestick': {
          const candlestickData = transformToCandlestickData(data);
          candlestickSeriesRef.current.setData(candlestickData);
          break;
        }
        case 'line': {
          const lineData = transformToLineData(data);
          candlestickSeriesRef.current.setData(lineData);
          break;
        }
        case 'area': {
          const areaData = transformToAreaData(data);
          candlestickSeriesRef.current.setData(areaData);
          break;
        }
        case 'bar': {
          const barData = transformToBarData(data);
          candlestickSeriesRef.current.setData(barData);
          break;
        }
      }

      // Update volume data
      const volumeData = transformToVolumeData(data);
      volumeSeriesRef.current.setData(volumeData);

      // Fit content
      chartRef.current.timeScale().fitContent();
    },
    setChartType: setChartTypeState,
    addIndicator,
  }));

  return (
    <Card className={cn("w-full", className)}>
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
          <div className="flex gap-2">
            <Button
              variant={chartType === 'candlestick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartTypeState('candlestick')}
              className="border-border"
            >
              <BarChart3 className="w-3 h-3" />
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartTypeState('line')}
              className="border-border"
            >
              <Activity className="w-3 h-3" />
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartTypeState('area')}
              className="border-border"
            >
              <BarChart3 className="w-3 h-3" />
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartTypeState('bar')}
              className="border-border"
            >
              <BarChart3 className="w-3 h-3" />
            </Button>
          </div>

          <div className="relative">
            <div
              ref={chartContainerRef}
              className="w-full h-96 border border-border rounded-md bg-background"
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Volume2 className="w-4 h-4" />
            <span>Volume overlay enabled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TradingViewChart.displayName = 'TradingViewChart';

export default TradingViewChart;
