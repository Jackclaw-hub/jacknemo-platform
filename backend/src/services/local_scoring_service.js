/**
 * Local Scoring Service - Works without external dependencies
 * Uses file-based mock data instead of live database connection
 */

const fs = require('fs').promises;
const path = require('path');

class LocalScoringService {
    constructor() {
        this.mockDataPath = path.join(__dirname, '../../mock_data.json');
    }

    async loadMockData() {
        try {
            const data = await fs.readFile(this.mockDataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Fallback to default mock data
            return {
                funding_opportunities: [
                    {
                        id: "fund-1",
                        title: "AI Innovation Grant",
                        description: "Funding for AI startups working on machine learning innovations",
                        funder: "European Innovation Council",
                        amount: "€50,000 - €250,000",
                        deadline: "2024-12-31",
                        eligibility: "AI startups with 5-50 employees",
                        link: "https://example.com/ai-grant",
                        industry_tags: ["AI", "Machine Learning", "Technology"],
                        employee_min: 5,
                        employee_max: 50,
                        revenue_min: 100000,
                        revenue_max: 2000000,
                        location_tags: ["Europe", "Remote"],
                        themes: ["innovation", "AI", "machine learning"],
                        target_audience: "Startups"
                    },
                    {
                        id: "fund-2", 
                        title: "Climate Tech Accelerator",
                        description: "Funding and acceleration for climate technology startups",
                        funder: "Green Future Fund",
                        amount: "€100,000 - €500,000",
                        deadline: "2024-09-30",
                        eligibility: "Climate tech startups with proven prototype",
                        link: "https://example.com/climate-tech",
                        industry_tags: ["Climate", "Sustainability", "Clean Tech"],
                        employee_min: 3,
                        employee_max: 30,
                        revenue_min: 50000,
                        revenue_max: 1000000,
                        location_tags: ["Global"],
                        themes: ["sustainability", "climate", "clean energy"],
                        target_audience: "Early-stage startups"
                    }
                ]
            };
        }
    }

    /**
     * Simple scoring algorithm (mock version)
     */
    calculateScore(opportunity, userQuery) {
        let score = 50; // Base score
        const factors = [];

        // Industry match
        if (userQuery.industry && opportunity.industry_tags) {
            const industryMatch = opportunity.industry_tags.includes(userQuery.industry);
            if (industryMatch) {
                score += 20;
                factors.push(`Industry match: ${userQuery.industry}`);
            }
        }

        // Text similarity (simple version)
        if (userQuery.text && opportunity.description) {
            const queryWords = userQuery.text.toLowerCase().split(' ');
            const descWords = opportunity.description.toLowerCase().split(' ');
            const matches = queryWords.filter(word => descWords.includes(word)).length;
            const similarity = matches / Math.max(queryWords.length, 1);
            score += similarity * 15;
        }

        // Company size match
        if (userQuery.employee_count && opportunity.employee_min && opportunity.employee_max) {
            if (userQuery.employee_count >= opportunity.employee_min && 
                userQuery.employee_count <= opportunity.employee_max) {
                score += 10;
                factors.push("Company size match");
            }
        }

        // Ensure score is between 0-100
        score = Math.max(0, Math.min(100, score));

        return {
            total_score: score,
            justification: factors.length > 0 ? 
                `Positive factors: ${factors.join(', ')}` : 
                "Limited match based on available criteria",
            category_scores: {
                industry_match: factors.includes('Industry match') ? 0.8 : 0.3,
                text_similarity: 0.6,
                company_fit: factors.includes('Company size match') ? 0.9 : 0.4
            }
        };
    }

    /**
     * Get scored opportunities for user query
     */
    async getScoredOpportunities(userQuery, limit = 5) {
        const data = await this.loadMockData();
        const opportunities = data.funding_opportunities || [];

        const scored = opportunities.map(opp => {
            const scorecard = this.calculateScore(opp, userQuery);
            return {
                ...opp,
                score: scorecard.total_score,
                justification: scorecard.justification,
                category_scores: scorecard.category_scores
            };
        });

        // Sort by score descending and return top results
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
}

module.exports = LocalScoringService;