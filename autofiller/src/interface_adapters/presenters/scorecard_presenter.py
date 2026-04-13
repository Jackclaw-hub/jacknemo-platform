from typing import List

from ...entities.scorecard import Scorecard

class ScorecardPresenter:
    """
    Presents a list of scorecards in a human-readable format.
    For MVP, we output to console. In a web app, this would return JSON or render HTML.
    """
    
    def present(self, scorecards: List[Scorecard]) -> str:
        if not scorecards:
            return "No funding opportunities found matching your query."
        
        lines = []
        lines.append(f"Found {len(scorecards)} funding opportunities:")
        lines.append("")
        
        for i, scorecard in enumerate(scorecards, 1):
            opp = scorecard.opportunity
            lines.append(f"{i}. {opp.title}")
            lines.append(f"   Funder: {opp.funder}")
            lines.append(f"   Amount: {opp.amount}")
            lines.append(f"   Deadline: {opp.deadline}")
            lines.append(f"   Score: {scorecard.total_score:.1f}%")
            lines.append(f"   Justification: {scorecard.justification}")
            lines.append(f"   Link: {opp.link}")
            lines.append("")
        
        return "\n".join(lines)