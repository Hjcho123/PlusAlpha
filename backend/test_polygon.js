const { config } = require('dotenv');
config();
const axios = require('axios');

async function testPolygonAPI() {
  try {
    const apiKey = process.env.POLYGON_API_KEY;
    console.log('API Key present:', !!apiKey);

    const symbol = 'AAPL';
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/2024-09-01/2024-10-01?adjusted=true&sort=asc&limit=50000&apiKey=${apiKey}`;

    console.log('Making request to:', url.replace(apiKey, '***API_KEY***'));

    const response = await axios.get(url);

    console.log('Status:', response.status);
    console.log('Response structure:');
    console.log(JSON.stringify({
      ticker: response.data.ticker,
      status: response.data.status,
      count: response.data.count,
      resultsCount: response.data.results ? response.data.results.length : 0
    }, null, 2));

    if (response.data.results && response.data.results.length > 0) {
      console.log('\nFirst result:');
      console.log(JSON.stringify(response.data.results[0], null, 2));
      console.log('\nLast result:');
      console.log(JSON.stringify(response.data.results[response.data.results.length - 1], null, 2));
    }

  } catch (error) {
    console.error('Error:', error.response ? {
      status: error.response.status,
      data: error.response.data
    } : error.message);
  }
}

testPolygonAPI();
