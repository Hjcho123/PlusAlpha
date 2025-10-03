const axios = require('axios');

async function testGroqAPI() {
  const GROQ_API_KEY = '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';

  console.log('🤖 Testing Groq API with your API key...\n');

  try {
    // Test 1: Check available models
    console.log('📋 Test 1: Checking available models...');
    const modelsResponse = await axios.get(
      'https://api.groq.com/openai/v1/models',
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Available models:');
    modelsResponse.data.data.forEach(model => {
      console.log(`  - ${model.id} (${model.object})`);
    });

    // Test 2: Use llama-3.3-70b-versatile for financial analysis
    const financialModel = 'llama-3.3-70b-versatile';

    console.log(`\n📊 Test 2: Financial analysis with ${financialModel}...`);
    const response2 = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: financialModel,
        messages: [
          {
            role: "user",
            content: "Analyze this stock: AAPL trading at $150 with +2.5% change today, volume 50M shares. What does this suggest about market sentiment?"
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Groq API: SUCCESS');
    console.log('Analysis:', response2.data.choices[0]?.message?.content?.substring(0, 150) + '...\n');

    console.log('🎉 Groq API is working perfectly!');
    console.log('💰 Free tier: 5,000 tokens/day');
    console.log('🚀 Your AI service will now use Groq for all financial analysis');

  } catch (error) {
    console.error('❌ Groq API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testGroqAPI();
