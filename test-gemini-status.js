import axios from 'axios';

// Test Gemini API key from .env file
const GEMINI_API_KEY = 'AIzaSyAJAUBKZ1ACLm_vPTM90g2rDEqpEN7GoLY';

async function comprehensiveTest() {
  console.log('🤖 Testing Gemini API Status');
  console.log('🔑 API Key:', GEMINI_API_KEY.substring(0, 20) + '...');
  console.log('📍 Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20');
  console.log('');

  try {
    // 1. Test API key validity first (GET request)
    console.log('1️⃣ Testing API key validity...');
    const modelsResponse = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      { timeout: 10000 }
    );

    console.log('✅ API key is valid');
    console.log('📊 Available models:', modelsResponse.data.models?.length || 0);

    // Check for the specific model we're using
    const geminiModel = modelsResponse.data.models?.find(m => m.name?.includes('gemini-2.5-flash-preview'));
    console.log('🎯 Target model available:', !!geminiModel);
    console.log('');

    // 2. Test generation endpoint (POST request)
    console.log('2️⃣ Testing content generation...');
    const testPrompt = {
      contents: [{
        parts: [{
          text: 'Hello, can you respond with just "TEST OK" please?'
        }]
      }]
    };

    const generateResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
      testPrompt,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Content generation successful');
    const content = generateResponse.data.candidates[0]?.content?.parts[0]?.text;
    console.log('💬 Response:', content ? `"${content}"` : 'No content');
    console.log('');

    // 3. Test rate limits (multiple requests)
    console.log('3️⃣ Testing for rate limits...');
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
          testPrompt,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
          }
        ).catch(err => ({ i, error: err.response?.status || err.message }))
      );
    }

    const results = await Promise.all(promises);
    const failures = results.filter(r => r.error);

    console.log(`📊 Rate limit test: ${3 - failures.length}/3 successful`);

    if (failures.length > 0) {
      console.log('⚠️ Rate limit warnings:');
      failures.forEach(f => {
        console.log(`   Request ${f.i + 1}: ${f.error}`);
      });
    }
    console.log('');

    console.log('🎉 OVERALL STATUS: Gemini API is working!');
    return true;

  } catch (error) {
    console.error('❌ Gemini API Test Failed');
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });

    if (error.response?.status === 429) {
      console.log('');
      console.log('🔥 LIKELY CAUSE: Rate Limiting');
      console.log('💡 Solutions:');
      console.log('   - Wait a few minutes and try again');
      console.log('   - Check your Gemini API quota/billing');
      console.log('   - Consider using backup AI services (rule-based fallback should work)');
    } else if (error.response?.status === 403) {
      console.log('');
      console.log('🔒 LIKELY CAUSE: API Key Issues');
      console.log('💡 Solutions:');
      console.log('   - Check if API key is correct');
      console.log('   - Verify API key has Gemini API access');
      console.log('   - Make sure billing is enabled for Gemini API');
    } else if (error.response?.status === 400) {
      console.log('');
      console.log('⚙️ LIKELY CAUSE: Request Format Issues');
      console.log('💡 Solutions:');
      console.log('   - Check the model name/version');
      console.log('   - Verify request format matches API docs');
    }

    return false;
  }
}

comprehensiveTest();
