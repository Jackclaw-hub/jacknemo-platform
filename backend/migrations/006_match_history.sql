CREATE TABLE IF NOT EXISTS founder_match_history (
  id SERIAL PRIMARY KEY,
  founder_id UUID REFERENCES users(id),
  listing_id INTEGER REFERENCES listings(id),
  score NUMERIC(4,3),
  action VARCHAR(20) DEFAULT 'viewed',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(founder_id, listing_id, action)
);
