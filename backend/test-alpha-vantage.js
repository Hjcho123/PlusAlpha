const axios = require("axios");
require("dotenv").config();

console.log("�� Alpha Vantage API Demonstration");
console.log("====================================\n");

const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
console.log("📋 API Configuration:");
console.log(`   API Key Available: ${!!apiKey}`);
console.log(`   API Key: ${apiKey || "Not set"}\n`);

if (!apiKey) {
  console.log("❌ Alpha Vantage API key not configured!");
  console.log("   Please set ALPHA_VANTAGE_API_KEY in your .env file\n");
  process.exit(1);
}

// Test basic API connectivity
const BASE_URL = "https://www.alphavantage.co/query";

async function testAPI() {
  try {
    console.log("📡 Testing API connectivity...");
    
    // Test 1: Get stock quote
    console.log("\n1️⃣  Testing Stock Quote (IBM):");
    const quoteResponse = await axios.get(BASE_URL, {
      params: {
        function: "GLOBAL_QUOTE",
        symbol: "IBM",
        apikey: apiKey
      }
    }); 
    
    if (quoteResponse.data["Global Quote"]) {
      const quote = quoteResponse.data["Global Quote"];
      console.log(`   ✅ Symbol: ${quote["01. symbol"]}`);
      console.log(`   ✅ Price: $${quote["05. price"]}`);
      console.log(`   ✅ Change: ${quote["09. change"]} (${quote["10. change percent"]})`);
      console.log(`   ✅ Volume: ${quote["06. volume"]}`);
    } else {
      console.log("   ❌ Quote data not available");
    }
    
    // Test 2: RSI Indicator
    console.log("\n2️⃣  Testing RSI Indicator (AAPL, 14-day):");
    const rsiResponse = await axios.get(BASE_URL, {
      params: {
        function: "RSI",
        symbol: "AAPL",
        interval: "daily",
        time_period: "14",
        series_type: "close",
        apikey: apiKey
      }
    }); 
    
    if (rsiResponse.data["Technical Analysis: RSI"]) {
      const rsiData = Object.values(rsiResponse.data["Technical Analysis: RSI"])[0];
      console.log(`   ✅ RSI Value: ${rsiData["RSI"]}`);
      console.log(`   ✅ Signal: ${parseFloat(rsiData["RSI"]) > 70 ? "Overbought" : parseFloat(rsiData["RSI"]) < 30 ? "Oversold" : "Neutral"}`);
    } else {
      console.log("   ❌ RSI data not available");
      if (rsiResponse.data["Note"]) console.log(`   📢 ${rsiResponse.data["Note"]}`);
    }
    
    // Test 3: MACD
    console.log("\n3️⃣  Testing MACD Indicator (TSLA):");
    const macdResponse = await axios.get(BASE_URL, {
      params: {
        function: "MACD",
        symbol: "TSLA",
        interval: "daily",
        series_type: "close",
        apikey: apiKey
      }
    }); 
    
    if (macdResponse.data["Technical Analysis: MACD"]) {
      const macdData = Object.values(macdResponse.data["Technical Analysis: MACD"])[0];
      console.log(`   ✅ MACD: ${macdData["MACD"]}`);
      console.log(`   ✅ Signal: ${macdData["MACD_Signal"]}`);
      console.log(`   ✅ Histogram: ${macdData["MACD_Hist"]}`);
    } else {
      console.log("   ❌ MACD data not available");
    }
    
    // Test 4: Fundamental Data
    console.log("\n4️⃣  Testing Fundamental Data (MSFT):");
    const overviewResponse = await axios.get(BASE_URL, {
      params: {
        function: "OVERVIEW",
        symbol: "MSFT",
        apikey: apiKey
      }
    }); 
    
    if (overviewResponse.data.Symbol) {
      console.log(`   ✅ Company: ${overviewResponse.data.Name}`);
      console.log(`   ✅ Sector: ${overviewResponse.data.Sector}`);
      console.log(`   ✅ P/E Ratio: ${overviewResponse.data.PERatio}`);
      console.log(`   ✅ Market Cap: $${(parseFloat(overviewResponse.data.MarketCapitalization) / 1000000000).toFixed(2)}B`);
    } else {
      console.log("   ❌ Fundamental data not available");
    }
    
    console.log("\n🎉 Alpha Vantage API tests completed successfully!");
    console.log("\n📊 What Alpha Vantage provides:");
    console.log("   • Real-time and historical stock prices");
    console.log("   • Technical indicators (RSI, MACD, Bollinger Bands, etc.)");
    console.log("   • Fundamental data (P/E, EPS, dividends, etc.)");
    console.log("   • Global market data and forex");
    console.log("   • Cryptocurrency data");
    console.log("   • Economic indicators");
    
  } catch (error) {
    console.error("\n❌ API test failed:", error.message);
    if (error.response?.data) {
      console.error("Response:", error.response.data);
    }
  }
}

testAPI().catch(console.error);
