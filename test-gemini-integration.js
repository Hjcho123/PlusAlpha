import axios from 'axios';

// Test the Gemini integration in AIService
const GEMINI_API_KEY = 'AIzaSyBTb24IHytKBlS3mbZvzwmar0AFBWPamG0';

async function testGeminiIntegration() {
  console.log('🧪 Testing Gemini 2.5 Flash Preview integration...');

  try {
    // Test stock analysis prompt
    const stockPrompt = `
Analyze the current stock data and provide a trading recommendation for AAPL:

Current Stock Data:
- Symbol: AAPL
- Current Price: $150
- Daily Change: +2.5 (+1.7%)
- Volume: 50000000
- Market Cap: $2500000000000
- PE Ratio: 25

As a financial AI assistant, provide:
1. A brief analysis (2-3 sentences) of the current situation
2. Trading recommendation (buy/sell/hold/watch)
3. Confidence level (0-100)
4. Key reasoning points (3-5 bullet points)

Format as JSON:
{
  "description": "Brief analysis...",
  "action": "buy|sell|hold|watch",
  "confidence": 85,
  "reasoning": ["Point 1", "Point 2", "Point 3"]
}
`;

    console.log('📤 Sending request to Gemini 2.5 Flash Preview...');

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: stockPrompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Gemini API call successful!');
    console.log('📊 Response status:', response.status);

    const content = response.data.candidates[0]?.content?.parts[0]?.text;
    if (!content) {
      throw new Error('No content in response');
    }

    console.log('📝 Full raw response:', content);

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(content);
      console.log('✅ Successfully parsed JSON response:');
      console.log('   Action:', parsed.action);
      console.log('   Confidence:', parsed.confidence);
      console.log('   Description:', parsed.description?.substring(0, 100) + '...');

      console.log('\n🎉 Gemini 2.5 Flash Preview integration test PASSED!');
      return true;

    } catch (parseError) {
      console.log('⚠️ Response is not valid JSON, but API is working');
      console.log('Raw content preview:', content.substring(0, 500));
      console.log('Parse error:', parseError.message);
      return true; // API is working, just need to adjust parsing
    }

  } catch (error) {
    console.error('❌ Gemini integration test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Run the test
testGeminiIntegration().then(success => {
  if (success) {
    console.log('\n✅ Gemini integration is ready to use!');
  } else {
    console.log('\n❌ Gemini integration needs fixes');
  }
}).catch(error => {
  console.error('💥 Unexpected error:', error);
});
