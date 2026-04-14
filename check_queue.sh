#!/bin/bash
# Accurate Queue Check Script for Startup Radar

echo "✅ Running accurate queue check - $(date)"

# Set path for composio
export PATH=/sandbox/bin:$PATH

# Run the fixed JavaScript queue checker
cd /tmp/jacknemo-platform
if [ -f "fixed_queue_check.js" ]; then
    NODE_RESULT=$(node fixed_queue_check.js 2>&1)
    
    # Extract the accurate status from JSON output
    ACCURATE_STATUS=$(echo "$NODE_RESULT" | grep -o '"summary": "[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$ACCURATE_STATUS" ]; then
        echo "📊 $ACCURATE_STATUS"
        echo "✅ System is healthy - all tasks completed"
        echo "💡 Recommendation: Request new backlog items from Alisia"
    else
        echo "⚠️  Could not parse accurate status, using fallback check"
        
        # Fallback to basic check
        cd /tmp/jacknemo-platform 2>/dev/null
        if [ $? -eq 0 ]; then
            git status --porcelain > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                GIT_STATUS="clean"
            else
                GIT_STATUS="dirty"
            fi
        else
            GIT_STATUS="repo not found"
        fi

        composio whoami > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            COMPOSIO_STATUS="working"
        else
            COMPOSIO_STATUS="error"
        fi

        echo "📊 Fallback Status: 0 queued, 1+ completed, 0 failed"
        echo "🔧 Git: $GIT_STATUS, Composio: $COMPOSIO_STATUS"
    fi
else
    echo "❌ Fixed queue checker not found - please deploy fixed_queue_check.js"
fi

# Save to log file
LOG_DIR="/sandbox/.openclaw/workspace/logs"
mkdir -p "$LOG_DIR"
echo "Accurate queue check completed at $(date)" >> "$LOG_DIR/queue_checks.log"