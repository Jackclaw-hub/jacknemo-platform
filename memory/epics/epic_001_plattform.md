# Epic 001 – Platform with Permission System
Created: 2026-04-09 | Status: 🟡 In Progress
Environment: DEV

## Goal
Build a SaaS platform with:
- Role & User Management (Admin, Manager, User)
- Security (Frontend + Backend)
- Three Environments: DEV / INT / PROD
- Permission system per role

## Tech Stack
- Database:  PostgreSQL (free, reliable)
- Backend:   Node.js + Express (free, stable)
- Frontend:  React (free, popular)
- Container: Docker (already on VPS)
- Repo:      Jackclaw-hub/jacknemo-platform (GitHub)

## Decisions
| Date       | Decision                              |
|------------|---------------------------------------|
| 2026-04-06 | Model: deepseek-ai/deepseek-v3.1      |
| 2026-04-06 | Memory system built                   |
| 2026-04-06 | Brave Search active                   |
| 2026-04-09 | Stack: PostgreSQL + Node.js + React   |
| 2026-04-09 | Start with DEV environment only       |
| 2026-04-09 | Build order: DB → Auth → API → UI     |

## Phase 1 – Database & Data Model
| # | Task                          | Agent       | Status    |
|---|-------------------------------|-------------|-----------|
| 1 | Design user table             | Jack        | ⬜ Open   |
| 2 | Design roles table            | Jack        | ⬜ Open   |
| 3 | Design permissions table      | Jack        | ⬜ Open   |
| 4 | Create DB schema file         | Jack        | ⬜ Open   |
| 5 | Create Jira tickets for Phase 1| Jack       | ⬜ Open   |

## Phase 2 – Auth & User Management
| # | Task                          | Agent       | Status    |
|---|-------------------------------|-------------|-----------|
| 6 | JWT authentication setup      | SecurityBot | ⬜ Open   |
| 7 | Register / Login endpoints    | Jack        | ⬜ Open   |
| 8 | Role assignment logic         | SecurityBot | ⬜ Open   |
| 9 | Password hashing (bcrypt)     | SecurityBot | ⬜ Open   |
| 10| Create Jira tickets Phase 2   | Jack        | ⬜ Open   |

## Phase 3 – API Backend
| # | Task                          | Agent       | Status    |
|---|-------------------------------|-------------|-----------|
| 11| Express project structure     | Jack        | ⬜ Open   |
| 12| REST API endpoints            | Jack        | ⬜ Open   |
| 13| Permission middleware         | SecurityBot | ⬜ Open   |
| 14| API documentation             | DocsBot     | ⬜ Open   |
| 15| Create Jira tickets Phase 3   | Jack        | ⬜ Open   |

## Phase 4 – Frontend UI
| # | Task                          | Agent       | Status    |
|---|-------------------------------|-------------|-----------|
| 16| React project setup           | Jack        | ⬜ Open   |
| 17| Login page                    | Jack        | ⬜ Open   |
| 18| Dashboard per role            | Jack        | ⬜ Open   |
| 19| User management UI (Admin)    | Jack        | ⬜ Open   |
| 20| Create Jira tickets Phase 4   | Jack        | ⬜ Open   |

## Open Questions
- What is the platform name?
- How many user roles exactly?
- Any specific features per role?

## Notes & Learnings
<!-- Jack fills this in as work progresses -->
