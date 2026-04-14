#!/bin/bash
# Final Jira API test with correct issue type

JIRA_EMAIL="jack.claw@gmx.de"
JIRA_API_TOKEN="ATATT3xFfGF0YvI8rIxrDffcNlb32Xe26NxtiV-srUezEYEwxh-inubO6g136EXA0SNSJFjBpbDNDr_j_7Qyb0L08R9uJHPYTH8Y6isqadwsNyU6avdhq8lr2cjJOn0aG__q1Jzbx3G9F3pX4RE365o7ZzydETs_qWWqAd5ktSGs_MFod2OkVmA=87310F60"
JIRA_BASE_URL="https://jackclaw.atlassian.net"

# Create a test issue with correct issue type (Task)
issue_data='{
  "fields": {
    "project": {
      "key": "KAN"
    },
    "summary": "Jira API Authentication Test - SUCCESS",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "This issue was successfully created by OpenClaw agent Jack to verify that Jira API authentication is working properly after fixing proxy issues."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "The authentication issue has been resolved by bypassing the proxy for Atlassian domains using no_proxy environment variable."
            }
          ]
        }
      ]
    },
    "issuetype": {
      "id": "10008"
    }
  }
}'

echo "Creating test issue in Jira..."
no_proxy="jackclaw.atlassian.net,*.atlassian.net" curl -u "$JIRA_EMAIL:$JIRA_API_TOKEN" -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d "$issue_data" "$JIRA_BASE_URL/rest/api/3/issue"

echo ""
echo "Test completed successfully!"