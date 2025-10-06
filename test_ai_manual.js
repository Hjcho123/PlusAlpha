#!/usr/bin/env node

const axios = require('axios');

async function testAI() {
  try {
    console.log('🤖 Testing AI Demo with Comprehensive Data...');
    console.log('');

    const response = await axios.get('http://localhost:3000/api/ai/demo/AAPL');
    const data = response.data;

    console.log('📊 API Response Status:', response.status);
    console.log('💬 Message:', data.message);
    console.log('✅ Success:', data.success);
    console.log('');

    if (data.success && data.data) {
      const insight = data.data;
      console.log('\n🧠 📊 GEMINI AI ANALYSIS RESULT 📊 🧠');
      console.log('=' .repeat(60));
      console.log('📝 Description:', insight.description);
      console.log('🎯 Action:', insight.action);
      console.log('📊 Confidence:', insight.confidence + '%');
      console.log('');

      console.log('🧠 AI Reasoning Points:');
      console.log('-'.repeat(30));
      if (insight.reasoning && insight.reasoning.length > 0) {
        insight.reasoning.forEach((reason, i) => {
          console.log(`  ${i+1}. ${reason}`);
        });
      } else {
        console.log('  No detailed reasoning provided');
      }
      console.log('');

      console.log('📊 VERIFICATION: Comprehensive Data Integration');
      console.log('-'.repeat(50));

      // Check if comprehensive data indicators are present
      const desc = insight.description.toLowerCase();
      const hasPE = desc.includes('pe') || desc.includes('valuation');
      const hasFinancials = desc.includes('roe') || desc.includes('financial') || desc.includes('fundamentals');
      const hasAnalysts = desc.includes('analyst') || desc.includes('consensus') || desc.includes('ratings');
      const hasCompanyInfo = desc.includes('sector') || desc.includes('company') || desc.includes('ceo');

      console.log(`✅ PE/PEG Valuation Analysis: ${hasPE ? 'PRESENT' : 'MISSING'}`);
      console.log(`✅ Financial Health (ROA/ROE): ${hasFinancials ? 'PRESENT' : 'MISSING'}`);
      console.log(`✅ Analyst Consensus: ${hasAnalysts ? 'PRESENT' : 'MISSING'}`);
      console.log(`✅ Company Profile: ${hasCompanyInfo ? 'PRESENT' : 'MISSING'}`);

      const dataScore = (hasPE + hasFinancials + hasAnalysts + hasCompanyInfo) / 4 * 100;
      console.log(`📈 Comprehensive Data Score: ${dataScore.toFixed(0)}%`);
      console.log('='.repeat(60));

    } else {
      console.log('❌ No insight data received from API');
    }

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAI();
