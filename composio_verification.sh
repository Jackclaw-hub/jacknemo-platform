#!/bin/bash
# Composio installation verification script

echo "=== Composio Installation Verification ==="
echo "1. Checking if composio binary exists:"
if [ -f "/sandbox/.composio/composio" ]; then
    echo "   ✓ Found at /sandbox/.composio/composio"
    echo "   Version: $(/sandbox/.composio/composio --version)"
else
    echo "   ✗ Not found"
fi

echo ""
echo "2. Checking wrapper script:"
if [ -f "/sandbox/bin/composio" ]; then
    echo "   ✓ Found wrapper at /sandbox/bin/composio"
    cat /sandbox/bin/composio
else
    echo "   ✗ Not found"
fi

echo ""
echo "3. Checking PATH:"
if echo "$PATH" | grep -q "/sandbox/bin"; then
    echo "   ✓ /sandbox/bin is in PATH"
else
    echo "   ✗ /sandbox/bin NOT in PATH"
    echo "   Current PATH: $PATH"
fi

echo ""
echo "4. Testing composio command:"
if command -v composio &> /dev/null; then
    echo "   ✓ 'composio' command is available"
    composio --version
else
    echo "   ✗ 'composio' command not found"
fi

echo ""
echo "5. Testing basic functionality:"
export PATH=/sandbox/bin:$PATH
composio search "github" --limit 1 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ Basic search functionality works"
else
    echo "   ✗ Search functionality failed"
fi

echo ""
echo "=== Verification Complete ==="