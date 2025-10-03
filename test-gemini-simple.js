import axios from 'axios';

// Test Gemini API key - using the exact key from user
const GEMINI_API_KEY = 'AIzaSyBTb24IHytKBlS3mbZvzwmar0AFBWPamG0';

async function simpleTest() {
  console.log('🔑 Testing API key:', GEMINI_API_KEY.substring(0, 20) + '...');

  try {
    // Simple models list request
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      { timeout: 5000 }
    );

    console.log('✅ SUCCESS: API key is working!');
    console.log('📊 Found', response.data.models?.length || 0, 'models');
    console.log('🎯 This API call WILL show up in your Gemini dashboard');

    // Show first few models as proof
    const firstModels = response.data.models?.slice(0, 3) || [];
    firstModels.forEach(model => {
      console.log(`   - ${model.displayName}`);
    });

    return true;
  } catch (error) {
    console.error('❌ FAILED: API key not working');
    if (error.response?.status === 400) {
      console.error('   Invalid API key format');
    } else if (error.response?.status === 403) {
      console.error('   API key doesn\'t have permission');
    } else if (error.response?.status === 404) {
      console.error('   API endpoint not found');
    } else {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

simpleTest();
