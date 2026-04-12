import unittest
from src.entities.funding_opportunity import FundingOpportunity

class TestFundingOpportunity(unittest.TestCase):
    def test_creation_with_all_fields(self):
        opp = FundingOpportunity(
            title="Test Opportunity",
            description="A test description.",
            funder="Test Funder",
            amount="10000 EUR",
            deadline="2026-12-31",
            eligibility="Anyone",
            link="http://example.com",
            source="Test Source",
            raw_data={"key": "value"},
            industry_tags=["IT", "AI"],
            employee_min=1,
            employee_max=50,
            revenue_min=0,
            revenue_max=1000000,
            location_tags=["NRW", "Bundesweit"],
            themes=["Innovation", "Digitalisierung"],
            target_audience="Startups"
        )
        self.assertEqual(opp.title, "Test Opportunity")
        self.assertEqual(opp.description, "A test description.")
        self.assertEqual(opp.funder, "Test Funder")
        self.assertEqual(opp.amount, "10000 EUR")
        self.assertEqual(opp.deadline, "2026-12-31")
        self.assertEqual(opp.eligibility, "Anyone")
        self.assertEqual(opp.link, "http://example.com")
        self.assertEqual(opp.source, "Test Source")
        self.assertEqual(opp.raw_data, {"key": "value"})
        self.assertEqual(opp.industry_tags, ["IT", "AI"])
        self.assertEqual(opp.employee_min, 1)
        self.assertEqual(opp.employee_max, 50)
        self.assertEqual(opp.revenue_min, 0)
        self.assertEqual(opp.revenue_max, 1000000)
        self.assertEqual(opp.location_tags, ["NRW", "Bundesweit"])
        self.assertEqual(opp.themes, ["Innovation", "Digitalisierung"])
        self.assertEqual(opp.target_audience, "Startups")

    def test_defaults_for_lists(self):
        opp = FundingOpportunity(
            title="Test",
            description="Test",
            funder="Test",
            amount="Test",
            deadline="Test",
            eligibility="Test",
            link="Test",
            source="Test",
            raw_data={}
        )
        self.assertEqual(opp.industry_tags, [])
        self.assertEqual(opp.location_tags, [])
        self.assertEqual(opp.themes, [])

if __name__ == '__main__':
    unittest.main()