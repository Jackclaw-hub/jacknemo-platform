-- Migration 010: Provider star ratings from founders
CREATE TABLE IF NOT EXISTS provider_ratings (
  id SERIAL PRIMARY KEY,
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  founder_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, founder_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_provider ON provider_ratings(provider_id);
