#!/usr/bin/env python3
"""
Database integration for ScoringV2Service
Connects PostgreSQL database with Python scoring system
"""

import os
import json
import psycopg2
from typing import List, Dict, Any
from scoring_v2 import ScoringV2Service

class DatabaseScoringIntegration:
    def __init__(self):
        self.scoring_service = ScoringV2Service()
        self.db_url = os.getenv('DATABASE_URL')
        
    def get_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_url)
    
    def fetch_funding_opportunities(self, limit: int = 10) -> List[Dict]:
        """Fetch active funding opportunities from database"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    query = """
                        SELECT 
                            id, title, description, funder,
                            amount, deadline, eligibility, link,
                            industry_tags, employee_min, employee_max,
                            revenue_min, revenue_max, location_tags,
                            themes, target_audience, remote_eligible,
                            funding_amount_min, funding_amount_max,
                            equity_required, investment_type
                        FROM funding_opportunities
                        WHERE is_active = true
                        AND (deadline IS NULL OR deadline > NOW())
                        ORDER BY created_at DESC
                        LIMIT %s
                    """
                    
                    cur.execute(query, (limit,))
                    rows = cur.fetchall()
                    
                    opportunities = []
                    for row in rows:
                        opportunities.append({
                            'id': row[0],
                            'title': row[1],
                            'description': row[2],
                            'funder': row[3],
                            'amount': row[4],
                            'deadline': row[5],
                            'eligibility': row[6],
                            'link': row[7],
                            'industry_tags': row[8] or [],
                            'employee_min': row[9],
                            'employee_max': row[10],
                            'revenue_min': row[11],
                            'revenue_max': row[12],
                            'location_tags': row[13] or [],
                            'themes': row[14] or [],
                            'target_audience': row[15],
                            'remote_eligible': row[16],
                            'funding_amount_min': row[17],
                            'funding_amount_max': row[18],
                            'equity_required': row[19],
                            'investment_type': row[20]
                        })
                    
                    return opportunities
                    
        except Exception as e:
            print(f"Database query error: {e}")
            return []
    
    def score_opportunities(self, user_query: Dict, opportunities: List[Dict]) -> List[Dict]:
        """Score opportunities against user query"""
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
                    industry_tags=opportunity['industry_tags'],
                    employee_min=opportunity['employee_min'],
                    employee_max=opportunity['employee_max'],
                    revenue_min=opportunity['revenue_min'],
                    revenue_max=opportunity['revenue_max'],
                    location_tags=opportunity['location_tags'],
                    themes=opportunity['themes'],
                    target_audience=opportunity['target_audience'],
                    remote_eligible=opportunity['remote_eligible']
                )
                
                # Create UserQuery object
                user_query_obj = UserQuery(
                    text=user_query.get('text', ''),
                    timestamp=user_query.get('timestamp', '2024-01-01T00:00:00'),
                    industry=user_query.get('industry'),
                    location_state=user_query.get('location_state'),
                    employee_count=user_query.get('employee_count'),
                    annual_revenue=user_query.get('annual_revenue')
                )
                
                # Calculate score
                scorecard = self.scoring_service.calculate_score(fund_opp, user_query_obj)
                
                scored_opportunities.append({
                    **opportunity,
                    'score': scorecard.total_score,
                    'justification': scorecard.justification,
                    'category_scores': scorecard.category_scores
                })
                
            except Exception as e:
                print(f"Error scoring opportunity {opportunity.get('id')}: {e}")
        
        # Sort by score descending
        return sorted(scored_opportunities, key=lambda x: x['score'], reverse=True)
    
    def get_top_matches(self, user_query: Dict, limit: int = 5) -> List[Dict]:
        """Get top matching funding opportunities"""
        opportunities = self.fetch_funding_opportunities(20)
        scored = self.score_opportunities(user_query, opportunities)
        return scored[:limit]

# Test function
def test_database_scoring():
    """Test the database scoring integration"""
    print("Testing Database Scoring Integration...\n")
    
    try:
        integration = DatabaseScoringIntegration()
        
        # Mock user query
        user_query = {
            'text': "AI startup funding for machine learning",
            'industry': "AI", 
            'location_state': "California",
            'employee_count': 25,
            'annual_revenue': 1000000
        }
        
        print("User Query:", json.dumps(user_query, indent=2))
        print("\n" + "="*50 + "\n")
        
        # Get top matches
        top_matches = integration.get_top_matches(user_query, 3)
        
        if not top_matches:
            print("No funding opportunities found or database connection failed")
            print("Please check database connection and seed data")
            return
        
        print("TOP MATCHES:")
        print("="*50)
        
        for i, match in enumerate(top_matches):
            print(f"\n{i+1}. {match['title']}")
            print(f"   Score: {match['score']:.1f}/100")
            print(f"   Funder: {match['funder']}")
            print(f"   Amount: {match['amount']}")
            print(f"   Deadline: {match['deadline']}")
            print(f"   Justification: {match['justification']}")
            print("-"*50)
        
        print("\n✅ Database scoring integration test completed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_database_scoring()