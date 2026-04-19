# Sprint 1 — Tasks from Head of Delivery

> Branch: DEV — one PR per task — run `npm test` before every commit

---

## KAN-003 — GET /api/me (protected user profile)

**Files to create:**
- `backend/src/controllers/user.controller.js`
- `backend/src/routes/user.routes.js`

**Controller:**
```js
exports.me = async (req, res) => {
  // query users WHERE id = req.user.sub
  // return { id, email, role, created_at }
  // 404 if not found
};
```

**Route:** `GET /api/me` → `requireAuth` → `user.controller.me`

**Wire into app.js:** `app.use("/api", userRouter)`

**Test:** `tests/user.test.js`
- 200 + user object with valid JWT
- 401 without token

**Commit:** `feat(user): add GET /api/me protected profile endpoint (KAN-003)`

---

## KAN-004 — requireRole middleware

**File:** `backend/src/middleware/role.js`

```js
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
module.exports = { requireRole };
```

**Test:** `tests/role.test.js`
- admin can access admin-only route
- user gets 403 on admin route
- no token gets 401

**Commit:** `feat(auth): add requireRole middleware (KAN-004)`

---

## KAN-005 — Input validation with express-validator

```bash
npm install express-validator
```

**File:** `backend/src/middleware/validate.js`
```js
const { validationResult } = require("express-validator");
function validate(schemas) {
  return [...schemas, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  }];
}
module.exports = { validate };
```

**Update register route:**
```js
const { body } = require("express-validator");
router.post("/auth/register",
  validate([
    body("email").isEmail().withMessage("valid email required"),
    body("password").isLength({ min: 8 }).withMessage("min 8 chars"),
  ]),
  register
);
```

**Update auth.test.js:** add test — invalid email format → 422

**Commit:** `feat(validation): add express-validator input validation (KAN-005)`

---

## Rules
- All 7 existing tests must pass after each task
- No `console.log` in production code
- No secrets hardcoded
- PR title = commit message
- Ping on Telegram when first PR is open
