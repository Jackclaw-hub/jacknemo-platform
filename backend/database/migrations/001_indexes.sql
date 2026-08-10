-- Performance indexes for jacknemo-platform (K-178)

-- Listings: most-queried columns
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_provider_id ON listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC);

-- Full-text search on title + description
CREATE INDEX IF NOT EXISTS idx_listings_fts
  ON listings USING GIN(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

-- Messages: thread pagination
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id, created_at);

-- Users: login + role checks
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
