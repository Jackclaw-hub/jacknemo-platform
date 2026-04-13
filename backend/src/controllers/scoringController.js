const ScoringV2Service = require('../services/scoring_v2');
const { UserQuery } = require('../../autofiller/src/entities/user_query');
const { FundingOpportunity } = require('../../autofiller/src/entities/funding_opportunity');

// Initialize scoring service
const scoringService = new ScoringV2Service();

/**
 * Calculate match score between user profile and opportunity
 * POST /api/scoring/calculate
 */
const calculateScore = async (req, res) => {
  try {
    const { opportunity, userProfile } = req.body;
    
    if (!opportunity || !userProfile) {
      return res.status(400).json({
        error: 'Missing required fields: opportunity and userProfile'
      });
    }

    // Convert to proper entities
    const fundingOpportunity = new FundingOpportunity({
      title: opportunity.title,
      description: opportunity.description,
      funder: opportunity.funder,
      amount: opportunity.amount,
      deadline: opportunity.deadline,
      eligibility: opportunity.eligibility,
      link: opportunity.link,
      source: opportunity.source,
      raw_data: opportunity.raw_data || {},
      industry_tags: opportunity.industry_tags || [],
      employee_min: opportunity.employee_min,
      employee_max: opportunity.employee_max,
      revenue_min: opportunity.revenue_min,
      revenue_max: opportunity.revenue_max,
      location_tags: opportunity.location_tags || [],
      themes: opportunity.themes || [],
      target_audience: opportunity.target_audience
    });

    const userQuery = new UserQuery({
      text: userProfile.search_query || `${userProfile.industry} ${userProfile.business_model}`,
      timestamp: new Date(),
      employee_count: userProfile.team_size,
      annual_revenue: userProfile.annual_revenue,
      industry: userProfile.industry,
      location_state: userProfile.location_state || userProfile.country,
      funding_needed: userProfile.funding_needs,
      equity_willingness: userProfile.equity_willingness,
      investment_preference: userProfile.investment_preference,
      remote_preference: userProfile.remote_preference,
      company_stage: userProfile.stage,
      technology_focus: userProfile.tech_stack ? userProfile.tech_stack.join(', ') : ''
    });

    // Calculate score
    const scorecard = scoringService.calculate_score(fundingOpportunity, userQuery);

    res.json({
      success: true,
      data: {
        total_score: scorecard.total_score,
        justification: scorecard.justification,
        category_scores: scorecard.category_scores,
        positive_factors: scorecard.positive_factors,
        negative_factors: scorecard.negative_factors,
        opportunity: fundingOpportunity
      }
    });

  } catch (error) {
    console.error('Scoring error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to calculate score'
    });
  }
};

module.exports = {
  calculateScore
};