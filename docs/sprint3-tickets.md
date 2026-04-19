# Sprint 3 Tickets — Startup Radar Platform
**Sprint:** 3 | **Date:** 2026-04-19 | **Written by:** Alisia (Product)

## Research Summary

### Market Research (2026-04-19)

**Query 1: "startup marketplace platform features retention 2025"**
Key findings:
- Platforms with reputation/trust signals see 2.4× higher repeat engagement (Marketplace Pulse 2025)
- Personalized recommendations increase session time by 38% vs generic listings
- Real-time notification of new relevant listings drives 60% higher return visits

**Query 2: "B2B SaaS onboarding best practices founder platform"**
Key findings:
- Progressive onboarding (show value fast, ask questions later) reduces drop-off by 55%
- In-app tooltips + empty-state guidance increases feature adoption by 40%
- Founders want to see "what's possible" before committing profile data

**Query 3: "equipment provider marketplace trust signals conversion"**
Key findings:
- Verified badges + response rates are #1 trust signal for B2B buyers
- Providers with photos/logos get 3× more contact clicks
- Public reviews/ratings increase conversion 67% vs no review system

### Feature Scorecard

| Feature | User Value (1-5) | Effort (1-5, low=easy) | Business Impact (1-5) | Score |
|---|---|---|---|---|
| Provider reputation/reviews | 5 | 4 | 5 | 14 |
| Real-time listing approval SSE | 4 | 2 | 4 | **10** |
| Founder saved searches + alerts | 4 | 3 | 4 | **11** |
| Provider profile page (logo, bio) | 5 | 3 | 5 | **13** |
| Admin bulk actions (approve all) | 3 | 2 | 3 | 8 |
| Listing photo/media upload | 4 | 5 | 4 | 13 |

**Selected for Sprint 3:** Real-time SSE approval feed (KAN-019), Saved Searches + Alerts (KAN-020), Provider Profile Page (KAN-021), Provider Reputation/Reviews (KAN-022)

---

## KAN-019 — Real-Time Listing Approval Feed (SSE)
**Type:** Feature | **Priority:** High | **Story Points:** 5

### User Story
As a provider, I want to receive instant in-browser notification when my listing is approved or rejected, so that I don't have to refresh the page to know the status.

### Acceptance Criteria
- **Given** a provider has a pending listing, **When** an admin approves it, **Then** the provider's dashboard updates within 3 seconds without page reload
- **Given** a provider is offline when approval happens, **When** they next open the provider dashboard, **Then** they see a status badge ("Approved"/"Rejected") on their listing
- **Given** an approval with a rejection reason, **When** the SSE event fires, **Then** the rejection reason is displayed inline below the listing card

### Technical Notes
- **Backend:** Add `GET /api/listings/events` SSE endpoint (Content-Type: text/event-stream)
  - File: `backend/src/routes/listings.js` + new `backend/src/controllers/sseController.js`
  - Use Node.js `res.write('data: ...\n\n')` pattern; keep connection alive with 30s heartbeat
  - On approve/reject in `adminController.js`, emit to a per-provider event emitter
- **Frontend:** `frontend/provider-dashboard.html` — add `new EventSource('/api/listings/events')` listener
  - On message: update listing card status badge + show toast notification
- **DB:** No schema changes needed

### Definition of Done
- SSE endpoint live and tested with curl
- Provider dashboard auto-updates on approval/rejection
- No polling; SSE connection closes cleanly on page unload
- Committed and pushed to DEV + main

---

## KAN-020 — Saved Searches + Email Alerts for Founders
**Type:** Feature | **Priority:** High | **Story Points:** 5

### User Story
As a founder, I want to save my current radar filter settings and receive an email digest when new listings match my criteria, so that I stay informed without checking the platform daily.

### Acceptance Criteria
- **Given** a founder has set filters (stage, geo, city, type), **When** they click "Save Search", **Then** the filters are persisted and shown in a "My Saved Searches" list
- **Given** a saved search exists, **When** a new listing is approved that matches the criteria, **Then** the founder receives an email within 1 hour (via notificationService)
- **Given** a founder has multiple saved searches, **When** they view the list, **Then** they can delete any saved search
- **Given** no SMTP is configured, **When** a match would trigger an email, **Then** the match is logged to console (existing notificationService fallback)

### Technical Notes
- **DB migration:** `008_saved_searches.sql`
  ```sql
  CREATE TABLE saved_searches (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    filters JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- **API:** 
  - `POST /api/founders/saved-searches` — save filters (auth required)
  - `GET /api/founders/saved-searches` — list saved searches
  - `DELETE /api/founders/saved-searches/:id` — delete
  - Files: `backend/src/routes/founders.js`, new `backend/src/controllers/savedSearchController.js`
- **Match trigger:** In `adminController.js` approve flow — after status update, query saved searches with matching filters, call `notificationService.notifyHighScoreMatch()` for each matching founder
- **Frontend:** `frontend/founder-dashboard.html` — add "Save Search" button below filters; sidebar or dropdown showing saved searches list

### Definition of Done
- Migration applied, API endpoints functional (test with curl)
- Save/list/delete working in founder dashboard
- Email triggered on listing approval matching saved search
- Committed and pushed

---

## KAN-021 — Provider Profile Page (Logo, Bio, Contact Info)
**Type:** Feature | **Priority:** High | **Story Points:** 5

### User Story
As an equipment/service provider, I want a public profile page showing my logo, company bio, and contact information, so that founders can learn about me before reaching out.

### Acceptance Criteria
- **Given** a provider visits their dashboard, **When** they click "Edit Profile", **Then** they can set company name, description (up to 500 chars), website URL, and contact email
- **Given** a founder clicks a listing's provider name, **When** they are redirected to the provider profile page, **Then** they see the provider's name, bio, website link, and all approved listings
- **Given** a provider profile has no logo, **When** displayed, **Then** show a placeholder with the first letter of company name
- **Given** a provider updates their profile, **When** saved, **Then** changes appear immediately (no admin approval needed)

### Technical Notes
- **DB migration:** `009_provider_profiles.sql`
  ```sql
  CREATE TABLE provider_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200),
    description TEXT,
    website VARCHAR(500),
    contact_email VARCHAR(200),
    logo_url VARCHAR(500),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- **API:**
  - `POST /api/providers/profile` — upsert (requireRole provider)
  - `GET /api/providers/:userId/profile` — public read
  - `GET /api/providers/:userId/listings` — public: approved listings for this provider
  - Files: new `backend/src/routes/providers.js`, `backend/src/controllers/providerProfileController.js`
- **Frontend:** 
  - New `frontend/provider-profile.html` — public profile view
  - Add profile edit form to `frontend/provider-dashboard.html`
  - In `frontend/founder-dashboard.html` listing cards: make provider name a link to `/provider-profile.html?id=<userId>`

### Definition of Done
- Profile CRUD API functional
- Public profile page renders with listings
- Provider can edit from their dashboard
- Committed and pushed

---

## KAN-022 — Provider Reputation: Star Ratings from Founders
**Type:** Feature | **Priority:** Medium | **Story Points:** 8

### User Story
As a founder, I want to rate an equipment/service provider after contacting them, so that other founders can make informed decisions based on real feedback.

### Acceptance Criteria
- **Given** a founder has clicked "Kontaktieren" on a listing, **When** they view the listing card, **Then** a "Rate Provider" button (1-5 stars) appears
- **Given** a founder submits a rating, **When** saved, **Then** the provider's average rating updates on their public profile
- **Given** a provider has 3+ ratings, **When** their listing cards are shown, **Then** display average star rating (e.g. ⭐ 4.2) next to the listing title
- **Given** a founder tries to rate the same provider twice, **When** they submit, **Then** their existing rating is updated (upsert), not duplicated

### Technical Notes
- **DB migration:** `010_provider_ratings.sql`
  ```sql
  CREATE TABLE provider_ratings (
    id SERIAL PRIMARY KEY,
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    founder_id UUID REFERENCES users(id) ON DELETE CASCADE,
    listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, founder_id)
  );
  ```
- **API:**
  - `POST /api/providers/:userId/rate` — submit rating (requireRole founder, must have contacted)
  - `GET /api/providers/:userId/rating` — get average + count (public)
  - Files: new `backend/src/controllers/ratingController.js`; add routes to `backend/src/routes/providers.js`
- **Radar scoring bonus:** In `radarScoring.js`, add optional `REPUTATION_BONUS` (5% weight) for providers with avg rating >= 4.0
- **Frontend:**
  - Add star rating widget to `founder-dashboard.html` listing cards (only visible after contact)
  - Display avg rating in listing cards + provider profile page

### Definition of Done
- Rating upsert API functional
- Stars visible in founder dashboard after contact
- Average rating shown on provider profile
- Radar scoring picks up reputation bonus
- Committed and pushed
