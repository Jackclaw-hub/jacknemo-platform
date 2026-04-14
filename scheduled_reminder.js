#!/usr/bin/env node
/**
 * Scheduled Reminder System for OpenClaw
 * Runs queue checks and reports status
 */

const fs = require('fs').promises;
const path = require('path');

class ScheduledReminder {
    constructor() {
        this.workspacePath = '/sandbox/.openclaw/workspace';
        this.memoryPath = '/sandbox/.openclaw/workspace/memory';
    }

    async run() {
        console.log('⏰ Running scheduled reminder check...');
        
        try {
            const status = await this.checkQueueStatus();
            const report = await this.generateReport(status);
            
            console.log('✅ Reminder check completed:');
            console.log(JSON.stringify(report, null, 2));
            
            // Save report for future reference
            await this.saveReport(report);
            
            return report;
            
        } catch (error) {
            console.error('❌ Reminder check failed:', error.message);
            return { error: error.message, timestamp: new Date().toISOString() };
        }
    }

    async checkQueueStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            queuedTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            pendingQueue: [],
            failedTasksList: [],
            gitStatus: 'unknown',
            composioStatus: 'unknown'
        };

        // Check actual task status from WORKING.md
        try {
            const workingContent = await fs.readFile(path.join(this.workspacePath, 'WORKING.md'), 'utf8');
            const completedMatch = workingContent.match(/✅ COMPLETED.*?(\d+)/s);
            if (completedMatch) {
                status.completedTasks = parseInt(completedMatch[1]) || 0;
            }
            
            // Check for any actual failed tasks (not just hardcoded ones)
            const failedTasks = workingContent.match(/❌.*?failed/gi);
            status.failedTasks = failedTasks ? failedTasks.length : 0;
            
        } catch (error) {
            console.log('Could not read WORKING.md:', error.message);
        }

        // Check git status
        try {
            const gitResult = await this.execCommand('cd /tmp/jacknemo-platform && git status --porcelain');
            status.gitStatus = gitResult.stdout.trim() === '' ? 'clean' : 'dirty';
        } catch (error) {
            status.gitStatus = 'error: ' + error.message;
        }

        // Check composio status
        try {
            const composioResult = await this.execCommand('export PATH=/sandbox/bin:$PATH && composio whoami');
            status.composioStatus = 'working';
        } catch (error) {
            status.composioStatus = 'error: ' + error.message;
        }

        return status;
    }

    async generateReport(status) {
        return {
            timestamp: status.timestamp,
            summary: `Queue Status: ${status.queuedTasks} queued, ${status.completedTasks} completed, ${status.failedTasks} failed`,
            details: {
                git: status.gitStatus,
                composio: status.composioStatus,
                pending_tasks: status.pendingQueue,
                failed_tasks: status.failedTasksList
            },
            recommendations: this.getRecommendations(status)
        };
    }

    getRecommendations(status) {
        const recommendations = [];
        
        if (status.failedTasks > 0) {
            recommendations.push('Address failed tasks with concrete fixes');
            recommendations.push('Break large tasks into smaller deliverables');
        }
        
        if (status.gitStatus.includes('error')) {
            recommendations.push('Fix git repository connection');
        }
        
        if (status.composioStatus.includes('error')) {
            recommendations.push('Check Composio authentication');
        }
        
        return recommendations;
    }

    async saveReport(report) {
        const reportsDir = path.join(this.workspacePath, 'reports');
        await fs.mkdir(reportsDir, { recursive: true });
        
        const reportFile = path.join(reportsDir, `reminder-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
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
    const reminder = new ScheduledReminder();
    reminder.run().catch(console.error);
}

module.exports = ScheduledReminder;