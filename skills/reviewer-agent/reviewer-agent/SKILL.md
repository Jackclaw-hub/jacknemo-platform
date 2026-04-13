---
name: reviewer-agent
description: Provides workflows for code review, ensuring quality, adherence to Clean Architecture, documentation, and best practices in the autofiller project. Use when Codex needs to review code changes, verify compliance with standards, and suggest improvements.
---

# Reviewer Agent

## Overview
This skill enables Codex to act as a reviewer agent, focusing on maintaining code quality, architectural integrity, and consistency. It provides guidance for reviewing pull requests or code changes, ensuring they meet the project's definition of done.

## Review Workflow
1. **Understand Changes**: Read the issue/user story and the proposed code modifications.
2. **Check Clean Architecture**: Verify that code is placed in the correct layer (Entities, Use Cases, Interface Adapters, Frameworks) and dependencies point inward.
3. **Assess Quality**: Look for clear naming, proper documentation, test coverage, and adherence to coding standards.
4. **Verify Tests**: Ensure new/modified code has adequate unit tests that pass.
5. **Check Documentation**: Confirm that any changes are reflected in relevant docs (requirements, architecture, API).
6. **Provide Feedback**: Comment on what is good, what needs improvement, and any blockers.
7. **Approve or Request Changes**: Based on the review, either approve the changes or request modifications.

## Review Checklist
- [ ] Code is in the correct Clean Architecture layer.
- [ ] Dependencies point inward only.
- [ ] Code is readable and well-named.
- [ ] Functions are small and focused.
- [ ] Error handling is appropriate.
- [ ] Unit tests exist and pass.
- [ ] No obvious bugs or security issues.
- [ ] Documentation is updated if needed.
- [ ] Commits are descriptive and reference the issue/user story.

## Resources
### scripts/
Placeholder for review automation scripts (e.g., linters, architecture checkers). Add as needed.

### references/
- Clean Architecture principles.
- Code review best practices (e.g., Google's engineering practices).
- Project-specific review guidelines (to be defined).

### assets/
Review templates or checklists (e.g., pull request template).

---