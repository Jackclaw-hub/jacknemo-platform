-- Startup Radar Catalog Schema
-- PostgreSQL database schema for Startup Radar platform
-- Includes tables for funding, equipment, services, and user profiles

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== CORE USER TABLES ==========

-- Users table (extended from authentication schema)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('founder', 'equipment_provider', 'service_provider', 'admin')),
    
    -- Profile information
    company_name VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    bio TEXT,
    
    -- Location information
    country VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Verification status
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    
    -- Platform status
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========== FUNDING OPPORTUNITIES ==========

CREATE TABLE funding_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount_min DECIMAL(15, 2),
    amount_max DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Funding type
    funding_type VARCHAR(100) NOT NULL,
    stage VARCHAR(100), -- seed, series_a, series_b, etc
    
    -- Investor information
    investor_name VARCHAR(255) NOT NULL,
    investor_type VARCHAR(100), -- vc, angel, corporate, government
    
    -- Requirements
    industry_focus TEXT[], -- Array of industries
    location_requirements TEXT[], -- Array of location requirements
    team_size_min INTEGER,
    team_size_max INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    application_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Contact information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    application_url VARCHAR(500),
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========== EQUIPMENT LISTINGS ==========

CREATE TABLE equipment_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Equipment details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    equipment_type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    
    -- Specifications
    brand VARCHAR(100),
    model VARCHAR(100),
    condition VARCHAR(50) CHECK (condition IN ('new', 'like_new', 'excellent', 'good', 'fair')),
    manufacturing_year INTEGER,
    
    -- Pricing
    price DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    price_type VARCHAR(50) CHECK (price_type IN ('fixed', 'negotiable', 'auction')),
    
    -- Availability
    quantity INTEGER DEFAULT 1,
    is_available BOOLEAN DEFAULT TRUE,
    availability_date TIMESTAMP WITH TIME ZONE,
    
    -- Location
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    can_deliver BOOLEAN DEFAULT FALSE,
    delivery_radius INTEGER, -- in kilometers
    
    -- Media
    image_urls TEXT[], -- Array of image URLs
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========== SERVICE OFFERINGS ==========

CREATE TABLE service_offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Service details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    
    -- Expertise
    expertise_area VARCHAR(100),
    experience_years INTEGER,
    certifications TEXT[], -- Array of certifications
    
    -- Pricing
    pricing_model VARCHAR(50) CHECK (pricing_model IN ('hourly', 'daily', 'project', 'retainer')),
    rate DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    availability_schedule TEXT, -- Free-form availability description
    response_time_hours INTEGER,
    
    -- Service area
    service_country VARCHAR(100),
    service_city VARCHAR(100),
    can_work_remotely BOOLEAN DEFAULT FALSE,
    can_travel BOOLEAN DEFAULT FALSE,
    travel_radius INTEGER, -- in kilometers
    
    -- Portfolio
    portfolio_urls TEXT[], -- Array of portfolio URLs
    case_studies TEXT[], -- Array of case study descriptions
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========== MATCHING & INTERACTIONS ==========

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Match details
    founder_id UUID NOT NULL REFERENCES users(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    
    -- Resource being matched
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('funding', 'equipment', 'service')),
    resource_id UUID NOT NULL, -- References funding_opportunities.id, equipment_listings.id, or service_offerings.id
    
    -- Match scoring
    match_score DECIMAL(5, 2) NOT NULL, -- 0-100 score
    match_reasons TEXT[], -- Array of matching reasons
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    
    -- Interaction
    founder_message TEXT,
    provider_response TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Favorite item
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('funding', 'equipment', 'service')),
    item_id UUID NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique favorites
    UNIQUE(user_id, item_type, item_id)
);

-- ========== REVIEWS & RATINGS ==========

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Review details
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewed_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Review context
    context_type VARCHAR(50) CHECK (context_type IN ('funding', 'equipment', 'service')),
    context_id UUID,
    
    -- Rating
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========== INDEXES FOR PERFORMANCE ==========

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_is_verified ON users(is_verified);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Funding indexes
CREATE INDEX idx_funding_type ON funding_opportunities(funding_type);
CREATE INDEX idx_funding_stage ON funding_opportunities(stage);
CREATE INDEX idx_funding_investor_type ON funding_opportunities(investor_type);
CREATE INDEX idx_funding_is_active ON funding_opportunities(is_active);
CREATE INDEX idx_funding_created_by ON funding_opportunities(created_by);
CREATE INDEX idx_funding_deadline ON funding_opportunities(application_deadline);

-- Equipment indexes
CREATE INDEX idx_equipment_type ON equipment_listings(equipment_type);
CREATE INDEX idx_equipment_category ON equipment_listings(category);
CREATE INDEX idx_equipment_condition ON equipment_listings(condition);
CREATE INDEX idx_equipment_price ON equipment_listings(price);
CREATE INDEX idx_equipment_location_country ON equipment_listings(location_country);
CREATE INDEX idx_equipment_location_city ON equipment_listings(location_city);
CREATE INDEX idx_equipment_is_available ON equipment_listings(is_available);
CREATE INDEX idx_equipment_created_by ON equipment_listings(created_by);

-- Service indexes
CREATE INDEX idx_service_type ON service_offerings(service_type);
CREATE INDEX idx_service_category ON service_offerings(category);
CREATE INDEX idx_service_pricing_model ON service_offerings(pricing_model);
CREATE INDEX idx_service_location_country ON service_offerings(service_country);
CREATE INDEX idx_service_location_city ON service_offerings(service_city);
CREATE INDEX idx_service_is_available ON service_offerings(is_available);
CREATE INDEX idx_service_created_by ON service_offerings(created_by);

-- Match indexes
CREATE INDEX idx_match_founder ON matches(founder_id);
CREATE INDEX idx_match_provider ON matches(provider_id);
CREATE INDEX idx_match_resource_type ON matches(resource_type, resource_id);
CREATE INDEX idx_match_status ON matches(status);
CREATE INDEX idx_match_score ON matches(match_score);

-- Favorite indexes
CREATE INDEX idx_favorite_user ON user_favorites(user_id);
CREATE INDEX idx_favorite_item ON user_favorites(item_type, item_id);

-- Review indexes
CREATE INDEX idx_review_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_review_reviewed ON reviews(reviewed_user_id);
CREATE INDEX idx_review_rating ON reviews(rating);
CREATE INDEX idx_review_context ON reviews(context_type, context_id);

-- ========== UPDATE TRIGGERS ==========

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for all tables with updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funding_updated_at 
    BEFORE UPDATE ON funding_opportunities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at 
    BEFORE UPDATE ON equipment_listings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_updated_at 
    BEFORE UPDATE ON service_offerings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========== SEED DATA ==========

-- Insert sample roles for reference
INSERT INTO users (email, password_hash, role, company_name, full_name, is_verified) VALUES
('admin@startupradar.com', '$2b$10$examplehash', 'admin', 'Startup Radar', 'System Administrator', TRUE),
('founder1@example.com', '$2b$10$examplehash', 'founder', 'Tech Startup GmbH', 'Max Mustermann', TRUE),
('equipment1@example.com', '$2b$10$examplehash', 'equipment_provider', 'Equipment Pro GmbH', 'Anna Schmidt', TRUE),
('service1@example.com', '$2b$10$examplehash', 'service_provider', 'Service Excellence AG', 'Thomas Weber', TRUE);

-- Note: The actual password hashes will be generated by the authentication system

COMMENT ON SCHEMA public IS 'Startup Radar Platform Database Schema';
COMMENT ON TABLE users IS 'Platform users with extended profile information';
COMMENT ON TABLE funding_opportunities IS 'Funding opportunities from investors and grants';
COMMENT ON TABLE equipment_listings IS 'Equipment available for startups to acquire';
COMMENT ON TABLE service_offerings IS 'Professional services offered to startups';
COMMENT ON TABLE matches IS 'Matches between founders and providers with scoring';
COMMENT ON TABLE user_favorites IS 'User favorite items for quick access';
COMMENT ON TABLE reviews IS 'User reviews and ratings system';

-- ========== SCHEMA VALIDATION ==========

-- Validate that all tables were created successfully
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
        RAISE NOTICE '✅ Users table created successfully';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'funding_opportunities') THEN
        RAISE NOTICE '✅ Funding opportunities table created successfully';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'equipment_listings') THEN
        RAISE NOTICE '✅ Equipment listings table created successfully';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'service_offerings') THEN
        RAISE NOTICE '✅ Service offerings table created successfully';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'matches') THEN
        RAISE NOTICE '✅ Matches table created successfully';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_favorites') THEN
        RAISE NOTICE '✅ User favorites table created successfully';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'reviews') THEN
        RAISE NOTICE '✅ Reviews table created successfully';
    END IF;
    
    RAISE NOTICE '🎉 Startup Radar database schema created successfully!';
END $$;