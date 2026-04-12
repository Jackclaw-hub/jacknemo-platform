from abc import ABC, abstractmethod
from typing import Protocol

from ..entities.user_query import UserQuery
from ..entities.funding_opportunity import FundingOpportunity
from ..entities.scorecard import Scorecard  # To be defined


class IScoreCalculator(ABC):
    @abstractmethod
    def calculate_score(self, opportunity: FundingOpportunity, query: UserQuery) -> Scorecard:
        """Calculate a scorecard for the given funding opportunity based on the user query and company data."""
        pass


# Alternative using Protocol (structural typing) if preferred
class ScoreCalculatorProtocol(Protocol):
    def calculate_score(self, opportunity: FundingOpportunity, query: UserQuery) -> Scorecard:
        ...