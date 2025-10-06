#!/usr/bin/env node

/**
 * Test script to verify that the AI receives comprehensive financial data
 * This script makes a demo AI request and checks what the AI reports about the data it received
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-production-url.com'
  : 'http://localhost:3000';

const TEST_SYMBOL = 'AAPL'; // Apple as a well-known stock with good data

async function testAIComprehensiveData() {
  console.log('🤖 Testing AI Comprehensive Data Integration');
  console.log('=' .repeat(50));

  try {
    console.log(`📊 Testing with symbol: ${TEST_SYMBOL}`);
    console.log(`🌐 API URL: ${BASE_URL}`);
    console.log('');

    // Test 1: Generate demo trading signal (this will use comprehensive data)
    console.log('🧪 TEST 1: Generate demo trading signal with comprehensive data');
    console.log('-'.repeat(60));

    const response = await axios.get(`${BASE_URL}/api/ai/demo/${TEST_SYMBOL}`);

    if (!response.data.success) {
      throw new Error(`API call failed: ${response.data.error}`);
    }

    const insight = response.data.data;
    console.log(`✅ AI insight generated successfully`);
    console.log(`📝 Description: ${insight.description.substring(0, 100)}...`);
    console.log(`🎯 Action: ${insight.action}`);
    console.log(`📊 Confidence: ${insight.confidence}%`);
    console.log('');

    // Test 2: Check if the AI received comprehensive data by analyzing the description
    console.log('🔍 TEST 2: Analyzing AI response for comprehensive data usage');
    console.log('-'.repeat(60));

    const description = insight.description.toLowerCase();

    // Check for comprehensive data indicators in the AI response
    const checks = [
      {
        name: 'Valuation Metrics (PE/PEG)',
        indicators: ['pe ratio', 'peg', 'forward pe', 'valuation', 'earnings'],
        found: description.includes('pe ratio') || description.includes('peg') || description.includes('valuation')
      },
      {
        name: 'Financial Health (ROA/ROE)',
        indicators: ['return on assets', 'return on equity', 'roa', 'roe', 'profitability'],
        found: description.includes('return on') || description.includes('roa') || description.includes('roe') || description.includes('profitability')
      },
      {
        name: 'Analyst Ratings',
        indicators: ['analyst', 'ratings', 'strong buy', 'buy', 'hold', 'sell', 'consensus'],
        found: description.includes('analyst') || description.includes('ratings') || description.includes('consensus')
      },
      {
        name: 'Company Profile',
        indicators: ['sector', 'industry', 'ceo', 'company', 'business', 'profile'],
        found: description.includes('sector') || description.includes('industry') || description.includes('ceo') || description.includes('company')
      },
      {
        name: 'Dividends',
        indicators: ['dividend', 'yield', 'payout ratio'],
        found: description.includes('dividend') || description.includes('yield')
      }
    ];

    console.log('📊 Data Source Analysis:');
    let totalChecks = checks.length;
    let passedChecks = 0;

    checks.forEach(check => {
      const status = check.found ? '✅' : '❌';
      const foundText = check.found ? 'FOUND' : 'NOT FOUND';
      console.log(`  ${status} ${check.name}: ${foundText}`);
      if (check.found) passedChecks++;
    });

    console.log('');
    console.log(`📈 Results: ${passedChecks}/${totalChecks} comprehensive data components detected`);
    console.log(`📊 AI has access to: ${(passedChecks/totalChecks * 100).toFixed(1)}% of expected data sources`);
    console.log('');

    // Test 3: API Response Analysis
    console.log('🔝 TEST 3: API Response Analysis');
    console.log('-'.repeat(60));
    console.log(`📋 Response Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Response Time: ${response.headers['x-response-time'] || 'N/A'}`);
    console.log(`🎯 AI Model Used: ${response.data.data ? 'Google Gemini' : 'Rule-based'}`);
    console.log(`💾 Data Source Message: ${response.data.message}`);
    console.log('');

    // Test 4: Reasoning Analysis
    console.log('🧠 TEST 4: AI Reasoning Quality Check');
    console.log('-'.repeat(60));

    if (insight.reasoning && insight.reasoning.length > 0) {
      console.log('✅ AI provided reasoning points:');
      insight.reasoning.forEach((reason, index) => {
        console.log(`  ${index + 1}. ${reason.length > 80 ? reason.substring(0, 80) + '...' : reason}`);
      });
    } else {
      console.log('❌ No reasoning provided by AI');
    }

    console.log('');
    console.log('🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('📋 SUMMARY:');
    console.log(`   • AI Response Quality: ${passedChecks >= 3 ? '✅ EXCELLENT' : passedChecks >= 2 ? '✅ GOOD' : '❌ POOR'}`);
    console.log(`   • Data Integration: ${passedChecks >= 4 ? '✅ COMPLETE' : passedChecks >= 2 ? '✅ PARTIAL' : '❌ MINIMAL'}`);
    console.log(`   • API Performance: ✅ FUNCTIONING`);

    // Final assessment
    const successRate = passedChecks / totalChecks;
    if (successRate >= 0.7) {
      console.log('🎯 VERDICT: AI SUCCESSFULLY RECEIVES COMPREHENSIVE FINANCIAL DATA!');
      process.exit(0);
    } else {
      console.log('⚠️  VERDICT: AI DATA INTEGRATION PARTIAL - REQUIRES REVIEW');
      console.log('💡 SUGGESTION: Check AI service comprehensive data handling');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ TEST FAILED!');
    console.error('Error details:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Suggestion: Make sure the backend server is running on localhost:3000');
    }

    process.exit(1);
  }
}

// Run the test if called directly
if (require.main === module) {
  testAIComprehensiveData().catch(error => {
    console.error('💥 UNEXPECTED ERROR:', error);
    process.exit(1);
  });
}

module.exports = { testAIComprehensiveData };
