import { useEffect, useRef, memo, useState } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
}

function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');

  // Detect and track theme changes
  useEffect(() => {
    const detectTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = savedTheme === 'dark' || (!savedTheme && systemDark);
      setCurrentTheme(isDark ? 'dark' : 'light');
    };

    detectTheme();

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          detectTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Listen for storage changes (theme toggle)
    window.addEventListener('storage', detectTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', detectTheme);
    };
  }, []);

  useEffect(() => {
    const createWidget = () => {
      if (!container.current) return;

      // Clear everything
      container.current.innerHTML = '';

      // Get theme-appropriate colors
      const isDark = currentTheme === 'dark';
      const backgroundColor = isDark ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)';
      const gridColor = 'rgba(124, 59, 237, 0.27)'; // Purple accent

      // Create script with configuration
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.async = true;
      script.innerHTML = `
        {
          "allow_symbol_change": false,
          "calendar": false,
          "details": true,
          "hide_side_toolbar": false,
          "hide_top_toolbar": false,
          "hide_legend": false,
          "hide_volume": false,
          "hotlist": true,
          "interval": "D",
          "locale": "en",
          "save_image": true,
          "style": "2",
          "symbol": "${symbol}",
          "theme": "${currentTheme}",
          "timezone": "Etc/UTC",
          "backgroundColor": "${backgroundColor}",
          "gridColor": "${gridColor}",
          "watchlist": [],
          "withdateranges": true,
          "compareSymbols": [],
          "studies": [],
          "autosize": true
        }`;

      // Script will create its own elements in the container
      container.current.appendChild(script);
    };

    createWidget();

    // Cleanup function
    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, currentTheme]);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: "100%", width: "100%" }}
    />
  );
}

export default memo(TradingViewWidget);
