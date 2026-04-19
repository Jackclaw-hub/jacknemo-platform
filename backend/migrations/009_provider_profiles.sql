-- Migration 009: Provider profiles
CREATE TABLE IF NOT EXISTS provider_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200),
  description TEXT,
  website VARCHAR(500),
  contact_email VARCHAR(200),
  logo_url VARCHAR(500),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
