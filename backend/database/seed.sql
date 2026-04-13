-- Insert sample admin user (password: admin123)
INSERT INTO users (email, password_hash, role, name) VALUES
('admin@startupradar.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Platform Admin');

-- Insert sample founder user (password: founder123)
INSERT INTO users (email, password_hash, role, name) VALUES
('founder@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'founder', 'Jane Founder');

-- Insert sample equipment provider user (password: equipment123)
INSERT INTO users (email, password_hash, role, name) VALUES
('equipment@hub.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'equipment_provider', 'Tech Hub Berlin');

-- Insert sample service provider user (password: service123)
INSERT INTO users (email, password_hash, role, name) VALUES
('service@agency.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'service_provider', 'Design Agency GmbH');