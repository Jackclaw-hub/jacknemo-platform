#!/usr/bin/env node
/**
 * Fixed Queue Check System for Startup Radar
 * Dynamically checks actual backlog status instead of hardcoded values
 */

const fs = require('fs').promises;
const path = require('path');

class FixedQueueCheck {
    constructor() {
        this.workspacePath = '/sandbox/.openclaw/workspace';
        this.memoryPath = '/sandbox/.openclaw/workspace/memory';
        this.repoPath = '/tmp/jacknemo-platform';
    }

    async run() {
        console.log('🚀 Running fixed queue check system...');
        
        try {
            // Check actual backlog status
            const backlogStatus = await this.checkBacklogStatus();
            
            // Check system health
            const systemStatus = await this.checkSystemHealth();
            
            // Generate accurate report
            const report = await this.generateReport(backlogStatus, systemStatus);
            
            console.log('✅ Fixed queue check completed:');
            console.log(JSON.stringify(report, null, 2));
            
            // Save report
            await this.saveReport(report);
            
            return report;
            
        } catch (error) {
            console.error('❌ Fixed queue check failed:', error.message);
            return { error: error.message, timestamp: new Date().toISOString() };
        }
    }

    async checkBacklogStatus() {
        try {
            // Read the actual backlog file
            const backlogContent = await fs.readFile(
                path.join(this.memoryPath, 'backlog.md'),
                'utf8'
            );
            
            // Parse backlog status
            const lines = backlogContent.split('\n');
            const doneTasks = lines.filter(line => line.includes('DONE')).length;
            const todoTasks = lines.filter(line => line.includes('TODO')).length;
            
            // Extract actual failed tasks from WORKING.md if any
            const workingContent = await fs.readFile(
                path.join(this.workspacePath, 'WORKING.md'),
                'utf8'
            );
            
            const hasFailedTasks = workingContent.includes('❌') || 
                                  workingContent.includes('FAILED');
            
            return {
                totalTasks: doneTasks + todoTasks,
                completedTasks: doneTasks,
                queuedTasks: todoTasks,
                failedTasks: hasFailedTasks ? 1 : 0, // Only count if actually failed
                backlogContent: backlogContent
            };
            
        } catch (error) {
            return {
                totalTasks: 0,
                completedTasks: 0,
                queuedTasks: 0,
                failedTasks: 0,
                error: error.message
            };
        }
    }

    async checkSystemHealth() {
        const status = {
            git: 'unknown',
            composio: 'unknown',
            memory: 'unknown',
            tools: 'unknown'
        };

        // Check git status
        try {
            const gitResult = await this.execCommand('cd /tmp/jacknemo-platform && git status --porcelain');
            status.git = gitResult.stdout.trim() === '' ? 'clean' : 'dirty';
        } catch (error) {
            status.git = 'error: ' + error.message;
        }

        // Check composio status
        try {
            const composioResult = await this.execCommand('export PATH=/sandbox/bin:$PATH && composio whoami');
            status.composio = 'working';
        } catch (error) {
            status.composio = 'error: ' + error.message;
        }

        // Check memory accessibility
        try {
            await fs.access(this.memoryPath);
            status.memory = 'accessible';
        } catch (error) {
            status.memory = 'error: ' + error.message;
        }

        // Check tools availability
        try {
            const toolsResult = await this.execCommand('which git node npm composio');
            status.tools = 'available';
        } catch (error) {
            status.tools = 'error: ' + error.message;
        }

        return status;
    }

    async generateReport(backlogStatus, systemStatus) {
        const timestamp = new Date().toISOString();
        
        return {
            timestamp: timestamp,
            summary: `Accurate Status: ${backlogStatus.queuedTasks} queued, ${backlogStatus.completedTasks} completed, ${backlogStatus.failedTasks} failed`,
            backlog: backlogStatus,
            system: systemStatus,
            isHealthy: backlogStatus.failedTasks === 0 && 
                     !systemStatus.git.includes('error') &&
                     !systemStatus.composio.includes('error'),
            recommendations: this.getRecommendations(backlogStatus, systemStatus)
        };
    }

    getRecommendations(backlogStatus, systemStatus) {
        const recommendations = [];
        
        if (backlogStatus.failedTasks > 0) {
            recommendations.push('Investigate actual failed tasks in WORKING.md');
        }
        
        if (backlogStatus.queuedTasks === 0 && backlogStatus.completedTasks > 0) {
            recommendations.push('All tasks completed! Request new backlog items from Alisia');
        }
        
        if (systemStatus.git.includes('error')) {
            recommendations.push('Fix git repository connection');
        }
        
        if (systemStatus.composio.includes('error')) {
            recommendations.push('Check Composio authentication');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('System healthy - continue development');
        }
        
        return recommendations;
    }

    async saveReport(report) {
        const reportsDir = path.join(this.workspacePath, 'reports');
        await fs.mkdir(reportsDir, { recursive: true });
        
        const reportFile = path.join(reportsDir, `fixed-queue-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    }

    async execCommand(command) {
        const { exec } = require('child_process');
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }
}

// Run if called directly
if (require.main === module) {
    const checker = new FixedQueueCheck();
    checker.run().catch(console.error);
}

module.exports = FixedQueueCheck;