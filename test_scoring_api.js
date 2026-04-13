#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test data
const testData = {
  opportunity: {
    title: "AI Startup Funding Round",
    description: "This funding opportunity targets AI startups working on machine learning solutions with innovative business models",
    funder: "Tech Innovation Fund",
    amount: "€500,000",
    deadline: "2024-12-31",
    eligibility: "AI startups in Europe with 5-50 employees",
    link: "https://example.com/funding",
    source: "test",
    industry_tags: ["AI", "Technology", "Machine Learning"],
    employee_min: 5,
    employee_max: 50,
    revenue_min: 100000,
    revenue_max: 5000000,
    location_tags: ["Europe", "Remote"],
    themes: ["innovation", "machine learning", "AI"],
    target_audience: "Early-stage AI startups"
  },
  userProfile: {
    search_query: "AI startup funding for machine learning",
    industry: "AI",
    team_size: 25,
    annual_revenue: 1000000,
    location_state: "Germany",
    country: "Germany",
    funding_needs: 250000,
    equity_willingness: 15,
    investment_preference: "Equity",
    remote_preference: true,
    stage: "seed",
    tech_stack: ["Python", "TensorFlow", "AWS"],
    business_model: "B2B SaaS"
  }
};

async function testScoringAPI() {
  console.log('Testing Scoring API Integration...\n');
  
  try {
    // Test scoring endpoint
    console.log('1. Testing POST /api/scoring/calculate...');
    
    const response = await axios.post(`${BASE_URL}/scoring/calculate`, testData);
    
    console.log('✅ Success! API responded with:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Total Score: ${response.data.data.total_score}`);
    console.log(`   Justification: ${response.data.data.justification}`);
    console.log('\n   Category Scores:');
    Object.entries(response.data.data.category_scores).forEach(([category, score]) => {
      console.log(`     ${category}: ${(score * 100).toFixed(1)}%`);
    });
    
    console.log('\n🎉 Scoring API integration test PASSED!');
    return true;
    
  } catch (error) {
    console.log('❌ API Test Failed:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error}`);
      console.log(`   Message: ${error.response.data.message}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

// Run test
if (require.main === module) {
  testScoringAPI()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test execution error:', error);
      process.exit(1);
    });
}

module.exports = { testScoringAPI };