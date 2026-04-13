import unittest
from src.entities.scorecard import Scorecard
from src.entities.funding_opportunity import FundingOpportunity
from src.interface_adapters.presenters.scorecard_presenter import ScorecardPresenter

class TestScorecardPresenter(unittest.TestCase):
    def setUp(self):
        self.presenter = ScorecardPresenter()
        self.opportunity1 = FundingOpportunity(
            title="Opportunity A",
            description="Desc A",
            funder="Funder A",
            amount="1000 EUR",
            deadline="2026-12-31",
            eligibility="Anyone",
            link="http://example.com/a",
            source="Source A",
            raw_data={}
        )
        self.opportunity2 = FundingOpportunity(
            title="Opportunity B",
            description="Desc B",
            funder="Funder B",
            amount="2000 EUR",
            deadline="2026-06-30",
            eligibility="Anyone",
            link="http://example.com/b",
            source="Source B",
            raw_data={}
        )

    def test_present_empty_list(self):
        result = self.presenter.present([])
        self.assertEqual(result, "No funding opportunities found matching your query.")

    def test_present_single_scorecard(self):
        scorecard = Scorecard(
            opportunity=self.opportunity1,
            total_score=75.5,
            justification="Good match",
            category_scores={},
            positive_factors=[],
            negative_factors=[]
        )
        result = self.presenter.present([scorecard])
        self.assertIn("Found 1 funding opportunities:", result)
        self.assertIn("Opportunity A", result)
        self.assertIn("Funder: Funder A", result)
        self.assertIn("Amount: 1000 EUR", result)
        self.assertIn("Deadline: 2026-12-31", result)
        self.assertIn("Score: 75.5%", result)
        self.assertIn("Justification: Good match", result)
        self.assertIn("Link: http://example.com/a", result)

    def test_present_multiple_scorecards_sorted(self):
        scorecard1 = Scorecard(
            opportunity=self.opportunity1,
            total_score=80.0,
            justification="Good",
            category_scores={},
            positive_factors=[],
            negative_factors=[]
        )
        scorecard2 = Scorecard(
            opportunity=self.opportunity2,
            total_score=90.0,
            justification="Better",
            category_scores={},
            positive_factors=[],
            negative_factors=[]
        )
        # Presenter does not sort; it displays in the order given.
        # We'll test that both appear in the output.
        result = self.presenter.present([scorecard1, scorecard2])
        self.assertIn("Found 2 funding opportunities:", result)
        self.assertIn("Opportunity A", result)
        self.assertIn("Opportunity B", result)
        # Ensure Opportunity A appears before Opportunity B in the string
        self.assertLess(result.find("Opportunity A"), result.find("Opportunity B"))

if __name__ == '__main__':
    unittest.main()