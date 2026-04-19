# Sprint 4 Tickets — Startup Radar Platform
**Sprint:** 4 | **Date:** 2026-04-19 | **Written by:** HoD (Alisia timed out)

## Research Summary

### Query 1: "SaaS marketplace referral program viral growth"
- Referral programs drive 3.5× more conversions than standard ads (ReferralHero 2025)
- Two-sided referrals (both referrer + referee get benefit) increase uptake by 70%
- Invite codes with expiry create urgency; best performing are 30-day validity
- Key metric: viral coefficient (K-factor) > 1.0 = organic growth

### Query 2: "B2B platform messaging system founder provider communication"
- In-app messaging reduces time-to-contact by 65% vs email
- Thread-based conversation with read receipts is standard expectation for B2B
- Unread message badge is #1 driver of daily active usage
- Message notification emails increase reply rate by 42%

### Query 3: "equipment marketplace premium listing feature monetization"
- Promoted/featured listings earn 2-4× more views on Airbnb for Work, Peerspace
- Freemium model: 3 free listings, then paid for more is dominant pattern
- Admin-curated "Featured" badge increases click-through 58%
- Price anchoring: show "Featured" at €29/mo next to "Standard" (free) drives upgrades

### Feature Scorecard

| Feature | User Value | Effort | Business Impact | Revenue Potential | TOTAL |
|---|---|---|---|---|---|
| In-app messaging | 5 | 4 | 5 | 3 | **17** |
| Premium/featured listings | 3 | 2 | 5 | 5 | **15** |
| Founder invite/referral | 4 | 2 | 4 | 4 | **14** |
| Weekly top-matches email digest | 4 | 2 | 4 | 2 | **12** |
| Provider response rate tracking | 3 | 1 | 3 | 2 | 9 |
| Mobile-responsive audit | 2 | 3 | 3 | 1 | 9 |

**Selected for Sprint 4:** In-app messaging (KAN-023), Weekly email digest (KAN-024), Featured listings (KAN-025), Referral/invite system (KAN-026)

---

## KAN-023 — In-App Messaging Between Founder and Provider
**Type:** Feature | **Priority:** High | **Story Points:** 8

### User Story
As a founder, I want to send messages directly to a provider through the platform, so that I can discuss details without sharing my personal email upfront.

### Acceptance Criteria
- **Given** a founder has clicked "Kontaktieren" on a listing, **When** a "Message Provider" button appears, **Then** clicking it opens a message thread
- **Given** a message is sent, **When** the provider loads their dashboard, **Then** they see an unread message badge and the message content
- **Given** a provider replies, **When** the founder refreshes or has SSE active, **Then** the reply appears in the thread without reload
- **Given** either party has unread messages, **When** they log in, **Then** a notification badge appears in the nav bar

### Technical Notes
- **DB migration:** `011_messages.sql`
  ```sql
  CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read);
  CREATE INDEX idx_messages_listing ON messages(listing_id);
  ```
- **API:**
  - `POST /api/messages` — send message (auth required, body: `{listing_id, recipient_id, body}`)
  - `GET /api/messages` — get all threads for current user (grouped by listing + other party)
  - `GET /api/messages/:threadId` — get thread messages
  - `PUT /api/messages/:threadId/read` — mark all as read
  - File: `backend/src/controllers/messageController.js`, `backend/src/routes/messages.js`
- **Frontend:**
  - `frontend/messages.html` — new page: thread list left, active thread right
  - Add unread count badge to nav in provider-dashboard.html and founder-dashboard.html
  - After "Kontaktieren" — show "💬 Message" button linking to `messages.html?listing=<id>&to=<providerId>`
- **SSE:** Extend sseService to emit `new_message` event to recipient's active connection

### Definition of Done
- All 4 API endpoints functional (test with curl)
- Thread list + message view rendered in messages.html
- Unread badge in nav
- SSE delivers new message in real-time
- Committed and pushed

---

## KAN-024 — Weekly Top-Matches Email Digest for Founders
**Type:** Feature | **Priority:** High | **Story Points:** 3

### User Story
As a founder, I want to receive a weekly email showing my top 5 radar matches from the past week, so that I stay engaged with the platform without having to check it daily.

### Acceptance Criteria
- **Given** a founder has an active account, **When** the weekly digest cron runs (Sunday 09:00), **Then** they receive an email with their top 5 matches based on current radar scoring
- **Given** a founder has no radar profile, **When** the digest runs, **Then** they receive a "Complete your profile" email instead
- **Given** SMTP is not configured, **When** digest runs, **Then** matches are logged to console (existing notificationService fallback)
- **Given** a founder has opted out (future: unsubscribe link), **When** digest runs, **Then** they are skipped

### Technical Notes
- **New service:** `backend/src/services/digestService.js`
  - `sendWeeklyDigest()` — queries all founders, runs scoreListingsForFounder for each, sends top 5 via notificationService
  - Extend `notificationService.js` with `sendDigestEmail(founder, matches)` method
- **Cron trigger:** `backend/src/jobs/weeklyDigest.js` — uses `node-cron` (`0 9 * * 0` = Sunday 09:00)
  - Wire up in `app.js`: `require('./jobs/weeklyDigest')`
  - Package: `npm install node-cron --save`
- **Email template:** Plain-text + HTML multipart; list top 5 matches with title, type, geo, match%
- **DB:** No schema change needed (uses existing tables)

### Definition of Done
- digestService written and tested via manual trigger endpoint `POST /api/admin/send-digest` (admin only)
- Weekly cron scheduled
- Email sends (or console log) with top 5 matches
- Committed and pushed

---

## KAN-025 — Featured/Promoted Listings (Admin Boost)
**Type:** Feature | **Priority:** High | **Story Points:** 3

### User Story
As an admin, I want to mark certain listings as "featured" so that high-quality providers get more visibility and we can offer a premium tier in the future.

### Acceptance Criteria
- **Given** an admin clicks "Feature" on an approved listing, **When** the listing is fetched via radar or search, **Then** it appears first (or with a "⭐ Featured" badge)
- **Given** a listing is featured, **When** a founder views their radar results, **Then** the featured listing has a visible gold border/badge
- **Given** a listing is unfeatured by admin, **When** radar refreshes, **Then** the featured badge disappears

### Technical Notes
- **DB migration:** `012_featured_listings.sql`
  ```sql
  ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
  ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
  ```
- **API:**
  - `PUT /api/admin/listings/:id/feature` — set `is_featured=true` + `featured_until` (30 days from now)
  - `PUT /api/admin/listings/:id/unfeature` — set `is_featured=false`
  - Add to `backend/src/routes/admin.js` and `adminController.js`
- **Radar scoring:** In `radarScoring.js`, add `FEATURED_BONUS: 0.10` weight applied if `listing.is_featured && listing.featured_until > NOW`
- **Frontend:**
  - `frontend/admin.html` — add Feature/Unfeature button next to approve/reject
  - `frontend/founder-dashboard.html` — show gold border + "⭐ Featured" chip on featured listings
  - `frontend/admin-analytics.html` — show count of currently featured listings

### Definition of Done
- Migration applied
- Admin can feature/unfeature a listing
- Featured listings get radar boost + badge in founder dashboard
- Committed and pushed

---

## KAN-026 — Founder Referral / Invite System
**Type:** Feature | **Priority:** Medium | **Story Points:** 5

### User Story
As a founder, I want to invite other founders with a personal referral link, so that I can grow my network and earn platform credits/badges.

### Acceptance Criteria
- **Given** a logged-in founder, **When** they visit their dashboard, **Then** they see a "Invite Founders" section with their unique invite link
- **Given** a new user registers via an invite link, **When** registration succeeds, **Then** the referring founder's invite count increments
- **Given** a founder has 3+ successful invites, **When** their profile is shown, **Then** they receive an "Early Adopter" badge
- **Given** an invite link is used, **When** it's invalid or expired (30 days), **Then** registration proceeds normally without referral credit

### Technical Notes
- **DB migration:** `013_referrals.sql`
  ```sql
  CREATE TABLE referral_codes (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    uses INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE referral_uses (
    id SERIAL PRIMARY KEY,
    referrer_id UUID REFERENCES users(id),
    referee_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- **API:**
  - `GET /api/founders/referral-code` — get or create code for current founder
  - `GET /api/founders/referral-stats` — get invite count + badge status
  - Add `referral_code` query param support in `POST /api/auth/register` — resolves code, inserts referral_use
  - Files: `backend/src/controllers/referralController.js`, add routes to `founders.js`
- **Frontend:**
  - `frontend/founder-dashboard.html` — add "Invite Founders" card: shows link `https://platform.io/auth.html?ref=<code>`, copy button, invite count
  - `frontend/auth.html` — on register, read `?ref=` param and include in POST body
  - Badge: if `stats.uses >= 3`, show "🏅 Early Adopter" badge next to founder name in nav

### Definition of Done
- Referral code generated per founder
- Registration credits referrer on first 3 invites
- Invite link + counter shown in dashboard
- Early Adopter badge renders when threshold met
- Committed and pushed
