#!/usr/bin/env node

/**
 * Scoring Demo - Standalone script for scoring opportunities
 * This can be called from the API or used independently
 */

const LocalScoringService = require('./backend/src/services/local_scoring_service');

async function main() {
    // Parse input data from command line
    const inputData = process.argv[2] ? JSON.parse(process.argv[2]) : {};
    
    const userQuery = inputData.user_query || {
        text: "AI startup funding",
        industry: "AI",
        employee_count: 25,
        annual_revenue: 1000000,
        location_state: "California"
    };
    
    const opportunities = inputData.opportunities || [];
    
    // Use the local scoring service
    const scoringService = new LocalScoringService();
    
    try {
        const results = await scoringService.getScoredOpportunities(userQuery, 10);
        
        // Output JSON results
        console.log(JSON.stringify({
            success: true,
            results: results,
            user_query: userQuery,
            timestamp: new Date().toISOString()
        }, null, 2));
        
    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, null, 2));
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}