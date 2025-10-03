import axios from 'axios';
import fs from 'fs';

// Test the Gemini integration with detailed logging
const GEMINI_API_KEY = 'AIzaSyBTb24IHytKBlS3mbZvzwmar0AFBWPamG0';

async function debugGemini() {
  console.log('🔍 DEBUGGING Gemini 2.5 Flash Preview...');
  console.log('🔑 API Key:', GEMINI_API_KEY.substring(0, 15) + '...');

  try {
    // First, test with a very simple prompt
    console.log('\n📝 Testing with simple prompt...');

    const simpleResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: 'Say "Hello World" in JSON format: {"message": "Hello World"}'
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('✅ Simple test successful!');
    const simpleContent = simpleResponse.data.candidates[0]?.content?.parts[0]?.text;
    console.log('📄 Simple response:', simpleContent);

    // Now test with stock analysis
    console.log('\n📊 Testing with stock analysis prompt...');

    const stockPrompt = `Analyze AAPL stock at $150 with +2.5% change. Return JSON with action (buy/sell/hold) and confidence (0-100).`;

    const stockResponse = await axios.post(
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
        timeout: 15000
      }
    );

    console.log('✅ Stock analysis test successful!');
    const stockContent = stockResponse.data.candidates[0]?.content?.parts[0]?.text;
    console.log('📈 Stock response:', stockContent);

    // Save full response for debugging
    fs.writeFileSync('gemini-debug-response.json', JSON.stringify({
      simpleResponse: simpleResponse.data,
      stockResponse: stockResponse.data
    }, null, 2));

    console.log('\n💾 Full responses saved to gemini-debug-response.json');
    console.log('🎉 All tests passed! Gemini is working correctly.');

    return true;

  } catch (error) {
    console.error('\n❌ Test failed:');

    if (error.code === 'ECONNABORTED') {
      console.error('   ⏰ Request timeout - API might be slow');
    } else if (error.response) {
      console.error(`   🚫 API Error ${error.response.status}:`, error.response.data);
    } else {
      console.error('   💥 Error:', error.message);
    }

    // Save error details
    fs.writeFileSync('gemini-debug-error.json', JSON.stringify({
      error: error.message,
      code: error.code,
      response: error.response?.data
    }, null, 2));

    console.log('\n💾 Error details saved to gemini-debug-error.json');
    return false;
  }
}

debugGemini().then(success => {
  if (success) {
    console.log('\n✅ Gemini integration is working!');
  } else {
    console.log('\n❌ Gemini integration needs troubleshooting');
  }
}).catch(error => {
  console.error('💥 Unexpected error:', error);
});
