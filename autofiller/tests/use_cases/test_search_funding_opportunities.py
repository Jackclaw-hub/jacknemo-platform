import unittest
from datetime import datetime
from unittest.mock import Mock, MagicMock
from src.entities.user_query import UserQuery
from src.entities.funding_opportunity import FundingOpportunity
from src.entities.scorecard import Scorecard
from src.frameworks.gateways.ifunding_source_gateway import IFundingSourceGateway
from src.use_cases.keyword_match_score_calculator import KeywordMatchScoreCalculator
from src.use_cases.search_funding_opportunities import SearchFundingOpportunitiesUseCase

class TestSearchFundingOpportunitiesUseCase(unittest.TestCase):
    def setUp(self):
        self.mock_gateway = Mock(spec=IFundingSourceGateway)
        self.scorer = KeywordMatchScoreCalculator()
        self.use_case = SearchFundingOpportunitiesUseCase([self.mock_gateway], self.scorer)
        
        self.sample_opp = FundingOpportunity(
            title="Test Opportunity",
            description="A test description for matching.",
            funder="Test Funder",
            amount="1000 EUR",
            deadline="2026-12-31",
            eligibility="Anyone",
            link="http://example.com",
            source="Test Source",
            raw_data={},
            industry_tags=["Test"],
            employee_min=1,
            employee_max=100,
            revenue_min=0,
            revenue_max=1000000,
            location_tags=["Test"],
            themes=["Test"],
            target_audience="Anyone"
        )
        
        self.sample_scorecard = Scorecard(
            opportunity=self.sample_opp,
            total_score=80.0,
            justification="Good match",
            category_scores={"text": 80.0},
            positive_factors=[],
            negative_factors=[]
        )

    def test_execute_returns_sorted_scorecards(self):
        # Gateway returns two opportunities
        opp1 = FundingOpportunity(
            title="High Score Opp",
            description="This matches the query well.",
            funder="Funder1",
            amount="1000 EUR",
            deadline="2026-12-31",
            eligibility="Anyone",
            link="http://example.com/1",
            source="Source1",
            raw_data={}
        )
        opp2 = FundingOpportunity(
            title="Low Score Opp",
            description="This does not match much.",
            funder="Funder2",
            amount="1000 EUR",
            deadline="2026-12-31",
            eligibility="Anyone",
            link="http://example.com/2",
            source="Source2",
            raw_data={}
        )
        
        self.mock_gateway.fetch_opportunities.return_value = [opp1, opp2]
        
        # Mock scorer to return predefined scores
        original_calc = self.scorer.calculate_score
        def mock_calc(opp, query):
            if opp.title == "High Score Opp":
                return Scorecard(
                    opportunity=opp,
                    total_score=90.0,
                    justification="High",
                    category_scores={},
                    positive_factors=[],
                    negative_factors=[]
                )
            else:
                return Scorecard(
                    opportunity=opp,
                    total_score=20.0,
                    justification="Low",
                    category_scores={},
                    positive_factors=[],
                    negative_factors=[]
                )
        self.scorer.calculate_score = mock_calc
        
        try:
            query = UserQuery(text="test query", timestamp=datetime.now())
            results = self.use_case.execute(query)
            
            # Should have 2 results
            self.assertEqual(len(results), 2)
            # Should be sorted descending by score
            self.assertGreaterEqual(results[0].total_score, results[1].total_score)
            self.assertEqual(results[0].total_score, 90.0)
            self.assertEqual(results[1].total_score, 20.0)
        finally:
            self.scorer.calculate_score = original_calc

    def test_execute_handles_empty_result(self):
        self.mock_gateway.fetch_opportunities.return_value = []
        query = UserQuery(text="test", timestamp=datetime.now())
        results = self.use_case.execute(query)
        self.assertEqual(len(results), 0)

    def test_execute_handles_gateway_exception(self):
        self.mock_gateway.fetch_opportunities.side_effect = Exception("Network error")
        query = UserQuery(text="test", timestamp=datetime.now())
        # Should not crash, should return empty list (as per current implementation)
        results = self.use_case.execute(query)
        self.assertEqual(len(results), 0)

if __name__ == '__main__':
    unittest.main()