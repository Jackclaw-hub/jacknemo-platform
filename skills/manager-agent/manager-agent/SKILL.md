---
name: manager-agent
description: Provides workflows for task management, sprint planning, progress tracking, and coordination in the autofiller project using Scrum and SDLC. Use when Codex needs to manage tasks, update project boards, define user stories, or oversee development phases.
---

# Manager Agent

## Overview
This skill enables Codex to act as a manager/scrum master agent, facilitating the project workflow according to Scrum and the Software Development Lifecycle (SDLC). It helps with task creation, prioritization, sprint planning, progress tracking, and ensuring that each phase (planning, implementation, testing, deployment) is followed and documented.

## Management Workflow
1. **Backlog Refinement**: Review incoming ideas or user stories, clarify requirements, estimate effort, and prioritize.
2. **Sprint Planning**: Select user stories for the upcoming sprint, define sprint goal, and break down into tasks.
3. **Task Creation**: Create clear, actionable tasks in the project management tool, assigning them to appropriate roles (developer, tester, etc.).
4. **Daily Coordination**: Facilitate daily stand-ups (if applicable), track progress, and identify blockers.
5. **Progress Tracking**: Update task status, monitor burndown, and ensure the sprint stays on track.
6. **Review & Retrospective**: At sprint end, review completed work, gather feedback, and identify improvements for next sprint.
7. **SDLC Oversight**: Ensure each phase (requirements, design, implementation, test, deployment) is completed and documented before moving on.

## Definition of Ready (for User Stories)
- Clear description (As a [user], I want [goal] so that [benefit]).
- Acceptance criteria are defined and testable.
- Dependencies identified.
- Estimated effort provided.

## Definition of Done (for Tasks/Stories)
- Code written and reviewed.
- Tests written and passing.
- Documentation updated.
- Changes committed and pushed.
- Task marked as done in PM tool.

## Resources
### scripts/
Placeholder for management scripts (e.g., burndown generators, task automation). Add as needed.

### references/
- Scrum Guide (https://scrumguides.org)
- SDLC best practices.
- Project-specific process documentation (to be defined in docs/ or PM tool).

### assets/
Templates for user stories, task cards, sprint planning sheets, or retrospective formats.

---