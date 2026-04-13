// Scoring System Demo
// Demonstrates how the scoring framework will work once rules are defined

const { ScoringEngine, exampleScorers } = require('./scoring_framework');

// Create scoring engine instance
const scoringEngine = new ScoringEngine();

// Register example scoring rules (these will be replaced with actual rules)
scoringEngine.addRule(
    'industry_match',
    'Matches founder industry with opportunity industry',
    30, // 30% weight
    exampleScorers.industryMatch
);

scoringEngine.addRule(
    'location_proximity', 
    'Geographic proximity between founder and opportunity',
    20, // 20% weight
    exampleScorers.locationProximity
);

scoringEngine.addRule(
    'funding_suitability',
    'Suitability of funding amount to founder needs',
    25, // 25% weight
    exampleScorers.fundingSuitability
);

// Example data structures (matching our database schema)
const mockFounderProfile = {
    id: 'founder-001',
    company_name: 'TechInnovate GmbH',
    industry: 'technology',
    country: 'Germany',
    city: 'Berlin',
    funding_needs: 500000,
    stage: 'seed',
    team_size: 5,
    tech_stack: ['JavaScript', 'Node.js', 'React'],
    business_model: 'B2B SaaS',
    target_market: 'European SMEs'
};

const mockFundingOpportunity = {
    id: 'fund-001',
    title: 'Early Stage Tech Fund',
    industry: 'technology',
    amount_min: 450000,
    amount_max: 750000,
    investment_type: 'equity',
    geographic_focus: 'Europe',
    stage_focus: 'seed',
    country: 'Germany',
    city: 'Munich'
};

const mockEquipmentListing = {
    id: 'equip-001',
    title: 'High-Performance Server Cluster',
    category: 'computing',
    price_per_day: 250,
    location: 'Berlin, Germany',
    condition: 'excellent'
};

// Demo function to show scoring in action
async function demonstrateScoring() {
    console.log('=== STARTUP RADAR SCORING DEMO ===\n');
    
    // Show available scoring rules
    console.log('Available Scoring Rules:');
    const rules = scoringEngine.getRules();
    rules.forEach((rule, index) => {
        console.log(`${index + 1}. ${rule.name} (${rule.weight}%) - ${rule.description}`);
    });
    
    console.log('\n' + '='.repeat(50));
    
    // Demo 1: Funding opportunity matching
    console.log('\nDEMO 1: Funding Opportunity Matching');
    console.log('Founder:', mockFounderProfile.company_name);
    console.log('Opportunity:', mockFundingOpportunity.title);
    
    const fundingScore = await scoringEngine.calculateMatchScore(
        mockFounderProfile,
        mockFundingOpportunity
    );
    
    console.log('\nTotal Score:', fundingScore.total.toFixed(1) + '/100');
    console.log('Score Breakdown:');
    Object.entries(fundingScore.breakdown).forEach(([ruleName, scoreInfo]) => {
        console.log(`  ${ruleName}: ${scoreInfo.raw}/100 → ${scoreInfo.weighted.toFixed(1)}/${scoreInfo.max}`);
    });
    
    console.log('\n' + '='.repeat(50));
    
    // Demo 2: Equipment matching (different rule weights would apply)
    console.log('\nDEMO 2: Equipment Matching (Conceptual)');
    console.log('Founder:', mockFounderProfile.company_name);
    console.log('Equipment:', mockEquipmentListing.title);
    
    // For equipment, we'd use different rules with different weights
    console.log('\nNote: Equipment matching would use different rules:');
    console.log('- Location proximity (higher weight for equipment)');
    console.log('- Price suitability');
    console.log('- Equipment condition match');
    console.log('- Rental period alignment');
    
    console.log('\n' + '='.repeat(50));
    
    // Show what the actual implementation would look like
    console.log('\nREADY FOR ACTUAL RULES:');
    console.log('1. The scoring framework is complete and tested');
    console.log('2. Database integration is ready');
    console.log('3. We need Alisia to define the actual matching rules');
    console.log('4. Once rules are defined, we can:');
    console.log('   - Replace exampleScorers with real scoring functions');
    console.log('   - Set appropriate weights for each rule');
    console.log('   - Implement rule-specific configuration');
    console.log('   - Add rule: service_provider_expertise');
    console.log('   - Add rule: timeline_compatibility');
    console.log('   - Add rule: cultural_fit');
    
    console.log('\nNEXT STEPS: Wait for SR-301 (Matching Rules v2) definition from Alisia');
}

// Run the demo
if (require.main === module) {
    demonstrateScoring().catch(console.error);
}

module.exports = { demonstrateScoring };