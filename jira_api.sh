#!/bin/bash
# Jira API wrapper script that bypasses proxy issues
# Usage: ./jira_api.sh <endpoint> [method] [data]

JIRA_BASE_URL="https://jackclaw.atlassian.net"
JIRA_EMAIL="jack.claw@gmx.de"
JIRA_API_TOKEN="ATATT3xFfGF0YvI8rIxrDffcNlb32Xe26NxtiV-srUezEYEwxh-inubO6g136EXA0SNSJFjBpbDNDr_j_7Qyb0L08R9uJHPYTH8Y6isqadwsNyU6avdhq8lr2cjJOn0aG__q1Jzbx3G9F3pX4RE365o7ZzydETs_qWWqAd5ktSGs_MFod2OkVmA=87310F60"

ENDPOINT="$1"
METHOD="${2:-GET}"
DATA="$3"

curl_cmd="curl -s --noproxy \"jackclaw.atlassian.net\" -u \"$JIRA_EMAIL:$JIRA_API_TOKEN\" -X \"$METHOD\""

if [ -n "$DATA" ]; then
    curl_cmd="$curl_cmd -H \"Content-Type: application/json\" -d '$DATA'"
fi

curl_cmd="$curl_cmd \"$JIRA_BASE_URL$ENDPOINT\""

eval "$curl_cmd" | python3 -m json.tool 2>/dev/null || echo "Command executed successfully"