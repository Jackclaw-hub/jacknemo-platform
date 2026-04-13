/**
 * Simple HTTP API for Startup Radar
 * Zero-dependencies version
 */

const http = require('http');
const url = require('url');
const LocalScoringService = require('./services/local_scoring_service');

const scoringService = new LocalScoringService();
const PORT = 3001;

/**
 * Simple HTTP server with JSON responses
 */
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Set JSON content type
    res.setHeader('Content-Type', 'application/json');
    
    try {
        // Health check
        if (parsedUrl.pathname === '/api/health' && req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({
                status: 'ok',
                service: 'startup-radar-api',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }));
            return;
        }
        
        // Scoring endpoint
        if (parsedUrl.pathname === '/api/scoring' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    const { userQuery, limit = 5 } = JSON.parse(body);
                    
                    if (!userQuery) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: 'userQuery is required' }));
                        return;
                    }
                    
                    const results = await scoringService.getScoredOpportunities(userQuery, limit);
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        success: true,
                        results,
                        count: results.length
                    }));
                    
                } catch (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ 
                        error: 'Invalid JSON or processing error',
                        message: error.message 
                    }));
                }
            });
            return;
        }
        
        // Get funding opportunities
        if (parsedUrl.pathname === '/api/opportunities' && req.method === 'GET') {
            const data = await scoringService.loadMockData();
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                opportunities: data.funding_opportunities || [],
                count: (data.funding_opportunities || []).length
            }));
            return;
        }
        
        // 404 for other routes
        res.writeHead(404);
        res.end(JSON.stringify({
            error: 'Route not found',
            path: parsedUrl.pathname
        }));
        
    } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Startup Radar API running on port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`📊 Scoring: POST http://localhost:${PORT}/api/scoring`);
    console.log(`💰 Opportunities: GET http://localhost:${PORT}/api/opportunities`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
});