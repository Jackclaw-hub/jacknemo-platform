// Database Integration for Scoring System
// Provides functions to fetch data needed for scoring calculations

const { Pool } = require('pg');

class ScoringDatabase {
    constructor() {
        this.pool = new Pool({
            host: '145.223.81.163',
            port: 5432,
            database: 'jacknemo_dev',
            user: process.env.DB_USER || 'jacknemo_user',
            password: process.env.DB_PASSWORD
        });
    }

    // Get founder profile with all relevant data
    async getFounderProfile(founderId) {
        const query = `
            SELECT 
                u.id, u.email, u.company_name, u.full_name, u.bio,
                u.country, u.city, u.postal_code,
                fp.industry, fp.stage, fp.funding_needs, fp.team_size,
                fp.tech_stack, fp.business_model, fp.target_market,
                fp.preferred_investor_types, fp.urgency_level
            FROM users u
            LEFT JOIN founder_profiles fp ON u.id = fp.user_id
            WHERE u.id = $1 AND u.role = 'founder'
        `;
        
        const result = await this.pool.query(query, [founderId]);
        return result.rows[0] || null;
    }

    // Get funding opportunity details
    async getFundingOpportunity(opportunityId) {
        const query = `
            SELECT 
                fo.id, fo.title, fo.description, fo.amount_min, fo.amount_max,
                fo.equity_offered, fo.investment_type, fo.industry,
                fo.geographic_focus, fo.stage_focus, fo.team_size_focus,
                fo.deadline, fo.application_requirements,
                p.company_name as provider_name, p.country as provider_country,
                p.city as provider_city
            FROM funding_opportunities fo
            LEFT JOIN users p ON fo.provider_id = p.id
            WHERE fo.id = $1
        `;
        
        const result = await this.pool.query(query, [opportunityId]);
        return result.rows[0] || null;
    }

    // Get equipment listing details
    async getEquipmentListing(equipmentId) {
        const query = `
            SELECT 
                el.id, el.title, el.description, el.price_per_day,
                el.price_per_week, el.price_per_month, el.category,
                el.condition, el.availability_status, el.location,
                el.specifications, el.min_rental_period,
                p.company_name as provider_name, p.country as provider_country,
                p.city as provider_city
            FROM equipment_listings el
            LEFT JOIN users p ON el.provider_id = p.id
            WHERE el.id = $1
        `;
        
        const result = await this.pool.query(query, [equipmentId]);
        return result.rows[0] || null;
    }

    // Get service offering details
    async getServiceOffering(serviceId) {
        const query = `
            SELECT 
                so.id, so.title, so.description, so.price_type,
                so.price_fixed, so.price_hourly, so.price_daily,
                so.category, so.expertise_level, so.availability,
                so.delivery_timeframe, so.service_scope,
                p.company_name as provider_name, p.country as provider_country,
                p.city as provider_city
            FROM service_offerings so
            LEFT JOIN users p ON so.provider_id = p.id
            WHERE so.id = $1
        `;
        
        const result = await this.pool.query(query, [serviceId]);
        return result.rows[0] || null;
    }

    // Get match history for a founder (to avoid duplicate recommendations)
    async getFounderMatchHistory(founderId, limit = 50) {
        const query = `
            SELECT 
                opportunity_id, opportunity_type, 
                match_score, created_at, status
            FROM matches
            WHERE founder_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `;
        
        const result = await this.pool.query(query, [founderId, limit]);
        return result.rows;
    }

    // Save match result to database
    async saveMatchResult(matchData) {
        const query = `
            INSERT INTO matches (
                founder_id, opportunity_id, opportunity_type,
                match_score, score_breakdown, status
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `;
        
        const values = [
            matchData.founderId,
            matchData.opportunityId,
            matchData.opportunityType,
            matchData.score,
            JSON.stringify(matchData.breakdown),
            matchData.status || 'pending'
        ];
        
        const result = await this.pool.query(query, values);
        return result.rows[0]?.id;
    }

    // Close database connection
    async close() {
        await this.pool.end();
    }
}

module.exports = ScoringDatabase;