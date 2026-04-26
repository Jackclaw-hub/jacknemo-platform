/**
 * Scoring v2 Backend Tests
 */

const request = require('supertest');
const app = require('../src/server');

describe('Scoring v2 API', () => {
    test('GET /api/scoring/v2/startups returns list of startups', async () => {
        const response = await request(app)
            .get('/api/scoring/v2/startups')
            .expect('Content-Type', /json/)
            .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.scoring_version).toBe('v2');
        expect(Array.isArray(response.body.startups)).toBe(true);
        expect(response.body.startups.length).toBeGreaterThan(0);
        
        // Check startup structure
        const startup = response.body.startups[0];
        expect(startup).toHaveProperty('id');
        expect(startup).toHaveProperty('name');
        expect(startup).toHaveProperty('stage');
        expect(startup).toHaveProperty('sector');
        expect(startup).toHaveProperty('score');
    });
    
    test('GET /api/scoring/v2/startups/:id returns specific startup', async () => {
        const response = await request(app)
            .get('/api/scoring/v2/startups/1')
            .expect('Content-Type', /json/)
            .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.startup).toHaveProperty('id', 1);
        expect(response.body.startup).toHaveProperty('metrics');
        expect(response.body.startup.metrics).toHaveProperty('final_score');
    });
    
    test('GET /api/scoring/v2/startups/:id returns 404 for non-existent startup', async () => {
        const response = await request(app)
            .get('/api/scoring/v2/startups/999')
            .expect('Content-Type', /json/)
            .expect(404);
        
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Startup not found');
    });
    
    test('POST /api/scoring/v2/calculate returns scoring breakdown', async () => {
        const startupData = {
            name: 'Test Startup',
            stage: 'seed',
            sector: 'AI',
            traction: 3,
            team_strength: 4,
            market_size: 5
        };
        
        const response = await request(app)
            .post('/api/scoring/v2/calculate')
            .send(startupData)
            .expect('Content-Type', /json/)
            .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.startup).toHaveProperty('name', 'Test Startup');
        expect(response.body.startup).toHaveProperty('stage', 'seed');
        expect(response.body.startup).toHaveProperty('sector', 'AI');
        expect(response.body.startup).toHaveProperty('score');
        expect(response.body.startup.score).toBeGreaterThanOrEqual(0);
        expect(response.body.startup.score).toBeLessThanOrEqual(100);
        
        expect(response.body.breakdown).toHaveProperty('base_score', 50);
        expect(response.body.breakdown).toHaveProperty('stage_bonus');
        expect(response.body.breakdown).toHaveProperty('sector_bonus');
        expect(response.body.breakdown).toHaveProperty('traction_bonus');
        expect(response.body.breakdown).toHaveProperty('team_bonus');
        expect(response.body.breakdown).toHaveProperty('market_bonus');
        expect(response.body.breakdown).toHaveProperty('final_score');
    });
    
    test('POST /api/scoring/v2/calculate returns 400 for missing required fields', async () => {
        const response = await request(app)
            .post('/api/scoring/v2/calculate')
            .send({ name: 'Test' })
            .expect('Content-Type', /json/)
            .expect(400);
        
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Missing required fields');
    });
    
    test('Health endpoint works', async () => {
        const response = await request(app)
            .get('/health')
            .expect('Content-Type', /json/)
            .expect(200);
        
        expect(response.body.status).toBe('healthy');
        expect(response.body.service).toBe('startup-radar-backend');
        expect(response.body.scoring_version).toBe('v2');
    });
});

console.log('✅ All scoring v2 backend tests written successfully');
console.log('Run with: npm test -- tests/scoring.test.js');