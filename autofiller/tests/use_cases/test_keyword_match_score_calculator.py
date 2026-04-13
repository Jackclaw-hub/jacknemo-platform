import unittest
from datetime import datetime
from src.entities.user_query import UserQuery
from src.entities.funding_opportunity import FundingOpportunity
from src.use_cases.keyword_match_score_calculator import KeywordMatchScoreCalculator

class TestKeywordMatchScoreCalculator(unittest.TestCase):
    def setUp(self):
        self.calculator = KeywordMatchScoreCalculator()
        self.opportunity = FundingOpportunity(
            title="KI-Förderung für KMU in NRW",
            description="Förderung von Projekten zur Anwendung von Künstlicher Intelligenz in kleinen und mittleren Unternehmen in Nordrhein-Westfalen.",
            funder="Land NRW",
            amount="Bis zu 500.000 EUR",
            deadline="2026-12-31",
            eligibility="KMU mit Sitz in NRW, die ein KI-Projekt durchführen möchten.",
            link="https://foerderportal.nrw.de/ki-kmu",
            source="NRW Förderportal",
            raw_data={},
            industry_tags=["IT", "Künstliche Intelligenz"],
            employee_min=1,
            employee_max=250,
            revenue_min=0,
            revenue_max=50000000,
            location_tags=["NRW"],
            themes=["Digitalisierung", "Innovation", "KI"],
            target_audience="KMU"
        )

    def test_exact_text_match(self):
        query = UserQuery(
            text="KI für kleine Unternehmen in NRW",
            timestamp=datetime.now(),
            employee_count=50,
            annual_revenue=1000000,
            industry="IT",
            location_state="NRW"
        )
        scorecard = self.calculator.calculate_score(self.opportunity, query)
        # Should have high score due to text match, theme match, and company match
        self.assertGreaterEqual(scorecard.total_score, 69.0)
        self.assertIn("text_match", scorecard.category_scores)
        self.assertIn("theme_match", scorecard.category_scores)
        self.assertIn("company_match", scorecard.category_scores)

    def test_partial_text_match(self):
        query = UserQuery(
            text="KI Förderung",
            timestamp=datetime.now(),
            employee_count=50,
            annual_revenue=1000000,
            industry="IT",
            location_state="NRW"
        )
        scorecard = self.calculator.calculate_score(self.opportunity, query)
        self.assertGreater(scorecard.total_score, 40)  # Should still have decent score

    def test_no_match(self):
        query = UserQuery(
            text="Landwirtschaft Förderung",
            timestamp=datetime.now(),
            employee_count=50,
            annual_revenue=1000000,
            industry="Landwirtschaft",
            location_state="Bayern"
        )
        scorecard = self.calculator.calculate_score(self.opportunity, query)
        self.assertLess(scorecard.total_score, 40)  # Low score expected

    def test_company_data_match(self):
        query = UserQuery(
            text="Etwas völlig anderes",
            timestamp=datetime.now(),
            employee_count=50,  # Within 1-250
            annual_revenue=1000000,  # Within 0-50M
            industry="IT",  # Matches industry_tags
            location_state="NRW"  # Matches location_tags
        )
        scorecard = self.calculator.calculate_score(self.opportunity, query)
        # Should get points for company match even if text doesn't match well
        self.assertGreater(scorecard.category_scores["company_match"], 50)

    def test_empty_query(self):
        query = UserQuery(
            text="",
            timestamp=datetime.now()
        )
        scorecard = self.calculator.calculate_score(self.opportunity, query)
        self.assertEqual(scorecard.total_score, 0.0)

if __name__ == '__main__':
    unittest.main()