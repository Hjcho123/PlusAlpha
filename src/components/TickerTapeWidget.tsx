// TradingViewWidget.jsx
import React, { useEffect, useRef, memo } from 'react';

function TickerTapeWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
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
        "colorTheme": "dark",
        "locale": "en",
        "largeChartUrl": "",
        "isTransparent": true,
        "showSymbolLogo": false,
        "displayMode": "adaptive"
      }`;
    container.current.appendChild(script);
  },
  []
  );

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/markets/" rel="noopener nofollow" target="_blank"><span className="blue-text">Ticker tape</span></a><span className="trademark"> by TradingView</span></div>
    </div>
  );
}

export default memo(TickerTapeWidget);
