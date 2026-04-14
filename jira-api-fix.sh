#!/bin/bash
# Jira API wrapper script that bypasses proxy for Atlassian domains

JIRA_EMAIL="jack.claw@gmx.de"
JIRA_API_TOKEN="ATATT3xFfGF0YvI8rIxrDffcNlb32Xe26NxtiV-srUezEYEwxh-inubO6g136EXA0SNSJFjBpbDNDr_j_7Qyb0L08R9uJHPYTH8Y6isqadwsNyU6avdhq8lr2cjJOn0aG__q1Jzbx3G9F3pX4RE365o7ZzydETs_qWWqAd5ktSGs_MFod2OkVmA=87310F60"
JIRA_BASE_URL="https://jackclaw.atlassian.net"

# Function to call Jira API with proper proxy bypass
jira_api_call() {
    local endpoint="$1"
    local method="${2:-GET}"
    local data="$3"
    
    # Build curl command with proxy bypass for Atlassian domains
    local curl_cmd="curl --noproxy '*.atlassian.net,*.atlassian.com'"
    curl_cmd+=" -u '$JIRA_EMAIL:$JIRA_API_TOKEN'"
    curl_cmd+=" -X $method"
    curl_cmd+=" -H 'Accept: application/json'"
    curl_cmd+=" -H 'Content-Type: application/json'"
    
    if [ -n "$data" ]; then
        curl_cmd+=" -d '$data'"
    fi
    
    curl_cmd+=" '$JIRA_BASE_URL/rest/api/3/$endpoint'"
    
    # Execute the command
    eval "$curl_cmd"
}

# Test the connection
echo "Testing Jira API connection..."
jira_api_call "myself"

echo ""
echo "Testing project access..."
jira_api_call "project"

echo ""
echo "Jira API connection test completed."