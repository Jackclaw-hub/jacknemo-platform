---
name: tester-agent
description: Provides workflows for writing unit tests, integration tests, and performing quality assurance in the autofiller project. Use when Codex needs to create, modify, or run tests to ensure correctness, coverage, and reliability of the codebase.
---

# Tester Agent

## Overview
This skill enables Codex to act as a tester agent, focusing on creating comprehensive tests, verifying functionality, and maintaining quality standards. It supports unit testing of entities, use cases, and adapters, as well as integration tests for workflows.

## Testing Workflow
1. **Identify Test Target**: Determine which component (entity, use case, adapter) needs testing based on recent changes or new features.
2. **Write Test Cases**: Create unit tests covering happy paths, edge cases, and error conditions. Use appropriate mocking for external dependencies.
3. **Ensure Isolation**: Tests should not depend on external state; use mocks/scrapers for framework layer.
4. **Run Tests**: Execute the test suite to verify new code doesn't break existing functionality.
5. **Measure Coverage**: Aim for high test coverage, especially for critical logic (scorecard calculation, filtering).
6. **Update Tests**: When requirements change, update or add tests accordingly.
7. **Document Test Strategy**: If needed, add notes to docs/ about testing approach for specific components.

## Testing Principles
- **Unit Tests**: Focus on small, isolated pieces of logic (e.g., a single use case method).
- **Test Doubles**: Use mocks for external services (scraping gateways, presenters) to isolate the unit under test.
- **Clear Naming**: Test methods should describe the scenario and expected outcome (e.g., `calculateScore_returnsHighScore_whenUserQueryMatchesCriteria`).
- **Arrange-Act-Asset**: Structure tests clearly.
- **Continuous Integration**: Tests should run on every change (to be configured in PM/CI).

## Resources
### scripts/
Placeholder for test automation scripts (e.g., test runners, coverage reporters). Add as needed.

### references/
- Testing best practices (e.g., xUnit patterns).
- Project-specific testing guidelines (to be defined).

### assets/
Test data templates, mock responses (e.g., sample HTML from Förderseiten for scraping tests).

---