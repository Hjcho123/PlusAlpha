// Simple script to show what RBLX data we actually get from Yahoo Finance
require('dotenv').config({ path: './backend/.env' });
const yahooFinance = require('yahoo-finance2').default;

async function main() {
  const symbol = 'RBLX';

  console.log(`🏭 REAL YAHOO FINANCE DATA AUDIT FOR ${symbol.toUpperCase()}`);
  console.log('='.repeat(70));
  console.log();

  try {
    // Get basic quote data
    console.log('📊 BASIC QUOTE DATA:');
    const quote = await yahooFinance.quote(symbol);
    console.log(`Symbol: ${quote.symbol}`);
    console.log(`Name: ${quote.shortName}`);
    console.log(`Price: $${quote.regularMarketPrice?.toFixed(2)}`);
    console.log(`Change: ${quote.regularMarketChange?.toFixed(2)}`);
    console.log(`Change %: ${(quote.regularMarketChangePercent * 100)?.toFixed(2)}%`);
    console.log(`Volume: ${quote.regularMarketVolume?.toLocaleString()}`);
    console.log(`Market Cap: ${quote.marketCap?.toLocaleString()}`);
    console.log();

    // Get detailed summary
    console.log('🎯 SUMMARY DETAIL DATA:');
    const summary = await yahooFinance.quoteSummary(symbol, { modules: ['summaryDetail'] });
    const details = summary.summaryDetail || {};

    console.log(`PE Ratio: ${details.trailingPE || 'N/A'}`);
    console.log(`EPS: $${details.epsTrailingTwelveMonths || 'N/A'}`);
    console.log(`Dividend Yield: ${(details.dividendYield) ? (details.dividendYield * 100)?.toFixed(2) + '%' : 'N/A'}`);
    console.log(`Dividend Rate: $${details.dividendRate || 'N/A'}`);
    console.log(`52W High: $${details.fiftyTwoWeekHigh || 'N/A'}`);
    console.log(`52W Low: $${details.fiftyTwoWeekLow || 'N/A'}`);
    console.log();

    // Check what additional data is available
    console.log('🏢 ADDITIONAL ASSET PROFILE DATA:');
    try {
      const assetProfile = await yahooFinance.quoteSummary(symbol, { modules: ['assetProfile'] });
      if (assetProfile.assetProfile) {
        console.log(`Sector: ${assetProfile.assetProfile.sector || 'N/A'}`);
        console.log(`Industry: ${assetProfile.assetProfile.industry || 'N/A'}`);
        console.log(`Country: ${assetProfile.assetProfile.country || 'N/A'}`);
        console.log(`Full Time Employees: ${assetProfile.assetProfile.fullTimeEmployees?.toLocaleString() || 'N/A'}`);
        console.log(`Website: ${assetProfile.assetProfile.website || 'N/A'}`);
        console.log(`Business Summary: ${(assetProfile.assetProfile.longBusinessSummary || '').substring(0, 150)}...`);
      }
    } catch (error) {
      console.log('❌ Asset profile not available:', error.message);
    }
    console.log();

    // Check if company info gives us sector
    console.log('🏭 VERIFICATION OF WHAT OUR CODE GETS:');
    const whatOurCodeGets = {
      symbol: symbol.toUpperCase(),
      name: quote.shortName || quote.longName,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      marketCap: details.marketCap || quote.marketCap,
      pe: details.trailingPE,
      eps: details.epsTrailingTwelveMonths,
      dividend: details.dividendRate,
      high52Week: details.fiftyTwoWeekHigh,
      low52Week: details.fiftyTwoWeekLow,
      sector: 'NOT AVAILABLE IN BASIC DATA', // This is what I claimed but it's not real
      dividendYield: details.dividendYield,
      rsi: 'NOT AVAILABLE' // This is not real either
    };

    console.log(JSON.stringify(whatOurCodeGets, null, 2));
    console.log();
    console.log('🎯 CONCLUSION:');
    console.log('✅ REAL YAHOO FINANCE FIELDS:', [
      'symbol', 'name', 'price', 'change', 'changePercent', 'volume',
      'marketCap', 'pe', 'eps', 'dividend', 'dividendYield', 'high52Week', 'low52Week'
    ].join(', '));
    console.log();
    console.log('❌ MADE-UP/MISSING FIELDS IN OUR COMPREHENSIVE PROMPT:', [
      'sector (available in assetProfile)',
      'rsi (not available)',
      '52-week calculations (generated)',
      'Industry details (available in assetProfile)',
      'Market dominance metrics (generated/inferred)',
      'Competitive positioning (generated/inferred)'
    ].join(', '));

  } catch (error) {
    console.error('❌ Error fetching RBLX data:', error.message);
  }
}

main().catch(console.error);
