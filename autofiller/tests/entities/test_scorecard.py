import unittest
from src.entities.scorecard import Scorecard
from src.entities.funding_opportunity import FundingOpportunity

class TestScorecard(unittest.TestCase):
    def setUp(self):
        self.opportunity = FundingOpportunity(
            title="Test Opp",
            description="Test desc",
            funder="Test Funder",
            amount="1000 EUR",
            deadline="2026-12-31",
            eligibility="Anyone",
            link="http://example.com",
            source="Test Source",
            raw_data={}
        )

    def test_creation(self):
        scorecard = Scorecard(
            opportunity=self.opportunity,
            total_score=85.5,
            justification="Good match",
            category_scores={"text": 80.0, "theme": 90.0},
            positive_factors=["Industry match", "Location match"],
            negative_factors=["Revenue slightly below minimum"]
        )
        self.assertEqual(scorecard.opportunity, self.opportunity)
        self.assertEqual(scorecard.total_score, 85.5)
        self.assertEqual(scorecard.justification, "Good match")
        self.assertEqual(scorecard.category_scores, {"text": 80.0, "theme": 90.0})
        self.assertEqual(scorecard.positive_factors, ["Industry match", "Location match"])
        self.assertEqual(scorecard.negative_factors, ["Revenue slightly below minimum"])

    def test_defaults(self):
        scorecard = Scorecard(opportunity=self.opportunity, total_score=50.0, justification="Ok")
        self.assertEqual(scorecard.opportunity, self.opportunity)
        self.assertEqual(scorecard.total_score, 50.0)
        self.assertEqual(scorecard.justification, "Ok")
        self.assertEqual(scorecard.category_scores, {})
        self.assertEqual(scorecard.positive_factors, [])
        self.assertEqual(scorecard.negative_factors, [])

if __name__ == '__main__':
    unittest.main()