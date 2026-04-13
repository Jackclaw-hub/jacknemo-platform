-- Startup Radar Seed Data
-- Comprehensive sample data for development and testing

-- ========== USERS ==========

-- Admin users
INSERT INTO users (email, password_hash, role, company_name, full_name, phone, website, bio, country, city, is_verified) VALUES
('admin@startupradar.com', '$2b$10$N4c3NzU0cGFzc3dvcmQh.QeJz5Y2VjYWNoZXM=', 'admin', 'Startup Radar', 'System Admin', '+49 123 456789', 'https://startupradar.com', 'Platform administrator overseeing all operations', 'Germany', 'Berlin', TRUE),
('support@startupradar.com', '$2b$10$N4c3NzU0cGFzc3dvcmQh.QeJz5Y2VjYWNoZXM=', 'admin', 'Startup Radar', 'Support Team', '+49 123 456780', 'https://startupradar.com', 'Customer support and user assistance', 'Germany', 'Berlin', TRUE);

-- Founders (startup entrepreneurs)
INSERT INTO users (email, password_hash, role, company_name, full_name, phone, website, bio, country, city, is_verified) VALUES
('founder1@techstart.com', '$2b$10$N4c3NzU0cGFzc3dvcmQh.QeJz5Y2VjYWNoZXM=', 'founder', 'TechGenius GmbH', 'Max Mustermann', '+49 30 1234567', 'https://techgenius.de', 'Building the next generation of AI-powered productivity tools', 'Germany', 'Berlin', TRUE),
('founder2@greeninnovate.com', '$2b$10$N4c3NzU0cGFzc3dvcmQh.QeJz5Y2VjYWNoZXM=', 'founder', 'GreenInnovate AG', 'Anna Schmidt', '+49 40 9876543', 'https://greeninnovate.com', 'Sustainable technology solutions for urban environments', 'Germany', 'Hamburg', TRUE),
('founder3@healthtech.io', '$2b$10$N4c3NzU0cGFzc3dvcmQh.QeJz5Y2VjYWNoZXM=', 'founder', 'HealthTech Solutions', 'Thomas Weber', '+49 69 5551234', 'https://healthtech.io', 'Revolutionizing healthcare with telemedicine platforms', 'Germany', 'Frankfurt', TRUE),
('founder4@fintechstart.com', '$2b$10$N4c3NzU0cGFzc3dvcmQh.QeJz5Y2VjYWNoZXM=', 'founder', 'FinTech Pioneers', 'Sarah Müller', '+49 89 7778888', 'https://fintechpioneers.com', 'Blockchain-based financial services for SMEs', 'Germany', 'Munich', TRUE);

-- Equipment Providers
INSERT INTO users (email, password_hash, role, company_name, full_name, phone, website, bio, country, city, is_verified) VALUES
('equipment@techsupply.de', '$2b$10$N4c3NzU0cGFzc3dvcmQh.QeJz5Y2VjYWNoZXM=', 'equipment_provider', 'TechSupply GmbH', 'Robert Bauer', '+49 30 5556677', 'https://techsupply.de', 'Premium IT equipment and office technology solutions', 'Germany', 'Berlin', TRUE),
('sales@officeequip.com', '$2b$10$N4c3NzU0cGFzc3dvcmQh.QeJz5Y2VjYWNoZXM=', 'equipment_provider', 'Office Equipment Experts', 'Julia Fischer', '+49 40 3334444', 'https://officeequip.com', 'Everything you need for a modern office space', 'Germany', 'Hamburg', TRUE),
('info@labgear.de', '$2b$10$N4c3NzU0cGFzc3dvcmQh.QeJz5Y2VjYWNoZXM=', 'equipment_provider', 'LabGear Technologies', 'Michael Hoffmann', '+49 69 8889999', 'https://labgear.de', 'Specialized laboratory and research equipment', 'Germany', 'Frankfurt', TRUE);

-- Service Providers
INSERT INTO users (email, password_hash, role, company_name, full_name, phone, website, bio, country, city, is_verified) VALUES
('service@legaltech.de', '$2b$10$N4c3NzU0cGFzc3dvcmQh.QeJz5Y2VjYWNoZXM=', 'service_provider', 'LegalTech Advisors', 'Dr. Lisa Schulz', '+49 30 2223333', 'https://legaltech.de', 'Legal services specializing in startup formation and IP protection', 'Germany', 'Berlin', TRUE),
('consulting@marketwise.com', '$2b$10$N4c3NzU0cGFzc3dvcmQh.QeJz5Y2VjYWNoZXM=', 'service_provider', 'MarketWise Consulting', 'Daniel Klein', '+49 40 6667777', 'https://marketwise.com', 'Market research and business strategy consulting', 'Germany', 'Hamburg', TRUE),
('dev@codecraft.io', '$2b$10$N4c3NzU0cGFzc3dvcmQh.QeJz5Y2VjYWNoZXM=', 'service_provider', 'CodeCraft Development', 'Markus Wagner', '+49 69 4445555', 'https://codecraft.io', 'Software development and technical consulting services', 'Germany', 'Frankfurt', TRUE);

-- ========== FUNDING OPPORTUNITIES ==========

INSERT INTO funding_opportunities (title, description, amount_min, amount_max, currency, funding_type, stage, investor_name, investor_type, industry_focus, location_requirements, team_size_min, team_size_max, is_active, application_deadline, contact_email, created_by) VALUES
('Seed Funding for Tech Startups', 'Early-stage funding for innovative technology startups with strong growth potential', 50000.00, 250000.00, 'EUR', 'venture_capital', 'seed', 'BerlinTech Ventures', 'vc', '{"technology", "software", "ai"}', '{"Germany", "Berlin"}', 2, 10, TRUE, '2026-06-30 23:59:59+00', 'apply@berlintech.vc', (SELECT id FROM users WHERE email = 'admin@startupradar.com')),

('Green Innovation Grant', 'Government grant for sustainable and environmentally friendly technology solutions', 100000.00, 500000.00, 'EUR', 'grant', 'seed', 'Federal Ministry for the Environment', 'government', '{"sustainability", "cleantech", "renewable_energy"}', '{"Germany"}', 3, 15, TRUE, '2026-07-15 23:59:59+00', 'grants@bmu.de', (SELECT id FROM users WHERE email = 'admin@startupradar.com')),

('Series A - HealthTech Focus', 'Series A funding for established HealthTech companies with proven traction', 1000000.00, 5000000.00, 'EUR', 'venture_capital', 'series_a', 'HealthInvest Partners', 'vc', '{"healthcare", "telemedicine", "digital_health"}', '{"Europe"}', 10, 50, TRUE, '2026-08-31 23:59:59+00', 'investment@healthinvest.com', (SELECT id FROM users WHERE email = 'admin@startupradar.com')),

('Angel Investment - FinTech', 'Angel investment for early-stage FinTech startups with innovative solutions', 25000.00, 100000.00, 'EUR', 'angel_investment', 'seed', 'FinTech Angels Network', 'angel', '{"fintech", "blockchain", "financial_services"}', '{"Germany", "UK", "Netherlands"}', 1, 8, TRUE, '2026-09-30 23:59:59+00', 'hello@fintechangels.com', (SELECT id FROM users WHERE email = 'admin@startupradar.com'));

-- ========== EQUIPMENT LISTINGS ==========

INSERT INTO equipment_listings (title, description, equipment_type, category, brand, model, condition, manufacturing_year, price, currency, price_type, quantity, is_available, location_country, location_city, can_deliver, delivery_radius, image_urls, created_by) VALUES
('MacBook Pro M2 - 16"', '2023 MacBook Pro with M2 Pro chip, 16GB RAM, 1TB SSD. Perfect for development work.', 'computer', 'laptop', 'Apple', 'MacBook Pro 16" M2', 'excellent', 2023, 2200.00, 'EUR', 'fixed', 3, TRUE, 'Germany', 'Berlin', TRUE, 100, '{"https://example.com/macbook1.jpg", "https://example.com/macbook2.jpg"}', (SELECT id FROM users WHERE email = 'equipment@techsupply.de')),

('Professional 3D Printer', 'Ultimaker S5 Pro Bundle with air filtration and material station. Ideal for prototyping.', '3d_printer', 'manufacturing', 'Ultimaker', 'S5 Pro Bundle', 'like_new', 2022, 8500.00, 'EUR', 'negotiable', 1, TRUE, 'Germany', 'Hamburg', TRUE, 200, '{"https://example.com/3dprinter1.jpg", "https://example.com/3dprinter2.jpg"}', (SELECT id FROM users WHERE email = 'sales@officeequip.com')),

('Laboratory Microscope', 'Olympus BX53 research microscope with multiple objectives and camera attachment.', 'microscope', 'lab_equipment', 'Olympus', 'BX53', 'good', 2021, 12500.00, 'EUR', 'fixed', 1, TRUE, 'Germany', 'Frankfurt', TRUE, 150, '{"https://example.com/microscope1.jpg"}', (SELECT id FROM users WHERE email = 'info@labgear.de')),

('Office Furniture Set', 'Complete office setup: 6 standing desks, 12 ergonomic chairs, meeting table.', 'furniture', 'office', 'Herman Miller', 'Aeron Chair + UpDesk', 'excellent', 2023, 8500.00, 'EUR', 'negotiable', 1, TRUE, 'Germany', 'Berlin', TRUE, 50, '{"https://example.com/office1.jpg", "https://example.com/office2.jpg"}', (SELECT id FROM users WHERE email = 'sales@officeequip.com'));

-- ========== SERVICE OFFERINGS ==========

INSERT INTO service_offerings (title, description, service_type, category, expertise_area, experience_years, certifications, pricing_model, rate, currency, is_available, service_country, service_city, can_work_remotely, can_travel, travel_radius, portfolio_urls, created_by) VALUES
('Legal Advisory for Startups', 'Comprehensive legal services including company formation, contracts, and intellectual property protection.', 'legal', 'consulting', 'startup_law', 12, '{"German Bar Association", "IP Law Specialist"}', 'hourly', 180.00, 'EUR', TRUE, 'Germany', 'Berlin', TRUE, TRUE, 100, '{"https://legaltech.de/portfolio"}', (SELECT id FROM users WHERE email = 'service@legaltech.de')),

('Market Research & Strategy', 'In-depth market analysis, competitor research, and business strategy development for new market entry.', 'consulting', 'market_research', 'market_analysis', 8, '{"Market Research Professional", "Business Strategy"}', 'project', 5000.00, 'EUR', TRUE, 'Germany', 'Hamburg', TRUE, TRUE, 300, '{"https://marketwise.com/cases", "https://marketwise.com/reports"}', (SELECT id FROM users WHERE email = 'consulting@marketwise.com')),

('Software Development Team', 'Full-stack development services including web applications, mobile apps, and cloud infrastructure.', 'development', 'software', 'full_stack_development', 10, '{"AWS Certified", "Google Cloud Professional"}', 'daily', 800.00, 'EUR', TRUE, 'Germany', 'Frankfurt', TRUE, FALSE, 0, '{"https://codecraft.io/projects", "https://codecraft.io/github"}', (SELECT id FROM users WHERE email = 'dev@codecraft.io')),

('UI/UX Design Services', 'User interface and experience design for web and mobile applications, including prototyping and testing.', 'design', 'ui_ux', 'user_experience_design', 6, '{"Adobe Certified Expert", "User Research Specialist"}', 'project', 3500.00, 'EUR', TRUE, 'Germany', 'Berlin', TRUE, TRUE, 150, '{"https://codecraft.io/design-portfolio"}', (SELECT id FROM users WHERE email = 'dev@codecraft.io'));

-- ========== SAMPLE MATCHES ==========

INSERT INTO matches (founder_id, provider_id, resource_type, resource_id, match_score, match_reasons, status, founder_message) VALUES
((SELECT id FROM users WHERE email = 'founder1@techstart.com'), 
 (SELECT id FROM users WHERE email = 'equipment@techsupply.de'), 
 'equipment', 
 (SELECT id FROM equipment_listings WHERE title LIKE '%MacBook Pro%'), 
 92.5, 
 '{"location_match", "equipment_type_match", "budget_alignment"}', 
 'pending', 
 'Looking for reliable development machines for our growing team.'),

((SELECT id FROM users WHERE email = 'founder2@greeninnovate.com'), 
 (SELECT id FROM users WHERE email = 'service@legaltech.de'), 
 'service', 
 (SELECT id FROM service_offerings WHERE title LIKE '%Legal Advisory%'), 
 88.0, 
 '{"industry_expertise", "location_proximity", "service_need_match"}', 
 'accepted', 
 'Need assistance with patent filing and company structure optimization.');

-- ========== SAMPLE FAVORITES ==========

INSERT INTO user_favorites (user_id, item_type, item_id) VALUES
((SELECT id FROM users WHERE email = 'founder1@techstart.com'), 
 'funding', 
 (SELECT id FROM funding_opportunities WHERE title LIKE '%Seed Funding%')),

((SELECT id FROM users WHERE email = 'founder3@healthtech.io'), 
 'equipment', 
 (SELECT id FROM equipment_listings WHERE title LIKE '%Microscope%')),

((SELECT id FROM users WHERE email = 'founder4@fintechstart.com'), 
 'service', 
 (SELECT id FROM service_offerings WHERE title LIKE '%Software Development%'));

-- ========== VALIDATION ==========

DO $$
BEGIN
    -- Count inserted records
    RAISE NOTICE '✅ Inserted % users', (SELECT COUNT(*) FROM users);
    RAISE NOTICE '✅ Inserted % funding opportunities', (SELECT COUNT(*) FROM funding_opportunities);
    RAISE NOTICE '✅ Inserted % equipment listings', (SELECT COUNT(*) FROM equipment_listings);
    RAISE NOTICE '✅ Inserted % service offerings', (SELECT COUNT(*) FROM service_offerings);
    RAISE NOTICE '✅ Inserted % matches', (SELECT COUNT(*) FROM matches);
    RAISE NOTICE '✅ Inserted % favorites', (SELECT COUNT(*) FROM user_favorites);
    
    RAISE NOTICE '🎉 Startup Radar seed data loaded successfully!';
END $$;