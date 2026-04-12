# Autofiller für Förderanträge und Ausschreibungsportale

Scraping aller verfügbaren Seiten und Erstellung einer Scorecard basierend auf User-Fragen.

## Struktur (Clean Architecture)
- `docs/` - Anforderungen, Architektur, API, Backlog
- `src/` - Quellcode nach Clean Architecture
  - `entities/` - Geschäftskonzepte (UserQuery, FundingOpportunity, Scorecard)
  - `use_cases/` - Anwendungslogik (SearchFundingOpportunities, ScoreCalculator)
  - `frameworks/gateways/` - Externe Quellen (Mock, später reale Scraper)
  - `interface_adapters/` - Controller, Presenter
- `tests/` - Tests
- `scripts/` - Hilfsskripte
- `config/` - Konfiguration

## Aktueller Stand (MVP Komponenten implementiert)
- Datenmodelle: UserQuery (mit Firmendaten und Survey Responses), FundingOpportunity (mit strukturierten Kriterien), Scorecard
- Scoring-Schnittstelle: IScoreCalculator mit KeywordMatchScoreCalculator Implementierung
- Such-Use-Case: SearchFundingOpportunitiesUseCase orchestriert Gateway und Scoring
- Gateway-Schnittstelle: IFundingSourceGateway mit MockImplementierung (4 Beispielchancen)
- Presenter: ScorecardPresenter für konsolenbasierte Ausgabe

## Wie zu testen
Ein einfacher Test kann wie folgt durchgeführt werden (in einer Python Umgebung):

```python
from src.entities.user_query import UserQuery
from src.frameworks.gateways.mock_funding_source import MockFundingSourceGateway
from src.use_cases.keyword_match_score_calculator import KeywordMatchScoreCalculator
from src.use_cases.search_funding_opportunities import SearchFundingOpportunitiesUseCase
from src.interface_adapters.presenters.scorecard_presenter import ScorecardPresenter

# 1. Eingabe vom User
query = UserQuery(
    text="KI für kleine Unternehmen in NRW",
    employee_count=10,
    annual_revenue=500000,
    industry="IT",
    location_state="NRW"
)

# 2. Komponenten zusammenbauen
gateway = MockFundingSourceGateway()
scorer = KeywordMatchScoreCalculator()
use_case = SearchFundingOpportunitiesUseCase([gateway], scorer)
presenter = ScorecardPresenter()

# 3. Ausführung und Ausgabe
results = use_case.execute(query)
print(presenter.present(results))
```

## Nächste Schritte
- Einheitstests für Entities, Use Cases und Presenter schreiben
- API-Endpunkt entwickeln (falls Webinterface gewünscht)
- Echte Scraping-Gateways für ausgewählte Förderportale implementieren
- Konfigurationssystem für Quellen und Rate-Limits hinzufügen
- Integration in Projektmanagement-Tool für Task-Tracking

## Architekturhinweis
Alle Komponenten folgen den Prinzipien der Clean Architecture:
- Abhängigkeiten zeigen nach innen
- Geschäftsregeln sind unabhängig von Frameworks
- Testbarkeit durch Schnittstellen und Dependency Injection