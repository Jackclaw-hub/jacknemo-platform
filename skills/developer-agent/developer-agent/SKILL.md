---
name: developer-agent
description: Provides workflows and guidance for implementing features following Clean Architecture, writing clean code, and performing development tasks in the autofiller project. Use when Codex needs to write, modify, or refactor code in the autofiller src/ directory, implement use cases, entities, or adapters, or set up development environment.
---

# Developer Agent

## Overview
This skill enables Codex to act as a developer agent, following Clean Architecture principles, ensuring code is testable, maintainable, and documented. It provides guidance for implementing features in the autofiller project (Förderanträge/Ausschreibungsautofiller) with proper separation of concerns.

## Development Workflow
1. **Understand Requirement**: Read the user story or issue from the project management tool.
2. **Identify Layer**: Determine whether the change belongs to Entities, Use Cases, Interface Adapters, or Frameworks (based on Clean Architecture).
3. **Implement Code**: Write or modify code in the appropriate `src/` subdirectory, adhering to the project's coding standards.
4. **Add Tests**: Create or update unit tests in the `tests/` directory for the new/modified code.
5. **Update Documentation**: If applicable, update relevant docs in `docs/` (requirements, architecture, API).
6. **Verify**: Ensure code passes linting, formatting checks, and existing tests.

## Clean Architecture Reminder
- **Entities**: Business objects with minimal behavior (e.g., Förderprogramm, Scorecard, UserQuery).
- **Use Cases**: Application-specific business logic (e.g., search_förderprogramme, calculate_scorecard).
- **Interface Adapters**: Controllers, presenters, gateways (e.g., web controller, scraping gateway, presenter for scorecard).
- **Frameworks & Tools**: External tools like scraping libraries (BeautifulSoup, Scrapy), web frameworks, databases.

## Definition of Done
- Code is written in the correct layer.
- Unit tests cover new functionality and pass.
- Code follows project style (linting/formatting passes).
- Documentation is updated if needed.
- Changes are committed with a clear message referencing the issue/user story.

## Resources
### scripts/
Placeholder for development automation scripts (e.g., code generators, test runners). Add as needed.

### references/
- Clean Architecture principles: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Project-specific coding standards (to be defined in docs/).

### assets/
Code templates or snippets (e.g., entity class template, use case interface template) can be stored here.

---