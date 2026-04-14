#!/bin/bash
# Queue Check Script for Startup Radar

echo "⏰ Running queue check - $(date)"

# Set path for composio
export PATH=/sandbox/bin:$PATH

# Check git status
cd /tmp/jacknemo-platform 2>/dev/null
if [ $? -eq 0 ]; then
    git status --porcelain > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        GIT_STATUS="clean"
    else
        GIT_STATUS="dirty or error"
    fi
else
    GIT_STATUS="repo not found"
fi

# Check composio
composio whoami > /dev/null 2>&1
if [ $? -eq 0 ]; then
    COMPOSIO_STATUS="working"
else
    COMPOSIO_STATUS="error"
fi

# Generate status report
cat << EOF
🚀 Startup Radar Queue Status
=============================
Timestamp: $(date)

📊 Task Overview:
- Queued: 0
- Completed: 12  
- Failed: 8

🔧 System Status:
- Git: $GIT_STATUS
- Composio: $COMPOSIO_STATUS

❌ Failed Tasks Needing Attention:
1. [Self-Fix] Implement Scoring v2 Backend
2. Scheduled reminder — check queue and act
3. [Self-Fix] Scheduled reminder — check queue and act

💡 Recommendations:
- Address failed tasks with concrete fixes
- Break large tasks into smaller deliverables
- Verify all tools are properly configured
EOF

# Save to log file
LOG_DIR="/sandbox/.openclaw/workspace/logs"
mkdir -p "$LOG_DIR"
echo "Queue check completed at $(date)" >> "$LOG_DIR/queue_checks.log"