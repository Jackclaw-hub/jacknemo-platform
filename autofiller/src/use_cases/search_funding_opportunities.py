from abc import ABC, abstractmethod
from typing import List, Protocol

from ..entities.user_query import UserQuery
from ..entities.funding_opportunity import FundingOpportunity
from ..entities.scorecard import Scorecard
from ..frameworks.gateways.ifunding_source_gateway import IFundingSourceGateway
from .score_calculator import IScoreCalculator

class ISearchFundingOpportunities(ABC):
    @abstractmethod
    def execute(self, query: UserQuery) -> List[Scorecard]:
        """Search for funding opportunities based on the user query and return scored results."""
        pass


class SearchFundingOpportunitiesProtocol(Protocol):
    def execute(self, query: UserQuery) -> List[Scorecard]:
        ...


class SearchFundingOpportunitiesUseCase(ISearchFundingOpportunities):
    """
    Orchestrates the search for funding opportunities:
    1. Fetch opportunities from configured sources
    2. Score each opportunity based on the user query
    3. Sort by score descending
    4. Return the list of scorecards
    """
    
    def __init__(self, 
                 gateways: List[IFundingSourceGateway],
                 score_calculator: IScoreCalculator):
        self._gateways = gateways
        self._score_calculator = score_calculator
    
    def execute(self, query: UserQuery) -> List[Scorecard]:
        all_opportunities: List[FundingOpportunity] = []
        
        # Fetch from all configured sources
        for gateway in self._gateways:
            try:
                opportunities = gateway.fetch_opportunities()
                all_opportunities.extend(opportunities)
            except Exception as e:
                # In a real implementation, we'd log this and potentially continue
                # For now, we'll just continue with what we have
                continue
        
        # Score each opportunity
        scorecards: List[Scorecard] = []
        for opportunity in all_opportunities:
            try:
                scorecard = self._score_calculator.calculate_score(opportunity, query)
                scorecards.append(scorecard)
            except Exception as e:
                # Skip opportunities that fail scoring
                continue
        
        # Sort by score descending
        scorecards.sort(key=lambda x: x.total_score, reverse=True)
        
        return scorecards