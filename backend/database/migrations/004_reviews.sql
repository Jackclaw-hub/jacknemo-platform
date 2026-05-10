CREATE TABLE listing_reviews(
  id SERIAL PRIMARY KEY,
  listing_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  rating SMALLINT CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, reviewer_id)
);