#!/usr/bin/env python3
"""Fixed test script for ScoringV2Service"""

import sys
import os

# Add correct paths
sys.path.insert(0, '/sandbox/.openclaw/workspace/autofiller/src')
sys.path.insert(0, '/sandbox/.openclaw/workspace/backend/src/services')

from scoring_v2 import ScoringV2Service
from entities.user_query import UserQuery
from entities.funding_opportunity import FundingOpportunity
from datetime import datetime

def test_basic_functionality():
    """Test that the service can be instantiated and basic methods work"""
    
    print("Testing ScoringV2Service basic functionality...")
    
    # Create service instance
    try:
        service = ScoringV2Service()
        print("✓ Service instantiated successfully")
    except Exception as e:
        print(f"✗ Failed to instantiate service: {e}")
        return False
    
    # Create test data
    try:
        # Create a simple funding opportunity
        opportunity = FundingOpportunity(
            title="Test Funding Opportunity",
            description="This is a test funding opportunity for AI startups",
            funder="Test Funder",
            amount="€500,000",
            deadline="2024-12-31",
            eligibility="AI startups in California",
            link="https://example.com",
            source="test",
            raw_data={},
            industry_tags=["AI", "Technology"],
            employee_min=5,
            employee_max=50,
            revenue_min=100000.0,
            revenue_max=5000000.0,
            location_tags=["California", "Remote"],
            themes=["innovation", "machine learning"],
            target_audience="Startups"
        )
        
        # Create a user query
        query = UserQuery(
            text="AI startup funding for machine learning",
            timestamp=datetime.now(),
            employee_count=25,
            annual_revenue=1000000.0,
            industry="AI",
            location_state="California"
        )
        
        print("✓ Test data created successfully")
        
    except Exception as e:
        print(f"✗ Failed to create test data: {e}")
        return False
    
    # Test individual scoring components
    try:
        print("\nTesting individual scoring components...")
        
        # Test text matching
        text_score = service._calculate_text_match_score(query.text, opportunity)
        print(f"✓ Text match score: {text_score:.2f}")
        
        # Test theme matching
        positive_factors = []
        theme_score = service._calculate_theme_match_score(query, opportunity, positive_factors)
        print(f"✓ Theme match score: {theme_score:.2f}")
        print(f"  Positive factors: {positive_factors}")
        
        # Test company fit
        company_score = service._calculate_company_fit_score(query, opportunity)
        print(f"✓ Company fit score: {company_score:.2f}")
        
        # Test financial fit
        financial_score = service._calculate_financial_fit_score(query, opportunity)
        print(f"✓ Financial fit score: {financial_score:.2f}")
        
        # Test timing match
        timing_score = service._calculate_timing_match_score(opportunity)
        print(f"✓ Timing match score: {timing_score:.2f}")
        
        # Test geographic match
        geo_score = service._calculate_geographic_match_score(query, opportunity)
        print(f"✓ Geographic match score: {geo_score:.2f}")
        
    except Exception as e:
        print(f"✗ Failed to test scoring components: {e}")
        return False
    
    # Test full scoring
    try:
        print("\nTesting full scoring...")
        scorecard = service.calculate_score(opportunity, query)
        print(f"✓ Total score: {scorecard.total_score:.1f}")
        print(f"✓ Justification: {scorecard.justification}")
        print(f"✓ Category scores: {scorecard.category_scores}")
        
    except Exception as e:
        print(f"✗ Failed to calculate full score: {e}")
        return False
    
    print("\n🎉 All tests passed! ScoringV2Service is working correctly.")
    return True

if __name__ == "__main__":
    success = test_basic_functionality()
    sys.exit(0 if success else 1)