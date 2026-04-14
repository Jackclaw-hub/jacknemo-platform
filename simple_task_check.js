#!/usr/bin/env node
/**
 * Simple Task Check - Lightweight version for OpenClaw cron jobs
 * Avoids external API calls that cause timeouts
 */

const fs = require('fs').promises;
const path = require('path');

class SimpleTaskCheck {
    constructor() {
        this.workspacePath = '/sandbox/.openclaw/workspace';
        this.repoPath = '/tmp/jacknemo-platform';
    }

    async run() {
        console.log('🔍 Running simple task check...');
        
        try {
            const status = await this.checkLocalStatus();
            const report = this.generateReport(status);
            
            console.log('✅ Task check completed:');
            console.log(JSON.stringify(report, null, 2));
            
            return report;
            
        } catch (error) {
            console.error('❌ Task check failed:', error.message);
            return { 
                error: error.message, 
                timestamp: new Date().toISOString(),
                recommendation: 'Use simpler local checks only'
            };
        }
    }

    async checkLocalStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            gitLocalStatus: 'unknown',
            workingMdStatus: 'unknown',
            hasLocalChanges: false,
            lastCommitMessage: 'unknown',
            recommendation: 'No action needed'
        };

        // Check git status locally only (no external calls)
        try {
            const gitStatus = await this.execCommand(`cd ${this.repoPath} && git status --porcelain`);
            status.gitLocalStatus = gitStatus.stdout.trim() === '' ? 'clean' : 'dirty';
            status.hasLocalChanges = gitStatus.stdout.trim() !== '';
        } catch (error) {
            status.gitLocalStatus = 'error: ' + error.message;
        }

        // Check WORKING.md status
        try {
            const workingContent = await fs.readFile(path.join(this.workspacePath, 'WORKING.md'), 'utf8');
            status.workingMdStatus = 'healthy';
            
            // Extract last completed task
            const completedMatch = workingContent.match(/✅.*?COMPLETED.*?(\d+)/s);
            if (completedMatch) {
                status.completedTasks = parseInt(completedMatch[1]) || 0;
            }
            
            // Check for any actual failed mentions
            const failedMentions = workingContent.match(/❌|failed|error/gi);
            status.hasFailures = !!failedMentions;
            
        } catch (error) {
            status.workingMdStatus = 'error: ' + error.message;
        }

        // Get last commit message
        try {
            const lastCommit = await this.execCommand(`cd ${this.repoPath} && git log -1 --pretty=%B`);
            status.lastCommitMessage = lastCommit.stdout.trim();
        } catch (error) {
            status.lastCommitMessage = 'error: ' + error.message;
        }

        return status;
    }

    generateReport(status) {
        return {
            timestamp: status.timestamp,
            summary: `Local Status: Git ${status.gitLocalStatus}, WORKING.md ${status.workingMdStatus}`,
            details: {
                has_local_changes: status.hasLocalChanges,
                has_failures: status.hasFailures,
                last_commit: status.lastCommitMessage,
                completed_tasks: status.completedTasks || 0
            },
            recommendation: status.recommendation
        };
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
    const checker = new SimpleTaskCheck();
    checker.run().catch(console.error);
}

module.exports = SimpleTaskCheck;