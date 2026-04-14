#!/usr/bin/env python3
"""
Jira API Client for NemoClaw agents
Provides easy access to Jira API without proxy issues
"""

import os
import json
import subprocess

class JiraClient:
    def __init__(self):
        self.base_url = os.environ.get('JIRA_BASE_URL', 'https://jackclaw.atlassian.net')
        self.email = os.environ.get('JIRA_EMAIL', 'jack.claw@gmx.de')
        self.api_token = os.environ.get('JIRA_API_TOKEN')
        
    def call_api(self, endpoint, method="GET", data=None):
        """Call Jira API with proper proxy bypass"""
        cmd = [
            'curl', '-s', '--noproxy', 'jackclaw.atlassian.net',
            '-u', f'{self.email}:{self.api_token}',
            '-X', method
        ]
        
        if data:
            cmd.extend(['-H', 'Content-Type: application/json', '-d', json.dumps(data)])
        
        cmd.append(f"{self.base_url}{endpoint}")
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            if result.stdout.strip():
                return json.loads(result.stdout)
            return {"status": "success", "message": "Command executed successfully"}
        except subprocess.CalledProcessError as e:
            return {"error": f"Command failed: {e.stderr}"}
        except json.JSONDecodeError:
            return {"raw_output": result.stdout}
    
    def create_issue(self, project_key, summary, description, issue_type="Task"):
        """Create a new Jira issue"""
        data = {
            "fields": {
                "project": {"key": project_key},
                "summary": summary,
                "issuetype": {"name": issue_type},
                "description": description
            }
        }
        return self.call_api("/rest/api/2/issue", "POST", data)
    
    def get_issue(self, issue_key):
        """Get issue details"""
        return self.call_api(f"/rest/api/2/issue/{issue_key}")
    
    def search_issues(self, jql):
        """Search issues using JQL"""
        return self.call_api(f"/rest/api/2/search?jql={jql}")

# Example usage
if __name__ == "__main__":
    client = JiraClient()
    
    # Test connection
    print("Testing Jira connection:")
    result = client.call_api("/rest/api/2/serverInfo")
    print(f"Server: {result.get('serverTitle', 'Unknown')}")
    print(f"Version: {result.get('version', 'Unknown')}")
    
    # Test creating an issue
    print("\nTesting issue creation:")
    issue = client.create_issue(
        project_key="KAN",
        summary="Test from Python Client",
        description="Testing Jira API connectivity from Python client",
        issue_type="Task"
    )
    print(f"Created issue: {issue.get('key', 'Unknown')}")