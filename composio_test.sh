#!/bin/bash
# Composio Installation Test Script

echo "=== Composio Installation Test ==="

# Check if composio binary exists
if [ -f /sandbox/bin/composio ]; then
    echo "✅ Composio binary found at /sandbox/bin/composio"
else
    echo "❌ Composio binary not found at /sandbox/bin/composio"
    exit 1
fi

# Add to PATH temporarily
export PATH=/sandbox/bin:$PATH

# Check version
echo -n "Testing composio version: "
VERSION=$(composio --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ $VERSION"
else
    echo "❌ Failed to get version"
    exit 1
fi

# Test basic search
echo -n "Testing search functionality: "
SEARCH_RESULT=$(composio search github --limit 1 2>/dev/null | grep -c "results")
if [ $? -eq 0 ] && [ "$SEARCH_RESULT" -gt 0 ]; then
    echo "✅ Search works"
else
    echo "❌ Search failed"
    exit 1
fi

echo ""
echo "=== Installation Summary ==="
echo "Composio installation is ✅ COMPLETE AND FUNCTIONAL"
echo ""
echo "To use composio permanently, add this to your shell profile:"
echo "  export PATH=/sandbox/bin:\$PATH"
echo ""
echo "Quick test command:"
echo "  export PATH=/sandbox/bin:\$PATH && composio search \"github issues\""
echo ""
echo "✅ All tests passed!"