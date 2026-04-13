#!/usr/bin/env python3
"""
Demo script for the Autofiller MVP.
Shows how to use the core components to search for funding opportunities.
"""
import sys
from pathlib import Path
# Add the workspace root to sys.path so that `src` can be imported
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from datetime import datetime
from src.entities.user_query import UserQuery
from src.frameworks.gateways.mock_funding_source import MockFundingSourceGateway
from src.use_cases.keyword_match_score_calculator import KeywordMatchScoreCalculator
from src.use_cases.search_funding_opportunities import SearchFundingOpportunitiesUseCase
from src.interface_adapters.presenters.scorecard_presenter import ScorecardPresenter

def main():
    print("=== Autofiller MVP Demo ===\n")
    
    # 1. Create a user query (could come from input/form)
    query = UserQuery(
        text="KI für kleine Unternehmen in NRW",
        timestamp=datetime.now(),
        employee_count=15,
        annual_revenue=750000,
        industry="IT",
        location_state="NRW"
    )
    print(f"User query: {query.text}")
    print(f"Company: {query.employee_count} employees, {query.annual_revenue}€ revenue, {query.industry} industry, {query.location_state} location\n")
    
    # 2. Set up components
    gateway = MockFundingSourceGateway()
    scorer = KeywordMatchScoreCalculator()
    use_case = SearchFundingOpportunitiesUseCase([gateway], scorer)
    presenter = ScorecardPresenter()
    
    # 3. Execute search
    print("Searching for funding opportunities...")
    results = use_case.execute(query)
    
    # 4. Present results
    output = presenter.present(results)
    print("\n" + output + "\n")
    
    print("Demo complete.")

if __name__ == "__main__":
    main()