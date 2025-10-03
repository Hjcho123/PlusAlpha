import axios from 'axios';

// Simple proof that Gemini API is working
const GEMINI_API_KEY = 'AIzaSyBTb24IHytKBlS3mbZvzwmar0AFBWPamG0';

async function proveGeminiWorks() {
  console.log('🔥 PROOF OF GEMINI API WORKING');
  console.log('🔑 API Key:', GEMINI_API_KEY.substring(0, 20) + '...');
  console.log('📊 This API call will DEFINITELY show in your dashboard');
  console.log('');

  try {
    console.log('🚀 Making API call to Gemini...');

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: 'PROOF TEST: Return this exact JSON: {"status": "success", "message": "Gemini API is working", "timestamp": "' + new Date().toISOString() + '"}'
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

    console.log('✅ SUCCESS!');
    console.log('📊 Status Code:', response.status);
    console.log('📄 Response:', response.data.candidates[0]?.content?.parts[0]?.text);

    console.log('\n🎉 GEMINI API IS WORKING PERFECTLY!');
    console.log('📋 CHECK YOUR GEMINI DASHBOARD NOW');
    console.log('🔍 Look for API calls in the last few minutes');

    return true;

  } catch (error) {
    console.error('\n❌ API call failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

proveGeminiWorks();
