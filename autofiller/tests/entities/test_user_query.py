import unittest
from datetime import datetime
from src.entities.user_query import UserQuery

class TestUserQuery(unittest.TestCase):
    def test_creation_with_all_fields(self):
        query = UserQuery(
            text="Test query",
            timestamp=datetime(2026, 4, 5, 12, 0, 0),
            user_id="user123",
            employee_count=10,
            annual_revenue=500000.0,
            industry="IT",
            location_state="NRW",
            survey_responses={"q1": "yes"}
        )
        self.assertEqual(query.text, "Test query")
        self.assertEqual(query.timestamp, datetime(2026, 4, 5, 12, 0, 0))
        self.assertEqual(query.user_id, "user123")
        self.assertEqual(query.employee_count, 10)
        self.assertEqual(query.annual_revenue, 500000.0)
        self.assertEqual(query.industry, "IT")
        self.assertEqual(query.location_state, "NRW")
        self.assertEqual(query.survey_responses, {"q1": "yes"})

    def test_defaults(self):
        query = UserQuery(text="Test", timestamp=datetime.now())
        self.assertIsNone(query.user_id)
        self.assertIsNone(query.employee_count)
        self.assertIsNone(query.annual_revenue)
        self.assertIsNone(query.industry)
        self.assertIsNone(query.location_state)
        self.assertEqual(query.survey_responses, {})

if __name__ == '__main__':
    unittest.main()