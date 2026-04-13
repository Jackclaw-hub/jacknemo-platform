from dataclasses import dataclass
from typing import Optional, Dict, Any

@dataclass
class Scorecard:
    opportunity: 'FundingOpportunity'
    total_score: float  # 0.0 to 1.0 or 0 to 100
    justification: str
    # Breakdown of scores by category
    category_scores: Optional[Dict[str, float]] = None
    # Factors that contributed positively/negatively
    positive_factors: Optional[list[str]] = None
    negative_factors: Optional[list[str]] = None
    
    def __post_init__(self):
        if self.category_scores is None:
            self.category_scores = {}
        if self.positive_factors is None:
            self.positive_factors = []
        if self.negative_factors is None:
            self.negative_factors = []