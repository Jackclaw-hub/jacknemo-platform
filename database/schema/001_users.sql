-- Users Table Schema
-- Core authentication table for Startup Radar SaaS Platform

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    email_verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_is_verified ON users(is_verified);

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user authentication and profile information';
COMMENT ON COLUMN users.status IS 'User status: pending, active, suspended, deleted';
COMMENT ON COLUMN users.role IS 'User role: user, manager, admin';
COMMENT ON COLUMN users.email_verification_token IS 'Token for email verification process';
COMMENT ON COLUMN users.reset_password_token IS 'Token for password reset process';
COMMENT ON COLUMN users.reset_password_expires IS 'Expiration time for password reset token';