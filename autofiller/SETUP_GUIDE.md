# 🚀 Autofiller Setup Guide

## 📋 Prerequisites
- Python 3.8+
- pip (Python package manager)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Jackclaw-hub/jacknemo-platform.git
cd jacknemo-platform/autofiller
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Demo
```bash
python3 demo.py
```

## 🎯 Quick Start

### Basic Usage
```python
from datetime import datetime
from src.entities.user_query import UserQuery
from src.frameworks.gateways.mock_funding_source import MockFundingSourceGateway
from src.use_cases.keyword_match_score_calculator import KeywordMatchScoreCalculator
from src.use_cases.search_funding_opportunities import SearchFundingOpportunitiesUseCase
from src.interface_adapters.presenters.scorecard_presenter import ScorecardPresenter

# Create user query
query = UserQuery(
    text="KI für kleine Unternehmen in NRW",
    timestamp=datetime.now(),
    employee_count=15,
    annual_revenue=750000,
    industry="IT",
    location_state="NRW"
)

# Setup components
gateway = MockFundingSourceGateway()
scorer = KeywordMatchScoreCalculator()
use_case = SearchFundingOpportunitiesUseCase([gateway], scorer)
presenter = ScorecardPresenter()

# Execute and present
results = use_case.execute(query)
print(presenter.present(results))
```

## 🏗️ Architecture Overview

### Clean Architecture Structure
```
autofiller/
├── src/
│   ├── entities/           # Business concepts
│   │   ├── user_query.py
│   │   ├── funding_opportunity.py
│   │   └── scorecard.py
│   ├── use_cases/          # Business rules
│   │   ├── search_funding_opportunities.py
│   │   └── keyword_match_score_calculator.py
│   ├── frameworks/
│   │   └── gateways/       # External interfaces
│   │       ├── mock_funding_source.py
│   │       └── ifunding_source_gateway.py
│   └── interface_adapters/ # Presenters/Controllers
│       └── presenters/
│           └── scorecard_presenter.py
├── tests/                  # Unit tests
├── docs/                   # Documentation
└── config/                 # Configuration files
```

## 🧪 Testing

### Run All Tests
```bash
python -m pytest tests/
```

### Run Specific Test Module
```bash
python -m pytest tests/entities/test_user_query.py -v
```

## 🔧 Configuration

### Adding New Funding Sources
1. Create a new gateway in `src/frameworks/gateways/`
2. Implement the `IFundingSourceGateway` interface
3. Add to the gateway list in `SearchFundingOpportunitiesUseCase`

### Custom Scoring Algorithms
1. Create new calculator in `src/use_cases/`
2. Implement the `IScoreCalculator` interface
3. Inject into the use case

## 📊 Output Format

The system returns scored funding opportunities with:
- Relevance score (0-100%)
- Detailed justification breakdown
- Funding amount and deadlines
- Direct links to application portals

## 🚀 Production Deployment

### Environment Variables
```bash
export DATABASE_URL=postgresql://user:pass@localhost:5432/autofiller
export API_KEY=your_funding_api_key
```

### Docker Setup
```bash
docker build -t autofiller .
docker run -p 8000:8000 autofiller
```

### API Integration
```python
# Example Flask endpoint
@app.route('/api/funding/search', methods=['POST'])
def search_funding():
    data = request.json
    query = UserQuery(**data)
    # ... use case execution
    return jsonify(results)
```

## 🎨 Customization

### Modifying Scoring Weights
Edit `src/use_cases/keyword_match_score_calculator.py`:
```python
class KeywordMatchScoreCalculator(IScoreCalculator):
    def __init__(self, weights=None):
        self.weights = weights or {
            'text_match': 0.5,
            'theme_match': 0.3,
            'company_match': 0.2
        }
```

### Adding New Company Fields
Extend `UserQuery` class:
```python
@dataclass
class UserQuery:
    # ... existing fields
    company_size: Optional[str] = None  # New field
    technology_stack: Optional[List[str]] = None
```

## 📈 Monitoring & Analytics

### Logging Configuration
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

### Performance Metrics
- Query execution time
- Results count per source
- Average scoring time
- Success/failure rates

## 🆘 Troubleshooting

### Common Issues

**ModuleNotFoundError:**
```bash
export PYTHONPATH=/path/to/jacknemo-platform:$PYTHONPATH
```

**Database Connection:**
- Check database URL format
- Verify network connectivity
- Ensure database is running

### Getting Help
- Check existing tests for usage examples
- Review interface definitions
- Examine mock implementations

---
**Last Updated:** 2026-04-14
**Version:** 1.0.0