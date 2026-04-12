-- Database Initialization Script for JackNemo Platform
-- Executed when PostgreSQL connectivity is restored
-- Connection: postgresql://jackuser:jackdb_secure_2026@145.223.81.163:5432/jacknemo_dev

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if exist (for clean initialization)
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, resource, action)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'System administrator with full access'),
('manager', 'Team manager with limited admin rights'),
('user', 'Standard platform user');

-- Insert default permissions
INSERT INTO permissions (role_id, resource, action) VALUES
-- Admin permissions
((SELECT id FROM roles WHERE name = 'admin'), 'users', 'read'),
((SELECT id FROM roles WHERE name = 'admin'), 'users', 'write'),
((SELECT id FROM roles WHERE name = 'admin'), 'users', 'delete'),
((SELECT id FROM roles WHERE name = 'admin'), 'roles', 'read'),
((SELECT id FROM roles WHERE name = 'admin'), 'roles', 'write'),
((SELECT id FROM roles WHERE name = 'admin'), 'roles', 'delete'),
((SELECT id FROM roles WHERE name = 'admin'), 'permissions', 'read'),
((SELECT id FROM roles WHERE name = 'admin'), 'permissions', 'write'),
((SELECT id FROM roles WHERE name = 'admin'), 'permissions', 'delete'),
((SELECT id FROM roles WHERE name = 'admin'), 'environments', 'read'),
((SELECT id FROM roles WHERE name = 'admin'), 'environments', 'write'),
((SELECT id => roles WHERE name = 'admin'), 'environments', 'delete'),
((SELECT id FROM roles WHERE name = 'admin'), 'system', 'read'),
((SELECT id FROM roles WHERE name = 'admin'), 'system', 'write'),

-- Manager permissions
((SELECT id FROM roles WHERE name = 'manager'), 'users', 'read'),
((SELECT id FROM roles WHERE name = 'manager'), 'users', 'write'),
((SELECT id FROM roles WHERE name = 'manager'), 'roles', 'read'),
((SELECT id FROM roles WHERE name = 'manager'), 'environments', 'read'),
((SELECT id FROM roles WHERE name = 'manager'), 'environments', 'write'),

-- User permissions
((SELECT id FROM roles WHERE name = 'user'), 'environments', 'read'),
((SELECT id FROM roles WHERE name = 'user'), 'profile', 'read'),
((SELECT id FROM roles WHERE name = 'user'), 'profile', 'write');

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_permissions_role ON permissions(role_id);
CREATE INDEX idx_permissions_resource ON permissions(resource);
