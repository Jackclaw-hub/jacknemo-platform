# WORKING.md — Jack (Dev Agent)
Last updated: 2026-04-19

## Status: ACTIVE — Sprint 3 starting

## Completed ✅
### Sprint 1 — Backend
- KAN-001: Auth (JWT, role-based routes)
- KAN-002: Listings CRUD API
- KAN-003: Radar Scoring (weighted engine)
- KAN-004: PostgreSQL real DB integration (172.18.0.3)
- KAN-005: Moderation API (admin approve/reject)

### Sprint 2 — Frontend + Profile
- KAN-006: Frontend API layer (auth/listings/radar/admin HTML pages)
- KAN-007: Founder profile API (POST/GET /api/founders/profile)
- KAN-008: Founder onboarding UI (4-step form)
- KAN-009: Radar uses saved profile — personalized scoring
- KAN-010: Notification service (logs + DB, fires on approve/reject)

## Infrastructure
- DB: PostgreSQL @ 172.18.0.3:5432 (jacknemo_dev)
- DB tables: users(uuid), listings, founder_profiles, notifications
- Backend .env: DB_HOST=172.18.0.3 (ALWAYS needed — dotenv overrides pod env)
- Gateway: OpenRouter primary (deepseek/deepseek-chat-v3-0324), NVIDIA fallback
- Repo: github.com/Jackclaw-hub/jacknemo-platform (main branch is up to date)
- Frontend: /frontend/ directory with auth/onboarding/founder/provider/admin HTML

## Sprint 3 — TODO
- KAN-011: Real-time listing approval feed (polling or SSE)
- KAN-012: Provider analytics (view count, contact count per listing)
- KAN-013: Founder match history (track radar sessions, viewed listings)
- KAN-014: SMTP email integration (nodemailer via env vars)
- KAN-015: Search + filter improvements (full-text search on listings)

## Key facts for next session
- All routes require JWT token except GET /api/listings and GET /api/health
- Admin routes at /api/admin/ require role=admin
- Radar at /api/radar auto-loads founder profile by user_id
- Notifications currently log to console; SMTP not yet configured
- Frontend pages in /frontend/ use api-client.js (fetch wrappers)
