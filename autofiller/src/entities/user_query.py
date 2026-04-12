from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any

@dataclass
class UserQuery:
    text: str
    timestamp: datetime
    user_id: Optional[str] = None
    # Company data
    employee_count: Optional[int] = None
    annual_revenue: Optional[float] = None  # in euros
    industry: Optional[str] = None
    location_state: Optional[str] = None  # e.g., "NRW"
    # Survey responses: map of question_id to answer
    survey_responses: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if isinstance(self.timestamp, str):
            self.timestamp = datetime.fromisoformat(self.timestamp)
        if self.survey_responses is None:
            self.survey_responses = {}