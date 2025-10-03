
import { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
}

const TradingViewWidget = ({ symbol }: TradingViewWidgetProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current || !symbol) return;
    
    // Clear previous widget instance
    container.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `NASDAQ:${symbol}`,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: true,
      container_id: `tradingview_${symbol}`,
      studies: ['MASimple@tv-basicstudies'],
      backgroundColor: 'rgba(0, 0, 0, 0)',
      gridColor: 'rgba(255, 255, 255, 0.06)'
    });

    container.current.appendChild(script);

  }, [symbol]);

  return (
    <div className="h-[600px] w-full">
      <div ref={container} className="tradingview-widget-container__widget" />
      <div className="mt-2 text-xs text-muted-foreground">
        Data provided by <a href="https://www.tradingview.com/" target="_blank" rel="noopener">TradingView</a>
      </div>
    </div>
  );
};

export default memo(TradingViewWidget);
