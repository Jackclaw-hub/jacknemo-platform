-- ============================================================
-- jacknemo-platform — full migration script
-- Safe to run multiple times (IF NOT EXISTS throughout)
-- ============================================================

-- ---- USERS: missing columns ----
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;

-- ---- LISTINGS: missing columns ----
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS renewable_after TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;

-- ---- NOTIFICATIONS: missing columns ----
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ---- MESSAGES: normalise column name ----
-- messages already has is_read; add read alias via view is complex, keep is_read
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- ---- PROVIDER PROFILES: missing columns ----
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS verification_status VARCHAR(32);
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS verification_reason TEXT;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS social_links JSONB;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS availability_blocked JSONB;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 0;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- ---- FOUNDER PROFILES: missing columns ----
ALTER TABLE founder_profiles ADD COLUMN IF NOT EXISTS display_name VARCHAR(128);
ALTER TABLE founder_profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32);

-- ---- PROVIDER RATINGS: missing columns ----
ALTER TABLE provider_ratings ADD COLUMN IF NOT EXISTS comment TEXT;

-- ---- SAVED LISTINGS (bookmarks) ----
CREATE TABLE IF NOT EXISTS saved_listings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  collection_id INTEGER,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- ---- BOOKMARK COLLECTIONS ----
CREATE TABLE IF NOT EXISTS bookmark_collections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(128) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- FOUNDER RECENT VIEWS ----
CREATE TABLE IF NOT EXISTS founder_recent_views (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  title VARCHAR(255),
  type VARCHAR(64),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- ---- SEARCH LOGS ----
CREATE TABLE IF NOT EXISTS search_logs (
  id SERIAL PRIMARY KEY,
  query VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- LISTING HISTORY (status changelog) ----
CREATE TABLE IF NOT EXISTS listing_history (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  changed_by INTEGER,
  old_status VARCHAR(32),
  new_status VARCHAR(32),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- MESSAGE TEMPLATES ----
CREATE TABLE IF NOT EXISTS message_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(128) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- LISTING REPORTS ----
CREATE TABLE IF NOT EXISTS listing_reports (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  reporter_id INTEGER,
  reason TEXT,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE listing_reports ADD COLUMN IF NOT EXISTS dismissed BOOLEAN DEFAULT FALSE;

-- ---- PASSWORD RESETS ----
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- PAYMENTS ----
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  listing_id INTEGER,
  stripe_session_id VARCHAR(255) UNIQUE,
  stripe_payment_intent VARCHAR(255),
  amount INTEGER,
  currency VARCHAR(8) DEFAULT 'eur',
  status VARCHAR(32) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- FOUNDER NOTES ----
CREATE TABLE IF NOT EXISTS founder_notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- ---- VIEW DEDUP TRACKING ----
CREATE TABLE IF NOT EXISTS listing_views (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  ip_hash VARCHAR(64),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- SAVED SEARCHES ----
CREATE TABLE IF NOT EXISTS saved_searches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(128) NOT NULL,
  filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- FOUNDER MATCH HISTORY (radar interactions) ----
CREATE TABLE IF NOT EXISTS founder_match_history (
  id SERIAL PRIMARY KEY,
  founder_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  score NUMERIC(5,4),
  action VARCHAR(32),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- REFERRAL CODES ----
CREATE TABLE IF NOT EXISTS referral_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  code VARCHAR(32) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- REFERRAL USES ----
CREATE TABLE IF NOT EXISTS referral_uses (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL,
  new_user_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- LISTING STATUS HISTORY ----
CREATE TABLE IF NOT EXISTS listing_status_history (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  changed_by INTEGER,
  old_status VARCHAR(32),
  new_status VARCHAR(32),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- PROVIDER RATINGS: ensure conflict constraint exists ----
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_ratings_provider_id_founder_id_key'
  ) THEN
    ALTER TABLE provider_ratings ADD CONSTRAINT provider_ratings_provider_id_founder_id_key
      UNIQUE (provider_id, founder_id);
  END IF;
END $$;

SELECT 'Migration complete' AS status;
