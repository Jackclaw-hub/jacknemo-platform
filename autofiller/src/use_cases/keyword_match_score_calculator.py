import re
from typing import List, Dict, Any

from ..entities.user_query import UserQuery
from ..entities.funding_opportunity import FundingOpportunity
from ..entities.scorecard import Scorecard
from .score_calculator import IScoreCalculator

class KeywordMatchScoreCalculator(IScoreCalculator):
    """
    Simple scoring based on keyword matches in description, themes, industry tags.
    Also gives bonus for matching company data (employee count, revenue, industry, location).
    """
    
    def calculate_score(self, opportunity: FundingOpportunity, query: UserQuery) -> Scorecard:
        score = 0.0
        max_score = 100.0
        positive_factors: List[str] = []
        negative_factors: List[str] = []
        category_scores: Dict[str, float] = {}
        
        # Text matching: user query text vs opportunity description and title
        text_score = self._calculate_text_match_score(query.text, opportunity)
        category_scores["text_match"] = text_score
        score += text_score * 0.4  # 40% weight
        
        # Theme/industry tag matching
        theme_score = self._calculate_theme_match_score(query, opportunity)
        category_scores["theme_match"] = theme_score
        score += theme_score * 0.3  # 30% weight
        
        # Company data matching
        company_score = self._calculate_company_match_score(query, opportunity)
        category_scores["company_match"] = company_score
        score += company_score * 0.2  # 20% weight
        
        # Survey responses (if any) - placeholder for future
        survey_score = self._calculate_survey_match_score(query, opportunity)
        category_scores["survey_match"] = survey_score
        score += survey_score * 0.1  # 10% weight
        
        # Normalize score to 0-100
        total_score = min(max(score, 0.0), max_score)
        
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
        if not query_text or not opportunity.description:
            return 0.0
        query_words = set(re.findall(r'\w+', query_text.lower()))
        desc_words = set(re.findall(r'\w+', opportunity.description.lower()))
        title_words = set(re.findall(r'\w+', opportunity.title.lower()))
        # Combine description and title words
        target_words = desc_words.union(title_words)
        if not target_words:
            return 0.0
        matches = query_words.intersection(target_words)
        return len(matches) / max(len(query_words), 1) * 100  # percentage of query words found
    
    def _calculate_theme_match_score(self, query: UserQuery, opportunity: FundingOpportunity) -> float:
        score = 0.0
        # Check industry
        if query.industry and opportunity.industry_tags:
            if query.industry.lower() in [tag.lower() for tag in opportunity.industry_tags]:
                score += 30
        # Check location
        if query.location_state and opportunity.location_tags:
            if query.location_state.lower() in [tag.lower() for tag in opportunity.location_tags]:
                score += 20
        # Check themes (from survey or text) - simple: if any query text word appears in themes
        if query.text and opportunity.themes:
            query_words = set(re.findall(r'\w+', query.text.lower()))
            theme_words = set([theme.lower() for theme in opportunity.themes])
            matches = query_words.intersection(theme_words)
            if matches:
                score += min(len(matches) * 10, 30)  # up to 30 for theme matches
        return min(score, 100)
    
    def _calculate_company_match_score(self, query: UserQuery, opportunity: FundingOpportunity) -> float:
        score = 0.0
        # Employee count
        if query.employee_count is not None:
            if opportunity.employee_min is not None and opportunity.employee_max is not None:
                if opportunity.employee_min <= query.employee_count <= opportunity.employee_max:
                    score += 40
                else:
                    # penalize if outside range? maybe not negative, just no bonus
                    pass
        # Revenue
        if query.annual_revenue is not None:
            if opportunity.revenue_min is not None and opportunity.revenue_max is not None:
                if opportunity.revenue_min <= query.annual_revenue <= opportunity.revenue_max:
                    score += 30
        # Industry match (already covered in theme match but give extra)
        if query.industry and opportunity.industry_tags:
            if query.industry.lower() in [tag.lower() for tag in opportunity.industry_tags]:
                score += 20
        return min(score, 100)
    
    def _calculate_survey_match_score(self, query: UserQuery, opportunity: FundingOpportunity) -> float:
        # Placeholder: if survey responses exist, match against opportunity properties
        # For now, return 0
        return 0.0
    
    def _generate_justification(self, category_scores: Dict[str, float], positive: List[str], negative: List[str]) -> str:
        parts = []
        for cat, score in category_scores.items():
            if score > 0:
                parts.append(f"{cat}: {score:.0f}%")
        if not parts:
            return "No strong matches found."
        return "Score based on: " + ", ".join(parts)


# Alternative simple implementation for quick testing
class SimpleScoreCalculator(IScoreCalculator):
    def calculate_score(self, opportunity: FundingOpportunity, query: UserQuery) -> Scorecard:
        # Very naive: just check if any query word appears in title or description
        if not query.text:
            score = 0.0
        else:
            query_lower = query.text.lower()
            title_lower = opportunity.title.lower()
            desc_lower = opportunity.description.lower()
            if query_lower in title_lower or query_lower in desc_lower:
                score = 80.0
            else:
                score = 20.0
        return Scorecard(
            opportunity=opportunity,
            total_score=score,
            justification="Simple substring match.",
            category_scores={"simple_match": score},
            positive_factors=[],
            negative_factors=[]
        )