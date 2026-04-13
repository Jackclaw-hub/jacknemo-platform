const DatabaseScoringIntegration = require('./backend/src/services/database_scoring_integration');

async function testDatabaseScoring() {
    console.log('Testing Database Scoring Integration...\n');

    try {
        const scoringIntegration = new DatabaseScoringIntegration();

        // Mock user query (would come from frontend)
        const userQuery = {
            text: "AI startup funding for machine learning",
            industry: "AI",
            location_state: "California",
            employee_count: 25,
            annual_revenue: 1000000,
            funding_needed: 250000,
            equity_willingness: 15.0,
            investment_preference: "Equity",
            remote_preference: true
        };

        console.log('Scoring funding opportunities against user query:');
        console.log(JSON.stringify(userQuery, null, 2));
        console.log('\n' + '='.repeat(50) + '\n');

        // Get top matches
        const topMatches = await scoringIntegration.getTopMatches(userQuery, 3);

        if (topMatches.length === 0) {
            console.log('No funding opportunities found in database.');
            console.log('Please check if the database has seed data.');
            return;
        }

        console.log('TOP MATCHES:');
        console.log('='.repeat(50));

        topMatches.forEach((match, index) => {
            console.log(`\n${index + 1}. ${match.title}`);
            console.log(`   Score: ${match.score.toFixed(1)}/100`);
            console.log(`   Funder: ${match.funder}`);
            console.log(`   Amount: ${match.amount}`);
            console.log(`   Deadline: ${match.deadline}`);
            console.log(`   Justification: ${match.justification}`);
            console.log('   Category Scores:', JSON.stringify(match.category_scores, null, 2));
            console.log('-'.repeat(50));
        });

        console.log('\n✅ Database scoring integration test completed!');

    } catch (error) {
        console.error('❌ Error in database scoring test:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('Please ensure PostgreSQL database is running and accessible');
            console.log('Database URL:', process.env.DATABASE_URL);
        }
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testDatabaseScoring();
}

module.exports = { testDatabaseScoring };