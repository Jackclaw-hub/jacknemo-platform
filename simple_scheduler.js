#!/usr/bin/env node
/**
 * Simple Scheduler for Fixed Reminder System
 * Runs the reminder every 30 minutes without relying on cron gateway
 */

const { exec } = require('child_process');
const fs = require('fs').promises;

class SimpleScheduler {
    constructor() {
        this.intervalMinutes = 30;
        this.reminderScript = '/sandbox/.openclaw/workspace/fixed_reminder_system.js';
        this.logPath = '/sandbox/.openclaw/workspace/logs/scheduler.log';
    }

    async run() {
        console.log(`⏰ Starting simple scheduler (every ${this.intervalMinutes} minutes)`);
        
        // Run immediately
        await this.runReminder();
        
        // Then schedule periodically
        setInterval(() => {
            this.runReminder();
        }, this.intervalMinutes * 60 * 1000);
    }

    async runReminder() {
        const timestamp = new Date().toISOString();
        console.log(`🔄 Running reminder at ${timestamp}`);
        
        try {
            await this.logEvent(`START: Running fixed reminder at ${timestamp}`);
            
            const result = await this.execCommand(`cd /sandbox/.openclaw/workspace && node ${this.reminderScript}`);
            
            await this.logEvent(`SUCCESS: Reminder completed at ${timestamp}`);
            console.log('✅ Reminder executed successfully');
            
        } catch (error) {
            await this.logEvent(`ERROR: Reminder failed at ${timestamp}: ${error.message}`);
            console.error('❌ Reminder failed:', error.message);
        }
    }

    async execCommand(command) {
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

    async logEvent(message) {
        try {
            await fs.mkdir('/sandbox/.openclaw/workspace/logs', { recursive: true });
            const logMessage = `[${new Date().toISOString()}] ${message}\n`;
            await fs.appendFile(this.logPath, logMessage);
        } catch (error) {
            console.error('Could not log event:', error.message);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const scheduler = new SimpleScheduler();
    scheduler.run().catch(console.error);
}

module.exports = SimpleScheduler;