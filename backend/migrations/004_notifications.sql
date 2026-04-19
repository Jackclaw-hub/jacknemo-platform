CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50),
  subject VARCHAR(255),
  body TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);
