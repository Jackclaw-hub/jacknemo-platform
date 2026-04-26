/**
 * Scoring v2 Backend Implementation
 * Simple, reliable scoring system for Startup Radar
 */

const express = require('express');
const router = express.Router();

// Mock database - in production this would connect to PostgreSQL
const mockStartups = [
    { id: 1, name: 'TechFlow AI', stage: 'seed', sector: 'AI', score: 85 },
    { id: 2, name: 'GreenEnergy Solutions', stage: 'series-a', sector: 'CleanTech', score: 92 },
    { id: 3, name: 'HealthTrack', stage: 'pre-seed', sector: 'HealthTech', score: 78 }
];

/**
 * GET /api/scoring/v2/startups
 * Get all startups with scoring
 */
router.get('/v2/startups', (req, res) => {
    try {
        res.json({
            success: true,
            count: mockStartups.length,
            startups: mockStartups,
            scoring_version: 'v2',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Scoring v2 error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch startups scoring',
            details: error.message 
        });
    }
});

/**
 * GET /api/scoring/v2/startups/:id
 * Get scoring for specific startup
 */
router.get('/v2/startups/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const startup = mockStartups.find(s => s.id === id);
        
        if (!startup) {
            return res.status(404).json({
                success: false,
                error: 'Startup not found'
            });
        }
        
        // Calculate additional metrics
        const metrics = {
            stage_weight: getStageWeight(startup.stage),
            sector_growth: getSectorGrowth(startup.sector),
            final_score: calculateFinalScore(startup)
        };
        
        res.json({
            success: true,
            startup: {
                ...startup,
                metrics
            }
        });
    } catch (error) {
        console.error('Scoring v2 detail error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch startup scoring',
            details: error.message 
        });
    }
});

/**
 * POST /api/scoring/v2/calculate
 * Calculate scoring for new startup
 */
router.post('/v2/calculate', (req, res) => {
    try {
        const { name, stage, sector, traction, team_strength, market_size } = req.body;
        
        if (!name || !stage || !sector) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, stage, sector'
            });
        }
        
        // Basic scoring algorithm v2
        const baseScore = 50;
        const stageBonus = getStageWeight(stage) * 10;
        const sectorBonus = getSectorGrowth(sector) * 15;
        const tractionBonus = (traction || 0) * 2;
        const teamBonus = (team_strength || 0) * 3;
        const marketBonus = (market_size || 0) * 1;
        
        const finalScore = Math.min(100, Math.max(0, 
            baseScore + stageBonus + sectorBonus + tractionBonus + teamBonus + marketBonus
        ));
        
        const newId = mockStartups.length + 1;
        const startup = {
            id: newId,
            name,
            stage,
            sector,
            score: finalScore,
            calculated_at: new Date().toISOString()
        };
        
        // In production: save to database
        // mockStartups.push(startup);
        
        res.json({
            success: true,
            startup,
            breakdown: {
                base_score: baseScore,
                stage_bonus: stageBonus,
                sector_bonus: sectorBonus,
                traction_bonus: tractionBonus,
                team_bonus: teamBonus,
                market_bonus: marketBonus,
                final_score: finalScore
            }
        });
    } catch (error) {
        console.error('Scoring v2 calculate error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to calculate scoring',
            details: error.message 
        });
    }
});

// Helper functions
function getStageWeight(stage) {
    const weights = {
        'pre-seed': 1.0,
        'seed': 1.5,
        'series-a': 2.0,
        'series-b': 2.5,
        'series-c': 3.0,
        'growth': 3.5
    };
    return weights[stage.toLowerCase()] || 1.0;
}

function getSectorGrowth(sector) {
    const growthRates = {
        'ai': 3.0,
        'cleantech': 2.8,
        'healthtech': 2.5,
        'fintech': 2.3,
        'edtech': 2.0,
        'saas': 1.8,
        'ecommerce': 1.5
    };
    return growthRates[sector.toLowerCase()] || 1.0;
}

function calculateFinalScore(startup) {
    // Enhanced scoring with multiple factors
    const stageWeight = getStageWeight(startup.stage);
    const sectorGrowth = getSectorGrowth(startup.sector);
    
    return Math.min(100, Math.max(0, 
        startup.score * (1 + (stageWeight - 1) * 0.1) * (1 + (sectorGrowth - 1) * 0.05)
    ));
}

module.exports = router;