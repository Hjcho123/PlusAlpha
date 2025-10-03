import axios from 'axios';

// Test Gemini API key
const GEMINI_API_KEY = 'AIzaSyBTb24IHytKBlS3mbZvzwmar0AFBWPamG0';

async function testGeminiAPI() {
  console.log('🤖 Testing Gemini API...');
  console.log(`🔑 API Key: ${GEMINI_API_KEY.substring(0, 10)}...`);

  try {
    // First, let's check available models
    console.log('\n🔍 Checking available models...');
    const modelsResponse = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Available models:');
    const availableModels = modelsResponse.data.models || [];
    availableModels.forEach(model => {
      console.log(`- ${model.name} (${model.displayName})`);
      if (model.supportedGenerationMethods) {
        console.log(`  Supported methods: ${model.supportedGenerationMethods.join(', ')}`);
      }
    });

    // Find a suitable model for text generation
    const textModel = availableModels.find(model =>
      model.supportedGenerationMethods?.includes('generateContent') &&
      (model.name.includes('gemini') || model.name.includes('palm'))
    );

    if (!textModel) {
      console.error('❌ No suitable text generation model found');
      return false;
    }

    console.log(`\n📝 Testing basic text generation with model: ${textModel.displayName}...`);

    // Extract model name from full path (e.g., "models/gemini-pro" from "models/gemini-pro")
    const modelName = textModel.name.split('/').pop() || textModel.name;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: "Hello! Can you tell me about yourself in 2-3 sentences?"
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

    console.log('✅ Basic text generation successful!');
    console.log('📄 Response:');
    const generatedText = response.data.candidates[0]?.content?.parts[0]?.text;
    console.log(generatedText);

    // Test understanding capability
    console.log('\n🧠 Testing understanding capability...');
    const understandingResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: "Analyze this stock data: Apple (AAPL) is trading at $150 with +2.5% change today, volume of 50M shares, PE ratio of 25, and market cap of $2.5T. What is your trading recommendation?"
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

    console.log('✅ Understanding test successful!');
    console.log('📊 Analysis Response:');
    const analysisText = understandingResponse.data.candidates[0]?.content?.parts[0]?.text;
    console.log(analysisText);

    // Test JSON structured response
    console.log('\n🔧 Testing structured JSON response...');
    const jsonResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: "Analyze Tesla stock (TSLA) trading at $200 with -1.2% change, volume 80M, PE ratio 45. Provide analysis in JSON format with fields: description, action (buy/sell/hold), confidence (0-100), reasoning (array of 3 points)."
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

    console.log('✅ JSON structure test successful!');
    console.log('📋 Structured Response:');
    const structuredText = jsonResponse.data.candidates[0]?.content?.parts[0]?.text;
    console.log(structuredText);

    console.log('\n🎉 All Gemini API tests passed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Gemini API test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - API might be slow or unavailable');
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Run the test
testGeminiAPI().then(success => {
  if (success) {
    console.log('\n✅ Gemini API is working correctly!');
  } else {
    console.log('\n❌ Gemini API test failed - check your API key and network connection');
  }
}).catch(error => {
  console.error('💥 Unexpected error:', error);
});
