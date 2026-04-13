const pool = require('../config/database');
const ScoringV2Service = require('./scoring_v2');

class DatabaseScoringIntegration {
    constructor() {
        this.scoringService = new ScoringV2Service();
    }

    /**
     * Fetch funding opportunities from database and score them against user query
     */
    async scoreFundingOpportunities(userQuery, limit = 10) {
        try {
            // Fetch active funding opportunities from database
            const query = `
                SELECT 
                    fo.id, fo.title, fo.description, fo.funder,
                    fo.amount, fo.deadline, fo.eligibility, fo.link,
                    fo.industry_tags, fo.employee_min, fo.employee_max,
                    fo.revenue_min, fo.revenue_max, fo.location_tags,
                    fo.themes, fo.target_audience, fo.remote_eligible,
                    fo.funding_amount_min, fo.funding_amount_max,
                    fo.equity_required, fo.investment_type
                FROM funding_opportunities fo
                WHERE fo.is_active = true
                AND (fo.deadline IS NULL OR fo.deadline > NOW())
                ORDER BY fo.created_at DESC
                LIMIT $1
            `;

            const result = await pool.query(query, [limit]);
            
            if (result.rows.length === 0) {
                return [];
            }

            // Convert database rows to FundingOpportunity objects
            const opportunities = result.rows.map(row => ({
                id: row.id,
                title: row.title,
                description: row.description,
                funder: row.funder,
                amount: row.amount,
                deadline: row.deadline,
                eligibility: row.eligibility,
                link: row.link,
                industry_tags: row.industry_tags || [],
                employee_min: row.employee_min,
                employee_max: row.employee_max,
                revenue_min: row.revenue_min,
                revenue_max: row.revenue_max,
                location_tags: row.location_tags || [],
                themes: row.themes || [],
                target_audience: row.target_audience,
                remote_eligible: row.remote_eligible,
                funding_amount_min: row.funding_amount_min,
                funding_amount_max: row.funding_amount_max,
                equity_required: row.equity_required,
                investment_type: row.investment_type
            }));

            // Score each opportunity
            const scoredOpportunities = [];
            for (const opportunity of opportunities) {
                try {
                    const scorecard = this.scoringService.calculateScore(opportunity, userQuery);
                    scoredOpportunities.push({
                        ...opportunity,
                        score: scorecard.total_score,
                        justification: scorecard.justification,
                        category_scores: scorecard.category_scores
                    });
                } catch (error) {
                    console.error(`Error scoring opportunity ${opportunity.id}:`, error);
                }
            }

            // Sort by score descending
            return scoredOpportunities.sort((a, b) => b.score - a.score);

        } catch (error) {
            console.error('Database scoring error:', error);
            throw error;
        }
    }

    /**
     * Get top matches for a user query
     */
    async getTopMatches(userQuery, limit = 5) {
        const scoredOpportunities = await this.scoreFundingOpportunities(userQuery, 20);
        return scoredOpportunities.slice(0, limit);
    }

    /**
     * Save scoring results to database for analytics
     */
    async saveScoringResult(userQuery, opportunityId, score, details) {
        try {
            const query = `
                INSERT INTO match_results 
                (user_query, opportunity_id, score, score_details, created_at)
                VALUES ($1, $2, $3, $4, NOW())
            `;

            await pool.query(query, [
                JSON.stringify(userQuery),
                opportunityId,
                score,
                JSON.stringify(details)
            ]);

        } catch (error) {
            console.error('Error saving scoring result:', error);
        }
    }
}

module.exports = DatabaseScoringIntegration;