const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const router = express.Router();

/**
 * API endpoint to score funding opportunities
 * This calls the Python scoring system as a subprocess
 */
router.post('/score', async (req, res) => {
    try {
        const { userQuery, opportunities } = req.body;
        
        if (!userQuery) {
            return res.status(400).json({ error: 'userQuery is required' });
        }

        // Prepare data for Python script
        const scoringData = {
            user_query: userQuery,
            opportunities: opportunities || []
        };

        // Call Python scoring script
        const pythonScript = path.join(__dirname, '../../scoring_demo.js');
        
        exec(`python3 ${pythonScript} '${JSON.stringify(scoringData)}'`, 
            (error, stdout, stderr) => {
                if (error) {
                    console.error('Python scoring error:', error);
                    return res.status(500).json({ 
                        error: 'Scoring failed', 
                        details: stderr 
                    });
                }

                try {
                    const results = JSON.parse(stdout);
                    res.json(results);
                } catch (parseError) {
                    console.error('Parse error:', parseError);
                    res.status(500).json({ 
                        error: 'Invalid scoring response',
                        output: stdout 
                    });
                }
            }
        );

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'scoring-api',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;