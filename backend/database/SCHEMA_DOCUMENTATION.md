# Startup Radar Database Schema Documentation

## 📋 Overview

This PostgreSQL schema implements the complete data model for the Startup Radar platform, supporting three main resource types:
- **Funding Opportunities** - Investment and grant opportunities
- **Equipment Listings** - Physical equipment available for startups
- **Service Offerings** - Professional services for startups

## 🗂️ Table Structure

### Core Tables

#### `users`
Extended user table with comprehensive profile information:
- Authentication fields (email, password_hash, role)
- Profile information (company_name, full_name, phone, website, bio)
- Location data (country, city, postal_code)
- Verification status and platform activity tracking
- Timestamps for creation and updates

#### `funding_opportunities`
Investment and grant opportunities:
- Basic info (title, description, amount ranges)
- Funding type and stage classification
- Investor information and requirements
- Industry focus and location constraints
- Application deadlines and contact info

#### `equipment_listings`
Physical equipment available:
- Equipment details and specifications
- Pricing information and availability
- Location and delivery options
- Condition and media (images)
- Verification and featured status

#### `service_offerings`
Professional services:
- Service details and categorization
- Expertise and experience levels
- Pricing models and rates
- Service area and availability
- Portfolio and case studies

### Relationship & Interaction Tables

#### `matches`
Connections between founders and providers:
- Match scoring algorithm results
- Status tracking (pending, accepted, rejected, completed)
- Message exchange capabilities
- Timestamps for all interactions

#### `user_favorites`
User bookmarking system:
- Favorite items across all resource types
- Unique constraints to prevent duplicates

#### `reviews`
Rating and review system:
- User-to-user reviews
- Context-specific ratings (funding, equipment, services)
- Verification and visibility controls

## 🎯 Key Features

### 1. UUID Primary Keys
All tables use UUID primary keys with `gen_random_uuid()` for:
- Better security than sequential IDs
- Distributed system compatibility
- No enumeration vulnerabilities

### 2. Comprehensive Indexing
Performance-optimized indexes for:
- Search and filtering operations
- Location-based queries
- Category and type filtering
- Status and availability checks

### 3. Data Validation
PostgreSQL constraints for data integrity:
- Check constraints for enumerated values
- Foreign key relationships
- Unique constraints where appropriate
- Array types for flexible categorization

### 4. Automatic Timestamps
Triggers for automatic `updated_at` management:
- Consistent timestamp updates across all tables
- No manual timestamp management required

### 5. Flexible Data Types
- **Arrays** for multiple categories/industries
- **Decimal** for precise monetary values
- **Text** for unlimited description lengths
- **Boolean** for status flags

## 🚀 Usage Examples

### Query Funding Opportunities
```sql
-- Find seed funding in Berlin
SELECT title, amount_min, amount_max, investor_name
FROM funding_opportunities 
WHERE funding_type = 'venture_capital' 
  AND stage = 'seed'
  AND 'Berlin' = ANY(location_requirements)
  AND is_active = TRUE;
```

### Search Equipment by Location
```sql
-- Find available equipment in Berlin with delivery
SELECT title, price, condition, location_city
FROM equipment_listings
WHERE location_country = 'Germany'
  AND (location_city = 'Berlin' OR can_deliver = TRUE)
  AND is_available = TRUE
ORDER BY price;
```

### Find Service Providers
```sql
-- Find legal services available remotely
SELECT title, rate, expertise_area, experience_years
FROM service_offerings
WHERE service_type = 'legal'
  AND can_work_remotely = TRUE
  AND is_available = TRUE;
```

### User Match History
```sql
-- Get match history for a founder
SELECT m.match_score, m.status, m.created_at,
       p.company_name as provider_name,
       CASE m.resource_type 
           WHEN 'funding' THEN f.title
           WHEN 'equipment' THEN e.title
           WHEN 'service' THEN s.title
       END as resource_title
FROM matches m
JOIN users p ON m.provider_id = p.id
LEFT JOIN funding_opportunities f ON m.resource_type = 'funding' AND m.resource_id = f.id
LEFT JOIN equipment_listings e ON m.resource_type = 'equipment' AND m.resource_id = e.id
LEFT JOIN service_offerings s ON m.resource_type = 'service' AND m.resource_id = s.id
WHERE m.founder_id = 'user-uuid-here'
ORDER BY m.created_at DESC;
```

## 🔧 Installation

### 1. Create Database
```bash
createdb startup_radar
```

### 2. Apply Schema
```bash
psql -d startup_radar -f catalog_schema.sql
```

### 3. Load Sample Data
```bash
psql -d startup_radar -f seed_data.sql
```

### 4. Verify Installation
```sql
-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count records in each table
SELECT 'users' as table, COUNT(*) FROM users
UNION ALL SELECT 'funding_opportunities', COUNT(*) FROM funding_opportunities
UNION ALL SELECT 'equipment_listings', COUNT(*) FROM equipment_listings
UNION ALL SELECT 'service_offerings', COUNT(*) FROM service_offerings
UNION ALL SELECT 'matches', COUNT(*) FROM matches
UNION ALL SELECT 'user_favorites', COUNT(*) FROM user_favorites
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews;
```

## 📊 Performance Considerations

### Indexing Strategy
- All foreign keys are indexed
- Common search fields are indexed
- Composite indexes for frequent query patterns
- Partial indexes for status-based queries

### Query Optimization
- Use `EXPLAIN ANALYZE` for slow queries
- Consider materialized views for complex aggregations
- Monitor query performance with pg_stat_statements

### Scaling Considerations
- Table partitioning for large datasets
- Read replicas for heavy read workloads
- Connection pooling for high concurrency

## 🔐 Security Features

### Data Protection
- UUIDs prevent ID enumeration
- No sensitive data in URLs
- Proper access control through application layer

### SQL Injection Prevention
- Use parameterized queries
- Validate all user input
- Limit database user permissions

## 📈 Monitoring

### Key Metrics to Monitor
- Query response times
- Connection pool usage
- Disk I/O performance
- Cache hit ratios

### Alerting Thresholds
- Slow query threshold: 100ms
- Connection usage: 80% of pool
- Disk space: 85% utilization

## 🛠️ Maintenance

### Routine Tasks
- Vacuum和分析 tables regularly
- Update statistics with ANALYZE
- Monitor index bloat
- Backup strategy implementation

### Migration Strategy
- Use schema migration tools
- Test all migrations in staging
- Maintain rollback capabilities

---

**Schema Version:** 1.0.0  
**Last Updated:** 2026-04-12  
**Maintainer:** Jack (Developer Agent)