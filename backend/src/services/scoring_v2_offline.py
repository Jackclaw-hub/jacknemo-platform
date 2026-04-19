#!/usr/bin/env python3
"""
Offline ScoringV2Service - Works without database dependency
Provides the same scoring functionality but uses mock data instead of database
"""

import re
import math
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import the main scoring service
from scoring_v2 import ScoringV2Service, ScoringConfig

class OfflineScoringService:
    """Offline scoring service that provides mock data instead of database queries"""
    
    def __init__(self):
        self.scoring_service = ScoringV2Service()
        
    def get_mock_funding_opportunities(self) -> List[Dict]:
        """Return mock funding opportunities for offline testing"""
        return [
            {
                'id': 1,
                'title': 'AI Startup Innovation Grant',
                'description': 'Funding for AI startups focusing on machine learning and deep learning applications',
                'funder': 'Tech Innovation Fund',
                'amount': '€50,000 - €500,000',
                'deadline': '2024-12-31',
                'eligibility': 'AI startups with 5-50 employees',
                'link': 'https://example.com/ai-grant',
                'industry_tags': ['AI', 'Technology', 'Machine Learning'],
                'employee_min': 5,
                'employee_max': 50,
                'revenue_min': 100000,
                'revenue_max': 5000000,
                'location_tags': ['California', 'Remote', 'Bay Area'],
                'themes': ['innovation', 'machine learning', 'deep learning'],
                'target_audience': 'Early-stage AI startups'
            },
            {
                'id': 2,
                'title': 'California Clean Tech Fund',
                'description': 'Investment in clean technology and sustainable energy startups',
                'funder': 'Green Ventures Capital',
                'amount': '€100,000 - €1,000,000',
                'deadline': '2024-10-15',
                'eligibility': 'Clean tech companies with proven technology',
                'link': 'https://example.com/cleantech-fund',
                'industry_tags': ['Clean Tech', 'Sustainability', 'Energy'],
                'employee_min': 10,
                'employee_max': 100,
                'revenue_min': 500000,
                'revenue_max': 10000000,
                'location_tags': ['California', 'West Coast'],
                'themes': ['sustainability', 'renewable energy', 'climate tech'],
                'target_audience': 'Growth-stage clean tech companies'
            },
            {
                'id': 3,
                'title': 'Remote-First SaaS Accelerator',
                'description': 'Accelerator program for SaaS companies with remote teams',
                'funder': 'Digital Future Fund',
                'amount': '€25,000 - €250,000',
                'deadline': '2024-09-30',
                'eligibility': 'SaaS startups with remote teams',
                'link': 'https://example.com/saas-accelerator',
                'industry_tags': ['SaaS', 'Software', 'Remote Work'],
                'employee_min': 3,
                'employee_max': 25,
                'revenue_min': 50000,
                'revenue_max': 1000000,
                'location_tags': ['Remote', 'Global'],
                'themes': ['saas', 'remote work', 'cloud computing'],
                'target_audience': 'Early-stage SaaS companies'
            }
        ]
    
    def score_opportunities(self, user_query: Dict, opportunities: List[Dict]) -> List[Dict]:
        """Score opportunities against user query (same interface as database version)"""
        scored_opportunities = []
        
        for opportunity in opportunities:
            try:
                # Convert to proper objects for scoring
                from entities.funding_opportunity import FundingOpportunity
                from entities.user_query import UserQuery
                
                # Create FundingOpportunity object
                fund_opp = FundingOpportunity(
                    title=opportunity['title'],
                    description=opportunity['description'],
                    funder=opportunity['funder'],
                    amount=opportunity['amount'],
                    deadline=opportunity['deadline'],
                    eligibility=opportunity['eligibility'],
                    link=opportunity['link'],
                    source="mock",
                    raw_data={},
                    industry_tags=opportunity.get('industry_tags', []),
                    employee_min=opportunity.get('employee_min'),
                    employee_max=opportunity.get('employee_max'),
                    revenue_min=opportunity.get('revenue_min'),
                    revenue_max=opportunity.get('revenue_max'),
                    location_tags=opportunity.get('location_tags', []),
                    themes=opportunity.get('themes', []),
                    target_audience=opportunity.get('target_audience')
                )
                
                # Create UserQuery object
                user_query_obj = UserQuery(
                    text=user_query.get('text', ''),
                    timestamp=user_query.get('timestamp', '2024-01-01T00:00:00'),
                    industry=user_query.get('industry'),
                    location_state=user_query.get('location_state'),
                    employee_count=user_query.get('employee_count'),
                    annual_revenue=user_query.get('annual_revenue'),
                    funding_needed=user_query.get('funding_needed'),
                    equity_willingness=user_query.get('equity_willingness'),
                    investment_preference=user_query.get('investment_preference'),
                    company_stage=user_query.get('company_stage'),
                    remote_preference=user_query.get('remote_preference')
                )
                
                # Calculate score
                scorecard = self.scoring_service.calculate_score(fund_opp, user_query_obj)
                
                scored_opportunities.append({
                    **opportunity,
                    'score': scorecard.total_score,
                    'justification': scorecard.justification,
                    'category_scores': scorecard.category_scores,
                    'positive_factors': scorecard.positive_factors,
                    'negative_factors': scorecard.negative_factors
                })
                
            except Exception as e:
                print(f"Error scoring opportunity {opportunity.get('id')}: {e}")
                # Add opportunity with zero score
                scored_opportunities.append({
                    **opportunity,
                    'score': 0,
                    'justification': f"Scoring error: {str(e)}",
                    'category_scores': {},
                    'positive_factors': [],
                    'negative_factors': []
                })
        
        # Sort by score descending
        return sorted(scored_opportunities, key=lambda x: x['score'], reverse=True)
    
    def get_top_matches(self, user_query: Dict, limit: int = 5) -> List[Dict]:
        """Get top matching funding opportunities using mock data"""
        opportunities = self.get_mock_funding_opportunities()
        scored = self.score_opportunities(user_query, opportunities)
        return scored[:limit]

def test_offline_scoring():
    """Test the offline scoring service"""
    print("Testing Offline Scoring Service...\n")
    
    try:
        service = OfflineScoringService()
        
        # Mock user query
        user_query = {
            'text': "AI startup funding for machine learning",
            'industry': "AI", 
            'location_state': "California",
            'employee_count': 25,
            'annual_revenue': 1000000,
            'funding_needed': 300000,
            'equity_willingness': 7.0,
            'investment_preference': "Grant",
            'company_stage': "Early-stage",
            'remote_preference': True
        }
        
        print("User Query:", user_query)
        print("\n" + "="*50 + "\n")
        
        # Get top matches
        top_matches = service.get_top_matches(user_query, 3)
        
        print("TOP MATCHES:")
        print("="*50)
        
        for i, match in enumerate(top_matches):
            print(f"\n{i+1}. {match['title']}")
            print(f"   Score: {match['score']:.1f}/100")
            print(f"   Funder: {match['funder']}")
            print(f"   Amount: {match['amount']}")
            print(f"   Deadline: {match['deadline']}")
            print(f"   Justification: {match['justification']}")
            if match.get('positive_factors'):
                print(f"   Positive factors: {', '.join(match['positive_factors'][:3])}")
            print("-"*50)
        
        print("\n✅ Offline scoring service test completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_offline_scoring()
    exit(0 if success else 1)