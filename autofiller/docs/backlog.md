# Product Backlog - Autofiller

## MVP: Scorecard based on User Query

### User Story
As a user, I want to enter a free-text query describing my funding need (e.g., "KI für kleine Unternehmen in NRW"), so that the system returns a scored list of relevant funding opportunities/grants, allowing me to quickly identify suitable programs.

### Acceptance Criteria
- [ ] User can submit a free-text query via input field.
- [ ] System scrapes configured funding sources (to be defined).
- [ ] System extracts relevant opportunity data: title, description, funder, amount, deadline, eligibility, link.
- [ ] System scores each opportunity based on relevance to the user query.
- [ ] Scorecard displays: opportunity title, score %, brief justification, key details (amount, deadline).
- [ ] Results sorted by score descending.
- [ ] All steps documented and traceable.

### Subtasks (Definition of Done)
1. **Data Model Design**
   - Define `UserQuery` entity (text, timestamp, user ID if needed).
   - Define `FundingOpportunity` entity (title, description, funder, amount, deadline, eligibility, link, source, raw data).
   - Define `Scorecard` entity (opportunity reference, score, justification, factors).
   - Location: `src/entities/`
   - Tests: unit tests for entities.
   - Docs: update `docs/architecture.md` if needed.
   - **Status: DONE** (UserQuery and FundingOpportunity enhanced with company data and structured criteria; Scorecard defined)

2. **Scoring Algorithm Interface**
   - Define `IScoreCalculator` use case interface: `calculateScore(opportunity, query) -> Scorecard`.
   - Location: `src/use_cases/`
   - Implementation: initial simple keyword matching (TF-IDF or basic regex).
   - Tests: unit tests for scoring logic.
   - Docs: document algorithm in `docs/architecture.md` or separate `docs/scoring.md`.
   - **Status: DONE** (IScoreCalculator defined, KeywordMatchScoreCalculator implemented, Scorecard entity defined)

3. **Scraping Gateway Skeleton**
   - Define `IFundingSourceGateway` interface: `fetchOpportunities() -> List<FundingOpportunity>`.
   - Location: `src/frameworks/gateways/`
   - Implement a placeholder/gateway for a test source (e.g., static JSON or mock HTML).
   - Respect robots.txt and rate limiting (to be configured later).
   - Tests: mock tests, integration test placeholder.
   - Docs: list of configured sources in `docs/configuration.md`.
   - **Status: IN PROGRESS** (Interface defined; need to implement a simple test gateway and wire up)

4. **Search Use Case Orchestration**
   - Create `SearchFundingOpportunities` use case: takes `UserQuery`, calls gateway, scores each, returns sorted `Scorecard`s.
   - Location: `src/use_cases/`
   - Tests: unit tests mocking gateway and scorer.
   - Docs: sequence diagram in `docs/architecture.md`.
   - **Status: DONE** (Use case implemented)

5. **Presenter for Scorecard Display**
   - Create `ScorecardPresenter`: formats list of `Scorecard`s for output (initially console/JSON, later HTML).
   - Location: `src/interface_adapters/presenters/`
   - Tests: unit tests for formatting.
   - Docs: example output in `docs/api.md`.
   - **Status: TODO**

6. **API Endpoint (if applicable)**
   - If web interface: simple controller accepting POST `/search` with query, returning JSON list.
   - Location: `src/interface_adapters/controllers/`
   - Tests: integration test.
   - Docs: API spec in `docs/api.md`.
   - **Status: TODO**

7. **Configuration**
   - Config file for enabling/disabling sources, rate limits, etc.
   - Location: `config/`
   - Docs: `docs/configuration.md`.
   - **Status: TODO**

8. **Documentation & Definition of Done**
   - Update `README.md` with how to run MVP.
   - Ensure all code follows Clean Architecture.
   - Ensure unit tests pass.
   - Ensure documentation is up-to-date.
   - Commit with clear message referencing this user story.
   - **Status: IN PROGRESS** (README exists, architecture and requirements docs exist)

### Notes
- All work to be done in short, focused commits.
- Regular updates to be provided via project management tool (to be configured).
- Definition of Done includes: code reviewed, tested, documented, and ready for integration.