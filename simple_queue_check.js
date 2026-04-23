#!/usr/bin/env node
/**
 * Simple Queue Check - Zero Dependencies
 * Runs safely and reliably from anywhere
 */

const fs = require('fs').promises;
const path = require('path');

async function checkQueue() {
    const report = {
        timestamp: new Date().toISOString(),
        success: true,
        queuedTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        pendingQueue: [],
        failedTasksList: [],
        recommendations: [],
        scriptLocation: __dirname
    };

    try {
        // 1. Check WORKING.md in current workspace
        const workingPath = path.join(__dirname, 'WORKING.md');
        console.log(`Looking for WORKING.md at: ${workingPath}`);
        
        try {
            const content = await fs.readFile(workingPath, 'utf8');
            
            // Simple parsing - no complex regex
            const completedMatch = content.includes('✅ COMPLETED');
            const failedMatch = content.match(/❌/g);
            
            report.completedTasks = completedMatch ? 1 : 0;
            report.failedTasks = failedMatch ? failedMatch.length : 0;
            
        } catch (err) {
            console.log(`Could not read WORKING.md: ${err.message}`);
        }

        // 2. Check if we can access typical directories
        const dirs = [
            '/sandbox/.openclaw/workspace',
            '/sandbox/.openclaw-data/workspace',
            __dirname
        ];
        
        for (const dir of dirs) {
            try {
                await fs.access(dir);
                report.accessiblePaths = report.accessiblePaths || [];
                report.accessiblePaths.push(dir);
            } catch (err) {
                // Ignore - just testing accessibility
            }
        }

        // 3. Check if there are any active tasks based on files
        try {
            const files = await fs.readdir(__dirname);
            const taskFiles = files.filter(f => f.includes('task') || f.includes('TODO') || f.includes('WORK'));
            report.pendingQueue = taskFiles;
        } catch (err) {
            report.pendingQueue = ['Unable to read directory'];
        }

        // 4. Generate recommendations if needed
        if (report.failedTasks > 0) {
            report.recommendations.push(`Fix ${report.failedTasks} failed task(s)`);
        }
        if (!report.accessiblePaths || report.accessiblePaths.length === 0) {
            report.recommendations.push('Check workspace directory permissions');
        }

    } catch (error) {
        report.success = false;
        report.error = error.message;
        report.errorStack = error.stack;
    }

    // Always return JSON - even on error
    console.log(JSON.stringify(report, null, 2));
    return report;
}

// Self-executing wrapper
(async () => {
    try {
        const result = await checkQueue();
        process.exit(result.success ? 0 : 1);
    } catch (finalError) {
        console.error('FATAL:', finalError.message);
        process.exit(1);
    }
})();