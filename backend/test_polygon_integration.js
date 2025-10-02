const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testAPIEndpoints() {
  try {
    console.log('Testing API endpoints...');

    console.log('\n1. Testing GET /api/stocks/AAPL');
    const stockResponse = await axios.get(`${API_BASE_URL}/stocks/AAPL`);
    console.log('Stock API Response:', {
      success: stockResponse.data.success,
      data: stockResponse.data.data ? {
        symbol: stockResponse.data.data.symbol,
        price: stockResponse.data.data.price,
        change: stockResponse.data.data.change,
        changePercent: stockResponse.data.data.changePercent
      } : null
    });

    console.log('\n2. Testing GET /api/stocks/AAPL/market-data with period=5d');
    const marketDataResponse = await axios.get(`${API_BASE_URL}/stocks/AAPL/market-data?period=5d&interval=1day`);
    console.log('Market Data API Response:', {
      success: marketDataResponse.data.success,
      dataLength: marketDataResponse.data.data ? marketDataResponse.data.data.length : 0,
      firstItem: marketDataResponse.data.data && marketDataResponse.data.data.length > 0 ? {
        symbol: marketDataResponse.data.data[0].symbol,
        timestamp: marketDataResponse.data.data[0].timestamp,
        close: marketDataResponse.data.data[0].close
      } : null,
      lastItem: marketDataResponse.data.data && marketDataResponse.data.data.length > 0 ? {
        timestamp: marketDataResponse.data.data[marketDataResponse.data.data.length - 1].timestamp,
        close: marketDataResponse.data.data[marketDataResponse.data.data.length - 1].close
      } : null
    });

    console.log('\n3. Testing GET /api/stocks/AAPL/market-data with period=1mo');
    const monthlyDataResponse = await axios.get(`${API_BASE_URL}/stocks/AAPL/market-data?period=1mo&interval=1day`);
    console.log('1 Month Market Data API Response:', {
      success: monthlyDataResponse.data.success,
      dataLength: monthlyDataResponse.data.data ? monthlyDataResponse.data.data.length : 0
    });

  } catch (error) {
    console.error('API Test Error:', error.response ? {
      status: error.response.status,
      data: error.response.data
    } : error.message);
  }
}

testAPIEndpoints();
