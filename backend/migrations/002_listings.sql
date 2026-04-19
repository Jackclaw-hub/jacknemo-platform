-- Migration 002: Add listings table + extend users
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stage VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS sector VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS geo VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);

CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('equipment','service')),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_role VARCHAR(50) NOT NULL,
  geo VARCHAR(50) NOT NULL,
  city VARCHAR(100),
  tags JSONB DEFAULT '[]',
  stages JSONB DEFAULT '[]',
  sectors JSONB DEFAULT '[]',
  starter_friendly BOOLEAN DEFAULT FALSE,
  hourly_rate NUMERIC(10,2),
  daily_rate NUMERIC(10,2),
  from_price NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
