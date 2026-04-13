// Scoring Framework v2 - Technical Foundation
// This provides the infrastructure for implementing scoring rules once they are defined

class ScoringEngine {
    constructor() {
        this.rules = [];
        this.weights = {};
        this.minScore = 0;
        this.maxScore = 100;
    }

    // Register a scoring rule
    addRule(name, description, weight, scorerFunction) {
        this.rules.push({
            name,
            description,
            weight,
            scorer: scorerFunction
        });
        this.weights[name] = weight;
    }

    // Calculate total score for a match
    async calculateMatchScore(founderProfile, opportunity, context = {}) {
        let totalScore = 0;
        const ruleScores = {};
        const maxPossibleScore = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0);

        // Calculate each rule score
        for (const rule of this.rules) {
            try {
                const ruleScore = await rule.scorer(founderProfile, opportunity, context);
                const weightedScore = (ruleScore * rule.weight) / 100;
                
                ruleScores[rule.name] = {
                    raw: ruleScore,
                    weighted: weightedScore,
                    max: rule.weight
                };
                
                totalScore += weightedScore;
            } catch (error) {
                console.error(`Error in rule ${rule.name}:`, error);
                ruleScores[rule.name] = { error: error.message };
            }
        }

        // Normalize to 0-100 scale
        const normalizedScore = maxPossibleScore > 0 
            ? (totalScore / maxPossibleScore) * 100 
            : 0;

        return {
            total: Math.min(Math.max(normalizedScore, this.minScore), this.maxScore),
            breakdown: ruleScores,
            maxPossible: maxPossibleScore
        };
    }

    // Get available scoring rules
    getRules() {
        return this.rules.map(rule => ({
            name: rule.name,
            description: rule.description,
            weight: rule.weight
        }));
    }
}

// Example scoring functions (to be replaced with actual rules from Alisia)
const exampleScorers = {
    // Industry match scoring
    industryMatch: async (founder, opportunity) => {
        const founderIndustry = founder.industry?.toLowerCase();
        const oppIndustry = opportunity.industry?.toLowerCase();
        
        if (!founderIndustry || !oppIndustry) return 0;
        
        if (founderIndustry === oppIndustry) return 100;
        
        // TODO: Implement industry similarity matrix
        return 30; // Partial match
    },

    // Location proximity scoring
    locationProximity: async (founder, opportunity) => {
        const founderCountry = founder.country;
        const oppCountry = opportunity.country;
        
        if (!founderCountry || !oppCountry) return 0;
        
        if (founderCountry === oppCountry) return 100;
        
        // TODO: Implement geographic proximity calculation
        return 20; // Different countries
    },

    // Funding amount suitability
    fundingSuitability: async (founder, opportunity) => {
        const founderNeeds = founder.funding_needs;
        const oppAmount = opportunity.amount_min;
        
        if (!founderNeeds || !oppAmount) return 0;
        
        const ratio = founderNeeds / oppAmount;
        
        // Ideal range: 0.8 to 1.2 (80-120% of needed amount)
        if (ratio >= 0.8 && ratio <= 1.2) return 100;
        if (ratio >= 0.5 && ratio <= 2.0) return 70;
        
        return 30;
    }
};

// Export the scoring engine
module.exports = {
    ScoringEngine,
    exampleScorers
};