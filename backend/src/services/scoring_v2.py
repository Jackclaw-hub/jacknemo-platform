import re
import math
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import sys
import os

# Add autofiller to path to use existing entities
sys.path.insert(0, '/sandbox/.openclaw/workspace/autofiller/src')

from entities.user_query import UserQuery
from entities.funding_opportunity import FundingOpportunity
from entities.scorecard import Scorecard

# Define the interface locally instead of importing
class IScoreCalculator:
    def calculate_score(self, opportunity: FundingOpportunity, query: UserQuery) -> Scorecard:
        """Calculate a scorecard for the given funding opportunity based on the user query and company data."""
        raise NotImplementedError()

@dataclass
class ScoringConfig:
    """Configuration for scoring v2 weights and parameters"""
    TEXT_MATCH_WEIGHT = 0.20
    THEME_MATCH_WEIGHT = 0.20
    COMPANY_FIT_WEIGHT = 0.15
    FINANCIAL_FIT_WEIGHT = 0.15
    TIMING_MATCH_WEIGHT = 0.15
    GEOGRAPHIC_MATCH_WEIGHT = 0.15
    
    # Text matching parameters
    TITLE_BOOST_FACTOR = 2.0
    MIN_TEXT_MATCH_THRESHOLD = 0.1
    
    # Company fit parameters
    EMPLOYEE_COUNT_OPTIMAL_RANGE = 0.3  # 30% deviation from optimal
    REVENUE_OPTIMAL_RANGE = 0.4         # 40% deviation from optimal
    
    # Timing parameters
    APPLICATION_DEADLINE_PROXIMITY = 90  # days
    FUNDING_START_PROXIMITY = 180        # days


class ScoringV2Service(IScoreCalculator):
    """Scoring v2 Service implementing 6 scoring components:
    1. Text Match Score - Keyword matching in title/description
    2. Theme Match Score - Industry, sector, and thematic alignment
    3. Company Fit Score - Employee count, revenue, stage matching
    4. Financial Fit Score - Funding amount, equity requirements
    5. Timing Match Score - Application deadlines and funding cycles
    6. Geographic Match Score - Location compatibility
    """

    def __init__(self, config: Optional[ScoringConfig] = None):
        self.config = config or ScoringConfig()

    def calculate_score(self, opportunity: FundingOpportunity, query: UserQuery) -> Scorecard:
        """Calculate comprehensive score using all 6 scoring components
        Implements the IScoreCalculator interface
        """
        category_scores = {}
        positive_factors = []
        negative_factors = []

        # Component 1: Text Match Score
        text_score = self._calculate_text_match_score(query.text, opportunity)
        category_scores["text_match"] = text_score

        # Component 2: Theme Match Score
        theme_score = self._calculate_theme_match_score(query, opportunity, positive_factors)
        category_scores["theme_match"] = theme_score

        # Component 3: Company Fit Score
        company_score = self._calculate_company_fit_score(query, opportunity)
        category_scores["company_fit"] = company_score

        # Component 4: Financial Fit Score
        financial_score = self._calculate_financial_fit_score(query, opportunity)
        category_scores["financial_fit"] = financial_score

        # Component 5: Timing Match Score
        timing_score = self._calculate_timing_match_score(opportunity)
        category_scores["timing_match"] = timing_score

        # Component 6: Geographic Match Score
        geo_score = self._calculate_geographic_match_score(query, opportunity)
        category_scores["geographic_match"] = geo_score

        # Calculate weighted total score
        total_score = (
            text_score * self.config.TEXT_MATCH_WEIGHT +
            theme_score * self.config.THEME_MATCH_WEIGHT +
            company_score * self.config.COMPANY_FIT_WEIGHT +
            financial_score * self.config.FINANCIAL_FIT_WEIGHT +
            timing_score * self.config.TIMING_MATCH_WEIGHT +
            geo_score * self.config.GEOGRAPHIC_MATCH_WEIGHT
        ) * 100
        # Scale to 0-100

        # Generate justification
        justification = self._generate_justification(category_scores, positive_factors, negative_factors)

        return Scorecard(
            opportunity=opportunity,
            total_score=total_score,
            justification=justification,
            category_scores=category_scores,
            positive_factors=positive_factors,
            negative_factors=negative_factors
        )

    def _calculate_text_match_score(self, query_text: str, opportunity: FundingOpportunity) -> float:
        """Component 1: Text matching with semantic weighting"""
        if not query_text or not opportunity.description:
            return 0.0

        query_words = set(re.findall(r"\w+", query_text.lower()))
        desc_words = set(re.findall(r"\w+", opportunity.description.lower()))
        title_words = set(re.findall(r"\w+", opportunity.title.lower()))

        # Calculate basic word overlap
        desc_matches = len(query_words.intersection(desc_words))
        title_matches = len(query_words.intersection(title_words))

        # Apply title boost
        total_matches = desc_matches + (title_matches * self.config.TITLE_BOOST_FACTOR)

        if not query_words:
            return 0.0

        match_ratio = total_matches / len(query_words)

        # Apply minimum threshold
        if match_ratio < self.config.MIN_TEXT_MATCH_THRESHOLD:
            return 0.0

        return min(match_ratio, 1.0)

    def _calculate_theme_match_score(self, query: UserQuery, opportunity: FundingOpportunity, positive_factors: List[str]) -> float:
        """Component 2: Theme and industry matching"""
        score = 0.0
        max_possible = 100.0

        # Industry match (40%)
        if query.industry and opportunity.industry_tags:
            query_industry = query.industry.lower()
            opportunity_industries = [tag.lower() for tag in opportunity.industry_tags]
            if query_industry in opportunity_industries:
                score += 40
                positive_factors.append(f"Industry match: {query.industry}")

        # Sector/thematic match (30%)
        if query.text and opportunity.themes:
            query_words = set(re.findall(r"\w+", query.text.lower()))
            theme_words = set([theme.lower() for theme in opportunity.themes])
            matches = query_words.intersection(theme_words)
            if matches:
                score += min(len(matches) * 10, 30)
                positive_factors.extend([f"Theme match: {match}" for match in matches])

        # Technology focus (30%)
        if hasattr(query, 'technology_focus') and query.technology_focus:
            if hasattr(opportunity, 'technology_tags') and opportunity.technology_tags:
                tech_matches = set(query.technology_focus.lower().split(',')).intersection(set([tag.lower() for tag in opportunity.technology_tags]))
                if tech_matches:
                    score += min(len(tech_matches) * 15, 30)

        return min(score / max_possible, 1.0)

    def _calculate_company_fit_score(self, query: UserQuery, opportunity: FundingOpportunity) -> float:
        """Component 3: Company profile compatibility"""
        score = 0.0
        max_possible = 100.0

        # Employee count matching (40%)
        if query.employee_count is not None and opportunity.employee_min is not None and opportunity.employee_max is not None:
            optimal_mid = (opportunity.employee_min + opportunity.employee_max) / 2
            range_size = opportunity.employee_max - opportunity.employee_min
            if range_size > 0:
                # Calculate how close to optimal
                deviation = abs(query.employee_count - optimal_mid) / range_size
                fit_percentage = max(0, 1 - deviation / self.config.EMPLOYEE_COUNT_OPTIMAL_RANGE)
                score += fit_percentage * 40

        # Revenue matching (30%)
        if query.annual_revenue is not None and opportunity.revenue_min is not None and opportunity.revenue_max is not None:
            optimal_mid = (opportunity.revenue_min + opportunity.revenue_max) / 2
            range_size = opportunity.revenue_max - opportunity.revenue_min
            if range_size > 0:
                deviation = abs(query.annual_revenue - optimal_mid) / range_size
                fit_percentage = max(0, 1 - deviation / self.config.REVENUE_OPTIMAL_RANGE)
                score += fit_percentage * 30

        # Company stage matching (30%)
        if hasattr(query, 'company_stage') and query.company_stage:
            if hasattr(opportunity, 'target_stages') and opportunity.target_stages:
                if query.company_stage.lower() in [stage.lower() for stage in opportunity.target_stages]:
                    score += 30

        return min(score / max_possible, 1.0)

    def _calculate_financial_fit_score(self, query: UserQuery, opportunity: FundingOpportunity) -> float:
        """Component 4: Financial requirements matching"""
        score = 0.0
        max_possible = 100.0

        # Funding amount need vs offered (50%)
        if hasattr(query, 'funding_needed') and query.funding_needed is not None:
            if opportunity.funding_amount_min is not None and opportunity.funding_amount_max is not None:
                if opportunity.funding_amount_min <= query.funding_needed <= opportunity.funding_amount_max:
                    score += 50
                elif query.funding_needed < opportunity.funding_amount_min:
                    # Partial credit for being close
                    ratio = query.funding_needed / opportunity.funding_amount_min
                    score += max(0, ratio * 25)
                else:
                    # Too large - minimal credit
                    ratio = opportunity.funding_amount_max / query.funding_needed
                    score += max(0, ratio * 25)

        # Equity willingness (30%)
        if hasattr(query, 'equity_willingness') and query.equity_willingness is not None:
            if hasattr(opportunity, 'equity_required') and opportunity.equity_required is not None:
                if query.equity_willingness >= opportunity.equity_required:
                    score += 30
                else:
                    # Partial credit based on percentage
                    ratio = query.equity_willingness / opportunity.equity_required
                    score += max(0, ratio * 30)

        # Investment type preference (20%)
        if hasattr(query, 'investment_preference') and query.investment_preference:
            if hasattr(opportunity, 'investment_type') and opportunity.investment_type:
                if query.investment_preference.lower() == opportunity.investment_type.lower():
                    score += 20

        return min(score / max_possible, 1.0)

    def _calculate_timing_match_score(self, opportunity: FundingOpportunity) -> float:
        """Component 5: Timing and deadline proximity"""
        score = 0.0
        max_possible = 100.0
        current_date = datetime.now().date()

        # Application deadline proximity (60%)
        if hasattr(opportunity, 'application_deadline') and opportunity.application_deadline:
            try:
                deadline_date = datetime.strptime(opportunity.application_deadline, '%Y-%m-%d').date()
                days_until_deadline = (deadline_date - current_date).days
                if days_until_deadline >= 0:
                    # More points for closer deadlines (urgency)
                    proximity_score = max(0, 1 - (days_until_deadline / self.config.APPLICATION_DEADLINE_PROXIMITY))
                    score += proximity_score * 60
            except (ValueError, TypeError):
                pass

        # Funding cycle timing (40%)
        if hasattr(opportunity, 'funding_start_date') and opportunity.funding_start_date:
            try:
                start_date = datetime.strptime(opportunity.funding_start_date, '%Y-%m-%d').date()
                days_until_start = (start_date - current_date).days
                if days_until_start >= 0:
                    # More points for sooner availability
                    timing_score = max(0, 1 - (days_until_start / self.config.FUNDING_START_PROXIMITY))
                    score += timing_score * 40
            except (ValueError, TypeError):
                pass

        return min(score / max_possible, 1.0)

    def _calculate_geographic_match_score(self, query: UserQuery, opportunity: FundingOpportunity) -> float:
        """Component 6: Geographic compatibility"""
        score = 0.0
        max_possible = 100.0

        # Location match (70%)
        if query.location_state and opportunity.location_tags:
            query_location = query.location_state.lower()
            opportunity_locations = [tag.lower() for tag in opportunity.location_tags]
            if query_location in opportunity_locations:
                score += 70
            else:
                # Check for regional proximity (simple heuristic)
                # This could be enhanced with actual geographic data
                pass

        # Remote work compatibility (30%)
        if hasattr(opportunity, 'remote_eligible') and opportunity.remote_eligible:
            if hasattr(query, 'remote_preference') and query.remote_preference:
                if opportunity.remote_eligible and query.remote_preference:
                    score += 30
            else:
                # Assume remote is good if not specified
                score += 30

        return min(score / max_possible, 1.0)

    def _generate_justification(self, category_scores: Dict[str, float], positive_factors: List[str], negative_factors: List[str]) -> str:
        """Generate comprehensive justification for the score"""
        parts = []
        for category, score in category_scores.items():
            if score > 0:
                percentage = score * 100
                parts.append(f"{category}: {percentage:.1f}%")
        justification = "Score breakdown: " + ", ".join(parts)
        if positive_factors:
            justification += " | Positive factors: " + ", ".join(positive_factors[:3])
        if negative_factors:
            justification += " | Considerations: " + ", ".join(negative_factors[:2])
        return justification if parts else "No strong matches found based on current criteria"

