#!/usr/bin/env python3
"""
Quick validation test for the Autofiller system.
Tests core functionality without external dependencies.
"""
import sys
from pathlib import Path
from datetime import datetime

# Add workspace root to path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

def test_autofiller_integration():
    """Test the complete autofiller pipeline"""
    print("🧪 Testing Autofiller Integration...")
    
    try:
        # Import all components
        from src.entities.user_query import UserQuery
        from src.frameworks.gateways.mock_funding_source import MockFundingSourceGateway
        from src.use_cases.keyword_match_score_calculator import KeywordMatchScoreCalculator
        from src.use_cases.search_funding_opportunities import SearchFundingOpportunitiesUseCase
        from src.interface_adapters.presenters.scorecard_presenter import ScorecardPresenter
        
        print("✅ All imports successful")
        
        # Create test query
        query = UserQuery(
            text="Digitalisierung für Handwerksbetrieb",
            timestamp=datetime.now(),
            employee_count=8,
            annual_revenue=300000,
            industry="Handwerk",
            location_state="BY"  # Bayern
        )
        print("✅ UserQuery creation successful")
        
        # Setup components
        gateway = MockFundingSourceGateway()
        scorer = KeywordMatchScoreCalculator()
        use_case = SearchFundingOpportunitiesUseCase([gateway], scorer)
        presenter = ScorecardPresenter()
        print("✅ Component initialization successful")
        
        # Execute search
        results = use_case.execute(query)
        print(f"✅ Search executed, found {len(results)} opportunities")
        
        # Present results
        output = presenter.present(results)
        print("✅ Results presentation successful")
        
        # Basic validation
        assert len(results) > 0, "Should find at least one opportunity"
        assert "Score:" in output, "Output should contain scoring information"
        assert "Funder:" in output, "Output should contain funder information"
        
        print("🎉 All tests passed!")
        print(f"\n📊 Sample output preview:")
        print("-" * 50)
        print(output[:500] + "..." if len(output) > 500 else output)
        print("-" * 50)
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_autofiller_integration()
    sys.exit(0 if success else 1)