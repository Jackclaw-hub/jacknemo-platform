-- Startup Radar Database Schema
-- PostgreSQL Schema for SaaS Platform with Role-based Authentication

-- Users Table - Core authentication table
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

-- Roles Table - Defines available roles in the system
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissions Table - Role-based permissions system
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, resource, action)
);

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_is_verified ON users(is_verified);
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_permissions_role_resource ON permissions(role_id, resource);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('user', 'Standard application user'),
('manager', 'User with management privileges'),
('admin', 'Administrator with full system access');

-- Insert default permissions for each role
-- Admin permissions (full access)
INSERT INTO permissions (role_id, resource, action) VALUES
(3, 'users', 'create'),
(3, 'users', 'read'),
(3, 'users', 'update'),
(3, 'users', 'delete'),
(3, 'roles', 'create'),
(3, 'roles', 'read'),
(3, 'roles', 'update'),
(3, 'roles', 'delete'),
(3, 'permissions', 'create'),
(3, 'permissions', 'read'),
(3, 'permissions', 'update'),
(3, 'permissions', 'delete');

-- Manager permissions (limited admin access)
INSERT INTO permissions (role_id, resource, action) VALUES
(2, 'users', 'read'),
(2, 'users', 'update'),
(2, 'dashboard', 'read'),
(2, 'reports', 'read');

-- User permissions (basic access)
INSERT INTO permissions (role_id, resource, action) VALUES
(1, 'profile', 'read'),
(1, 'profile', 'update'),
(1, 'dashboard', 'read');

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user authentication and profile information';
COMMENT ON COLUMN users.status IS 'User status: pending, active, suspended, deleted';
COMMENT ON COLUMN users.role IS 'User role: user, manager, admin';
COMMENT ON COLUMN users.email_verification_token IS 'Token for email verification process';
COMMENT ON COLUMN users.reset_password_token IS 'Token for password reset process';
COMMENT ON COLUMN users.reset_password_expires IS 'Expiration time for password reset token';

COMMENT ON TABLE roles IS 'Defines available user roles in the system';
COMMENT ON TABLE permissions IS 'Role-based access control permissions';

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();