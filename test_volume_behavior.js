#!/usr/bin/env node

/**
 * Test script to analyze volume behavior exactly like the Dashboard refresh
 * This script replicates the refreshAllData() function step-by-step
 */

const axios = require('axios');

// Configuration - same as dashboard
const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-production-url.com'
  : 'http://localhost:3000';

// Test symbols (same ones typically in watchlists)
const TEST_SYMBOLS = ['AAPL', 'TSLA', 'NVDA'];

function formatVolume(value) {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  } else {
    return value.toFixed(0);
  }
}

function formatCurrency(value) {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(value);
}

async function testVolumeBehavior() {
  console.log('📊 Volume Behavior Analysis - Dashboard Refresh Simulation\n');
  console.log('=' .repeat(70));
  console.log(`Testing symbols: ${TEST_SYMBOLS.join(', ')}`);
  console.log(`API URL: ${BASE_URL}`);
  console.log(`Testing methodology: 5 consecutive fetches with 3-second intervals\n`);

  // Track volume history for each symbol
  const volumeHistory = {};

  for (let fetchRound = 1; fetchRound <= 5; fetchRound++) {
    console.log(`🔄 FETCH ROUND ${fetchRound}/5 - ${new Date().toLocaleTimeString()}`);
    console.log('-'.repeat(50));

    for (const symbol of TEST_SYMBOLS) {
      try {
        console.log(`\n📈 Fetching ${symbol}...`);

        // This is exactly what the Dashboard does in refreshAllData()
        const startTime = Date.now();
        const response = await axios.get(`${BASE_URL}/api/stock/${symbol}`);
        const fetchTime = Date.now() - startTime;

        if (!response.data.success) {
          console.log(`  ❌ API Error: ${response.data.error}`);
          continue;
        }

        const stockData = response.data.data;

        // Initialize history for this symbol if not exists
        if (!volumeHistory[symbol]) {
          volumeHistory[symbol] = [];
        }

        // Store this fetch's data
        const currentFetch = {
          round: fetchRound,
          timestamp: new Date(),
          price: stockData.price,
          volume: stockData.volume,
          change: stockData.change,
          changePercent: stockData.changePercent,
          volumeFormatted: formatVolume(stockData.volume)
        };

        volumeHistory[symbol].push(currentFetch);

        console.log(`  ✅ Price: ${formatCurrency(stockData.price)} (${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent?.toFixed(2)}%)`);
        console.log(`  📊 Volume: ${currentFetch.volumeFormatted} (${stockData.volume?.toLocaleString() || '0'} raw)`);
        console.log(`  ⏱️  Fetch time: ${fetchTime}ms`);

        // Compare with previous fetch for this symbol
        const previousFetches = volumeHistory[symbol].filter(f => f.round < fetchRound);
        if (previousFetches.length > 0) {
          const prevFetch = previousFetches[previousFetches.length - 1];
          const volumeDiff = stockData.volume - prevFetch.volume;
          const volumePercentChange = prevFetch.volume > 0 ? (volumeDiff / prevFetch.volume) * 100 : 0;

          const direction = volumeDiff > 0 ? '📈 INCREASED' :
                           volumeDiff < 0 ? '📉 DECREASED' :
                           '➡️  UNCHANGED';

          console.log(`  🔄 Volume change: ${direction} by ${Math.abs(volumePercentChange).toFixed(2)}%`);
          console.log(`     Previous: ${prevFetch.volumeFormatted} (${prevFetch.volume?.toLocaleString()})`);
          console.log(`     Current:  ${currentFetch.volumeFormatted} (${currentFetch.volume?.toLocaleString()})`);
        }

      } catch (error) {
        console.log(`  ❌ Error fetching ${symbol}: ${error.message}`);
      }
    }

    console.log('');

    // Wait between fetches (simulate realistic timing)
    if (fetchRound < 5) {
      console.log(`⏳ Waiting 3 seconds before next refresh cycle...\n`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Analysis section
  console.log('\n' + '='.repeat(70));
  console.log('📋 VOLUME BEHAVIOR ANALYSIS');
  console.log('='.repeat(70));

  for (const symbol of TEST_SYMBOLS) {
    const history = volumeHistory[symbol];
    if (!history || history.length < 2) continue;

    console.log(`\n📊 VOLUME HISTORY FOR ${symbol}:`);
    console.log('-'.repeat(40));

    // Display full history
    history.forEach((fetch, index) => {
      console.log(`Round ${fetch.round}: ${fetch.volumeFormatted} (${fetch.volume?.toLocaleString()}) at ${fetch.timestamp.toLocaleTimeString()}`);
    });

    // Analyze volume trend
    const volumes = history.map(h => h.volume).filter(v => v != null);
    if (volumes.length >= 2) {
      const firstVolume = volumes[0];
      const lastVolume = volumes[volumes.length - 1];
      const overallDiff = lastVolume - firstVolume;
      const overallPercentChange = firstVolume > 0 ? (overallDiff / firstVolume) * 100 : 0;

      console.log(`Volume Trend Analysis:`);
      console.log(`  Started at: ${formatVolume(firstVolume)}`);
      console.log(`  Ended at:   ${formatVolume(lastVolume)}`);
      console.log(`  Overall:    ${overallDiff > 0 ? 'Increased' : overallDiff < 0 ? 'Decreased' : 'No change'} by ${Math.abs(overallPercentChange).toFixed(2)}%`);

      // Check if this is market hours
      const now = new Date();
      const hour = now.getHours();
      const isMarketHours = hour >= 9 && hour <= 16; // Rough US market hours (UTC vs EST)

      console.log(`Time Analysis:`);
      console.log(`  Local time: ${now.toLocaleTimeString()}`);
      console.log(`  Market hours: ${isMarketHours ? 'YES (expecting accumulation)' : 'NO (volume may fluctuate)'}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎯 WHAT VOLUME REPRESENTS');
  console.log('='.repeat(70));

  console.log(`During regular market hours (9:30 AM - 4:00 PM ET):`);
  console.log(`  • Volume should accumulate (increase) throughout the day`);
  console.log(`  • Each refresh should show higher or equal numbers`);
  console.log(`  • Decreasing volume indicates unusual behavior`);

  console.log(`\nOutside market hours:`);
  console.log(`  • Volume can be from after-hours/pre-market trading`);
  console.log(`  • May fluctuate or reset based on data provider`);
  console.log(`  • Not necessarily cumulative`);

  console.log(`\n📝 COMMON EXPLANATIONS FOR VOLUME CHANGES:`);
  console.log(`  1. Market Hours: Expect increasing volume during trading`);
  console.log(`  2. Data Provider: Different responses from same API call`);
  console.log(`  3. After Hours: Volume may show extended trading activity`);
  console.log(`  4. Data Inconsistency: API may serve slightly different snapshots`);

  // Final assessment
  console.log('\n' + '='.repeat(70));
  console.log('🔍 INVESTIGATION RESULT');
  console.log('='.repeat(70));

  const issuesFound = TEST_SYMBOLS.some(symbol => {
    const history = volumeHistory[symbol];
    if (!history || history.length < 3) return false;

    // Check if volume decreased twice or more in 5 fetches
    let decreaseCount = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i].volume < history[i-1].volume) {
        decreaseCount++;
      }
    }

    return decreaseCount >= 2; // Significant pattern of decreasing volume
  });

  if (issuesFound) {
    console.log('⚠️  VOLUME ANOMALY DETECTED: Volume is decreasing when it should accumulate.');
    console.log('This suggests data consistency issues or unusual market conditions.');
    console.log('\n💡 POSSIBLE CAUSES:');
    console.log('   • API cache inconsistencies');
    console.log('   • Multiple data sources giving different responses');
    console.log('   • After-hours trading patterns');
    console.log('   • Data provider technical issues');
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('   1. Refresh during market hours only');
    console.log('   2. Add volume validation before update');
    console.log('   3. Consider using previous volume if current is lower');
    process.exit(1);
  } else {
    console.log('✅ NORMAL BEHAVIOR: Volume changes within expected ranges.');
    console.log('Data shows typical market activity patterns.');
    process.exit(0);
  }
}

// Run the test
if (require.main === module) {
  testVolumeBehavior().catch(error => {
    console.error('\n💥 UNEXPECTED ERROR:', error);
    process.exit(2);
  });
}

module.exports = { testVolumeBehavior };
