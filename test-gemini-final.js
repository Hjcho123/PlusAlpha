import axios from 'axios';
import fs from 'fs';

// Final comprehensive test for Gemini API
const GEMINI_API_KEY = 'AIzaSyBTb24IHytKBlS3mbZvzwmar0AFBWPamG0';

async function finalGeminiTest() {
  console.log('🚀 FINAL GEMINI API TEST');
  console.log('🔑 Testing API Key:', GEMINI_API_KEY.substring(0, 20) + '...');
  console.log('📊 These API calls WILL appear in your Gemini dashboard');
  console.log('');

  const tests = [
    {
      name: 'Simple Hello World',
      prompt: 'Say "Hello World" in JSON format: {"message": "Hello World"}'
    },
    {
      name: 'Stock Analysis Test',
      prompt: 'Analyze AAPL stock at $150 with +2.5% change. Return JSON with action and confidence.'
    },
    {
      name: 'Market Analysis Test',
      prompt: 'Analyze this market data: AAPL +2.5%, GOOGL -1.2%, MSFT +0.8%. Provide sentiment analysis in JSON.'
    },
    {
      name: 'Complex Financial Analysis',
      prompt: 'As a financial AI, analyze the current market conditions and provide investment recommendations for tech stocks. Format as JSON with confidence score.'
    }
  ];

  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`🧪 Test ${i + 1}/4: ${test.name}`);

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: test.prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log(`   ✅ SUCCESS - Status: ${response.status}`);
      const content = response.data.candidates[0]?.content?.parts[0]?.text;
      console.log(`   📄 Response: ${content?.substring(0, 100)}...`);

      results.push({
        test: test.name,
        success: true,
        response: content,
        status: response.status
      });

    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      results.push({
        test: test.name,
        success: false,
        error: error.message
      });
    }

    // Wait 2 seconds between tests
    if (i < tests.length - 1) {
      console.log('   ⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Save results
  fs.writeFileSync('gemini-final-test-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    apiKey: GEMINI_API_KEY.substring(0, 20) + '...',
    results: results
  }, null, 2));

  console.log('\n💾 Full test results saved to gemini-final-test-results.json');

  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 Test Summary: ${successCount}/${tests.length} tests passed`);

  if (successCount === tests.length) {
    console.log('🎉 ALL TESTS PASSED! Gemini API is working perfectly.');
    console.log('📋 Check your Gemini dashboard now - these API calls should appear.');
  } else {
    console.log('⚠️ Some tests failed. Check the results file for details.');
  }

  return successCount === tests.length;
}

// Run the test
finalGeminiTest().then(success => {
  if (success) {
    console.log('\n✅ Gemini API integration is fully functional!');
  } else {
    console.log('\n❌ Some issues detected with Gemini API');
  }
}).catch(error => {
  console.error('💥 Unexpected error:', error);
});
