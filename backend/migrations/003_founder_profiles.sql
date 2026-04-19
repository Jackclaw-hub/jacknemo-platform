CREATE TABLE IF NOT EXISTS founder_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id),
  company_name VARCHAR(255),
  stage VARCHAR(50),
  sector VARCHAR(50),
  city VARCHAR(100),
  geo VARCHAR(50),
  team_size INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
