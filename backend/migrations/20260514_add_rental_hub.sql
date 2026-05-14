ALTER TABLE listings ADD COLUMN IF NOT EXISTS rental_price_per_day DECIMAL(10,2), ADD COLUMN IF NOT EXISTS rental_available BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS rental_category VARCHAR(20) CHECK (rental_category IN ('video','audio','film','photo'));
CREATE TABLE IF NOT EXISTS rentals (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  renter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','returned')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);