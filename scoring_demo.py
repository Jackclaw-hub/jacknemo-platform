#!/usr/bin/env python3
"""
Scoring Demo - Python version
Calls the ScoringV2Service for comprehensive scoring
"""

import json
import sys
import os

# Add paths
sys.path.insert(0, '/sandbox/.openclaw/workspace/autofiller/src')
sys.path.insert(0, '/sandbox/.openclaw/workspace/backend/src/services')

from scoring_v2 import ScoringV2Service
from entities.user_query import UserQuery
from entities.funding_opportunity import FundingOpportunity
from datetime import datetime

def main():
    # Parse input data
    input_data = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
    
    user_query_data = input_data.get('user_query', {
        'text': "AI startup funding",
        'industry': "AI", 
        'employee_count': 25,
        'annual_revenue': 1000000.0,
        'location_state': "California"
    })
    
    opportunities_data = input_data.get('opportunities', [])
    
    # Create UserQuery object
    user_query = UserQuery(
        text=user_query_data.get('text', ''),
        timestamp=datetime.now(),
        employee_count=user_query_data.get('employee_count'),
        annual_revenue=user_query_data.get('annual_revenue'),
        industry=user_query_data.get('industry'),
        location_state=user_query_data.get('location_state')
    )
    
    # Create ScoringV2Service
    scoring_service = ScoringV2Service()
    
    results = []
    
    # Score each opportunity
    for opp_data in opportunities_data:
        try:
            # Create FundingOpportunity object
            opportunity = FundingOpportunity(
                title=opp_data.get('title', ''),
                description=opp_data.get('description', ''),
                funder=opp_data.get('funder', ''),
                amount=opp_data.get('amount'),
                deadline=opp_data.get('deadline'),
                eligibility=opp_data.get('eligibility', ''),
                link=opp_data.get('link', ''),
                source=opp_data.get('source', 'demo'),
                raw_data=opp_data.get('raw_data', {}),
                industry_tags=opp_data.get('industry_tags', []),
                employee_min=opp_data.get('employee_min'),
                employee_max=opp_data.get('employee_max'),
                revenue_min=opp_data.get('revenue_min'),
                revenue_max=opp_data.get('revenue_max'),
                location_tags=opp_data.get('location_tags', []),
                themes=opp_data.get('themes', []),
                target_audience=opp_data.get('target_audience')
            )
            
            # Calculate score
            scorecard = scoring_service.calculate_score(opportunity, user_query)
            
            results.append({
                'id': opp_data.get('id'),
                'title': opportunity.title,
                'score': scorecard.total_score,
                'justification': scorecard.justification,
                'category_scores': scorecard.category_scores,
                'positive_factors': scorecard.positive_factors,
                'negative_factors': scorecard.negative_factors
            })
            
        except Exception as e:
            print(f"Error scoring opportunity {opp_data.get('id')}: {e}", file=sys.stderr)
            continue
    
    # Sort by score descending
    results.sort(key=lambda x: x['score'], reverse=True)
    
    # Output JSON results
    output = {
        'success': True,
        'results': results,
        'user_query': user_query_data,
        'timestamp': datetime.now().isoformat()
    }
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()