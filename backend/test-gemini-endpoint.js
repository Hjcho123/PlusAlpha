// Test Gemini Endpoint - Direct and Simplified
require('dotenv').config({ path: './.env' });
const axios = require('axios');

// Test the exact same logic as our simplified endpoint
async function testSimplifiedGeminiEndpoint() {
  const symbol = 'AAPL';

  console.log(`Testing simplified Gemini endpoint for ${symbol}`);

  // Mock the exact basic data structure
  const basicData = {
    symbol: 'AAPL',
    price: 245.50,
    changePercent: 1.2,
    marketCap: 3785000000000,
    change: 2.9,
    volume: 123456789,
    name: 'Apple Inc.'
  };

  console.log('Using mock data:', basicData);

  // Use the EXACT same prompt and request as our endpoint
  const prompt = `Analyze ${symbol} stock and provide a brief trading recommendation:
Price: $${basicData.price} (+${basicData.changePercent}%)
Market Cap: $${basicData.marketCap.toLocaleString()}

Respond with JSON: {"action":"buy|sell|hold|watch","confidence":85,"reasoning":["reason1","reason2"],"description":"brief analysis"}`;

  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.3,
      topK: 32,
      topP: 0.8,
      maxOutputTokens: 1024,
      responseMimeType: "application/json"
    }
  };

  console.log('Making direct Gemini API call...');

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      requestBody,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 600000 // 10 minutes
      }
    );

    console.log('Gemini API response received');
    const analysis = JSON.parse(response.data.candidates[0]?.content?.parts?.[0]?.text);
    console.log('Parsed analysis:', analysis);

    if (analysis && analysis.action) {
      // Create expected response format
      const result = {
        success: true,
        data: {
          _id: `test-${Date.now()}`,
          symbol: symbol.toUpperCase(),
          type: 'trading_signal',
          title: `Demo Trading Signal: ${symbol}`,
          description: analysis.description,
          confidence: analysis.confidence,
          action: analysis.action,
          reasoning: analysis.reasoning,
          technicalIndicators: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        message: 'Demo trading signal generated successfully',
        timestamp: new Date()
      };

      console.log('✅ SUCCESS - Full endpoint simulation complete!');
      console.log('Response:', JSON.stringify(result, null, 2));
      return result;
    } else {
      throw new Error('Invalid analysis response from Gemini');
    }

  } catch (error) {
    console.error('❌ FAILED - Error during Gemini call:', error.message);
    console.error('Full error:', error.response?.data || error);

    return {
      success: false,
      error: 'Failed to generate demo trading signal',
      timestamp: new Date()
    };
  }
}

// Run the test
testSimplifiedGeminiEndpoint()
  .then(result => {
    console.log('\n=== TEST RESULT ===');
    if (result.success) {
      console.log('✅ TEST PASSED - Gemini AI insights work!');
    } else {
      console.log('❌ TEST FAILED - Gemini AI integration broken');
    }
  })
  .catch(error => {
    console.error('💥 Test crashed:', error.message);
  });
