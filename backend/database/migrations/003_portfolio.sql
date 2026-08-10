-- K-184: Provider portfolio / case study section
CREATE TABLE IF NOT EXISTS provider_portfolio (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  link VARCHAR(500),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_provider ON provider_portfolio(provider_id, position);
