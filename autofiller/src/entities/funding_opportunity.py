from dataclasses import dataclass
from typing import Optional, List, Dict, Any

@dataclass
class FundingOpportunity:
    title: str
    description: str
    funder: str
    amount: Optional[str]  # could be range or specific value
    deadline: Optional[str]  # ISO date string
    eligibility: str
    link: str
    source: str  # which website/database it came from
    raw_data: dict  # for traceability
    # Structured criteria for matching
    industry_tags: Optional[List[str]] = None
    employee_min: Optional[int] = None
    employee_max: Optional[int] = None
    revenue_min: Optional[float] = None  # in euros
    revenue_max: Optional[float] = None
    location_tags: Optional[List[str]] = None  # e.g., ["NRW", "Bundesweit"]
    themes: Optional[List[str]] = None  # e.g., ["Digitalisierung", "Innovation", "Klimaschutz"]
    target_audience: Optional[str] = None  # e.g., "Startups", "KMU", "Großunternehmen"
    
    def __post_init__(self):
        # Ensure lists are initialized if None
        if self.industry_tags is None:
            self.industry_tags = []
        if self.location_tags is None:
            self.location_tags = []
        if self.themes is None:
            self.themes = []