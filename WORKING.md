# WORKING.md — Jack Dev Agent
**Lead:** Claude | **Updated:** 2026-04-24 | **Sprint:** 2 (Core Features)

---

## ACTIVE TASK: K-16 — Messaging System (UI Completion)

Backend is DONE: `routes/messages.js`, `controllers/messagesController.js` — all 4 endpoints live.
**Remaining work:**

1. **Verify messages.html works end-to-end** — open the page, register 2 users (founder + provider), send a message, verify threads appear. Fix any JS bugs found.
2. **Add PATCH /api/messages/:id/read** — marks message as read, updates `read=true` in mock DB
3. **Unread badge** — messages.html nav badge shows unread count (call GET /api/messages/unread on load)
4. **Wire mark-as-read** — when user opens a thread, PATCH all messages in that thread as read

When done:
- Update kanban K-16 status → "review" via `kanban_update` MCP tool
- Commit code to git repo (`/sandbox/.openclaw-data/workspace/` or jacknemo-platform)
- Notify Alisia via `claw2_send`: "K-16 complete, starting K-17"

---

## TASK QUEUE (ordered — do not skip ahead)

| # | ID | Task | Notes |
|---|-----|------|-------|
| 1 | K-16 | Messaging UI + mark-as-read | ACTIVE ← |
| 2 | K-17 | Swagger/OpenAPI 3.0 docs | After K-16 done |
| 3 | K-22 | Password reset flow | Can use email stub |
| 4 | K-25 | Admin analytics dashboard | Chart.js graphs |
| 5 | K-23 | Mobile responsive UI | CSS media queries |
| 6 | K-26 | Public landing page | SEO + hero + CTA |
| 7 | K-27 | API security hardening | Rate limiting + validation |
| 8 | K-28 | GitHub Actions CI/CD | Blocked on K-4 (Ahmad PAT) |

Sprint 3 tasks (K-20, K-21, K-24) blocked on Ahmad providing credentials. Work around them.

---

## PLATFORM CONTEXT

**Stack:** Node.js + Express | Mock PostgreSQL (auto-fallback) | Vanilla HTML/JS frontend
**Backend port:** 3001 | **Health:** `curl localhost:3001/health`
**Workspace:** `/sandbox/.openclaw-data/workspace/`
**Frontend files:** `/sandbox/.openclaw-data/workspace/frontend/`
**Backend:** `/sandbox/.openclaw-data/workspace/backend/src/`
**GitHub:** `https://github.com/Jackclaw-hub/jacknemo-platform`

**All routes live:**
- `POST /api/auth/register` (requires: email, password, role, name)
- `POST /api/auth/login`
- `GET/POST /api/listings` (search, create, view)
- `GET/POST /api/messages` (auth required)
- `GET /api/messages/unread`
- `GET /api/messages/thread?otherUserId=X&listingId=Y`
- `GET/PUT /api/providers/profile`
- `GET/POST /api/admin/listings` (admin role required)
- `GET /api/radar/score`

---

## DEEP WORK PROTOCOL (mandatory for every task)

```
STAGE 1 — UNDERSTAND:  Read WORKING.md + relevant files + kanban context
STAGE 2 — RESEARCH:    Brave Search — scan best practices and prior art
STAGE 3 — SCORECARD:   Evaluate min. 3 options if multiple approaches exist
STAGE 4 — PLAN:        Write plan before touching code
STAGE 5 — EXECUTE:     Implement step-by-step
STAGE 6 — VERIFY:      Test against Acceptance Criteria
STAGE 7 — DOCUMENT:    Git commit [KAN-XX], kanban update, WORKING.md update
STAGE 8 — HANDOFF:     Notify Alisia or Ahmad only if needed
```

---

## COMMUNICATION RULES

- **Contact Alisia (`claw2_send`)** when: task complete and she needs to know, or you need ACs before proceeding
- **Contact Ahmad** only for: unresolvable blockers (missing credentials), major milestones
- **No status spam** — don't send "I'm working on X" messages. Send results.
- **Max 150 words** per message to Alisia

---

## BLOCKED / WAITING ON AHMAD

| Item | Status |
|------|--------|
| GitHub PAT (repo+workflow scopes) | Needed for PR creation + CI/CD |
| PostgreSQL credentials | 145.223.81.163 unreachable — use mock |
| Jira API token | 401 — work without Jira for now |
| Resend API key | For real email (K-21) |
| Stripe/Paddle API key | For premium listings (K-20) |

Work on everything that does NOT require these. Don't wait for them.

---

## STANDING ORDERS

1. Write code that runs. Test it. Never commit broken code.
2. If Alisia's ACs (K-18) arrive, re-check your completed work against them.
3. After each task: update WORKING.md (move completed to done, next task becomes ACTIVE).
4. Research with Brave before every architectural decision. Save scorecards.
5. The platform needs to be PRODUCTION READY by end of Sprint 3.
