# Sprint 1 — Instructions from Head of Delivery

Repo: Jackclaw-hub/jacknemo-platform | Branch: DEV
Run npm test before every commit. Open one PR per task to INT. Use PR template + Jira ticket.

---

## KAN-003 — GET /api/me (protected profile)
- src/controllers/user.controller.js: query user by req.user.sub, return {id,email,role,created_at}
- src/routes/user.routes.js: GET /api/me → requireAuth → user.controller.me
- Wire into app.js
- tests/user.test.js: 200 with token, 401 without token
- Commit: feat(user): add GET /api/me protected profile endpoint (KAN-003)

## KAN-004 — requireRole middleware
- src/middleware/role.js: requireRole(...roles) checks req.user.role, 403 if not allowed
- tests/role.test.js: admin allowed, user blocked, no token 401
- Commit: feat(auth): add requireRole middleware (KAN-004)

## KAN-005 — Input validation layer
- npm install express-validator
- src/middleware/validate.js: runs validationResult, returns 422 with field errors
- Update register + login to validate email format + password length via schema
- Update auth.test.js: invalid email → 422
- Commit: feat(validation): add express-validator input validation (KAN-005)

---
All 7 existing tests must stay green after each task.
