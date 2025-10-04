import React, { useEffect, useRef, memo, useState } from 'react';

function TickerTapeWidget() {
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

      // Get theme-appropriate transparency setting
      const isTransparent = currentTheme === 'dark';

      // Create script with configuration
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
      script.async = true;
      script.innerHTML = `
        {
          "symbols": [
            {
              "proName": "FOREXCOM:SPXUSD",
              "title": "S&P 500 Index"
            },
            {
              "proName": "FOREXCOM:NSXUSD",
              "title": "US 100 Cash CFD"
            },
            {
              "proName": "FX_IDC:EURUSD",
              "title": "EUR to USD"
            },
            {
              "proName": "BITSTAMP:BTCUSD",
              "title": "Bitcoin"
            },
            {
              "proName": "BITSTAMP:ETHUSD",
              "title": "Ethereum"
            },
            {
              "proName": "NASDAQ:AAPL",
              "title": "Apple"
            },
            {
              "proName": "NASDAQ:NVDA",
              "title": "NVIDIA"
            },
            {
              "proName": "NASDAQ:META",
              "title": "META"
            },
            {
              "proName": "NASDAQ:GOOGL",
              "title": "GOOGLE"
            }
          ],
          "colorTheme": "${currentTheme}",
          "locale": "en",
          "largeChartUrl": "",
          "isTransparent": ${isTransparent},
          "showSymbolLogo": false,
          "displayMode": "compact"
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
  }, [currentTheme]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

export default memo(TickerTapeWidget);
