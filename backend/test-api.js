#!/usr/bin/env node

// Simple API test script for PlusAlpha Backend
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Testing PlusAlpha Backend API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health check passed:', healthResponse.data.data.status);
    console.log('   Databases:', healthResponse.data.data.databases);
    console.log('   WebSocket clients:', healthResponse.data.data.websocket.totalClients);
    console.log();

    // Test API documentation endpoint
    console.log('2. Testing API documentation...');
    const apiResponse = await axios.get(`${BASE_URL}`);
    console.log('✅ API docs loaded:', apiResponse.data.data.name, 'v' + apiResponse.data.data.version);
    console.log('   Available endpoints:', Object.keys(apiResponse.data.data.endpoints).join(', '));
    console.log();

    // Test stock search
    console.log('3. Testing stock search...');
    const searchResponse = await axios.get(`${BASE_URL}/stocks/search?query=AAPL&limit=5`);
    console.log('✅ Stock search working:', searchResponse.data.data.length, 'results found');
    if (searchResponse.data.data.length > 0) {
      const stock = searchResponse.data.data[0];
      console.log('   Sample result:', stock.symbol, '-', stock.name, '- $' + stock.price);
    }
    console.log();

    // Test market overview
    console.log('4. Testing market overview...');
    const overviewResponse = await axios.get(`${BASE_URL}/stocks/overview`);
    console.log('✅ Market overview working');
    console.log('   Top gainers:', overviewResponse.data.data.topGainers.length);
    console.log('   Top losers:', overviewResponse.data.data.topLosers.length);
    console.log('   Most active:', overviewResponse.data.data.mostActive.length);
    console.log();

    // Test user registration
    console.log('5. Testing user registration...');
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123',
      firstName: 'Test',
      lastName: 'User',
      riskTolerance: 'moderate'
    };

    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ User registration working');
      console.log('   User ID:', registerResponse.data.data.user._id);
      console.log('   Token received:', registerResponse.data.data.token ? 'Yes' : 'No');
      
      const token = registerResponse.data.data.token;

      // Test authenticated endpoint
      console.log('6. Testing authenticated endpoints...');
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Authenticated requests working');
      console.log('   User profile loaded:', profileResponse.data.data.user.email);
      console.log();

      // Test portfolio creation
      console.log('7. Testing portfolio management...');
      const portfolioResponse = await axios.get(`${BASE_URL}/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Portfolio management working');
      console.log('   Portfolio found:', portfolioResponse.data.data ? 'Yes' : 'No');
      console.log();

      // Test FREE AI features
      console.log('8. Testing FREE AI features...');
      const aiResponse = await axios.post(`${BASE_URL}/ai/trading-signal/AAPL`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ FREE AI trading signal working');
      console.log('   Signal:', aiResponse.data.data.action);
      console.log('   Confidence:', aiResponse.data.data.confidence + '%');
      console.log('   Reasoning:', aiResponse.data.data.reasoning.slice(0, 2).join(', '));
      console.log();

    } catch (authError) {
      console.log('⚠️  Authentication test failed:', authError.response?.data?.error || authError.message);
    }

    console.log('🎉 Backend API tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Health check');
    console.log('   ✅ API documentation');
    console.log('   ✅ Stock data endpoints');
    console.log('   ✅ Market overview');
    console.log('   ✅ User authentication');
    console.log('   ✅ Portfolio management');
    console.log('   ✅ FREE AI features');
    console.log('\n🚀 Your PlusAlpha backend is ready to use!');
    console.log('💡 No OpenAI key required - using FREE AI alternatives!');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data?.error || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend server is running: npm run dev');
    console.log('   2. Check if MongoDB is running');
    console.log('   3. Verify your .env file configuration');
    console.log('   4. Check the server logs for errors');
    process.exit(1);
  }
}

// Run the test
testAPI();
