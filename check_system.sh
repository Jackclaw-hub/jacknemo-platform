#!/bin/bash
# Simple System Check - No Dependencies
# Always returns valid JSON even on error

echo '{'
echo '  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",'
echo '  "script": "check_system.sh",'
echo '  "workspace": "'$(pwd)'",'

# Check if WORKING.md exists
if [ -f "WORKING.md" ]; then
    echo '  "working_md_exists": true,'
    
    # Count COMPLETED markers
    COMPLETED_COUNT=$(grep -c "✅ COMPLETED" WORKING.md || echo 0)
    echo '  "completed_count": '$COMPLETED_COUNT','
    
    # Count FAILED markers
    FAILED_COUNT=$(grep -c "❌" WORKING.md || echo 0)
    echo '  "failed_count": '$FAILED_COUNT','
else
    echo '  "working_md_exists": false,'
    echo '  "completed_count": 0,'
    echo '  "failed_count": 0,'
fi

# Check for any .md files that might be tasks
echo '  "task_files": ['
find . -maxdepth 1 -name "*.md" -type f | head -5 | while read -r file; do
    echo '    "'$(basename "$file")'",'
done
echo '    "..."'
echo '  ],'

# Check directory accessibility
echo '  "accessible_dirs": ['
[ -d "/sandbox/.openclaw/workspace" ] && echo '    "/sandbox/.openclaw/workspace",'
[ -d "/sandbox/.openclaw-data/workspace" ] && echo '    "/sandbox/.openclaw-data/workspace",'
[ -d "/tmp/jacknemo-platform" ] && echo '    "/tmp/jacknemo-platform",'
echo '    "..."'
echo '  ],'

echo '  "status": "healthy"'
echo '}'