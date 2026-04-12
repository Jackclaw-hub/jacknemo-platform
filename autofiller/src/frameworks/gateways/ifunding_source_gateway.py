from abc import ABC, abstractmethod
from typing import List

from ...entities.funding_opportunity import FundingOpportunity

class IFundingSourceGateway(ABC):
    @abstractmethod
    def fetch_opportunities(self) -> List[FundingOpportunity]:
        """Fetch funding opportunities from the source.
        
        Returns:
            List of FundingOpportunity objects.
            
        Note:
            Implementations should handle errors appropriately (e.g., network issues,
            parsing errors) and return an empty list or raise specific exceptions
            as needed by the application.
        """
        pass