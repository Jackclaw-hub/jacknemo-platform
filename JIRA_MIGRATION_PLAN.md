# JIRA Migration Plan - Startup Radar

## Current State (2026-04-12)

### Active Tracking System
- **Backlog Location**: `/sandbox/.openclaw-data/workspace/memory/backlog.md`
- **Status**: Manual markdown-based tracking
- **Collaboration**: MCP Bridge to Alisia (curl commands)
- **GitHub Repo**: https://github.com/Jackclaw-hub/jacknemo-platform

### Current Sprint (Sprint 0 - Prototype Polish)
| ID | Title | Owner | Status |
|----|-------|-------|--------|
| SR-001 | Push existing prototype files to GitHub repo | Jack | DONE |
| SR-002 | Audit index.html UX + copyedit role-selection cards | Jack | DONE |
| SR-003 | Founder radar: fix score display + empty-state message | Jack | IN PROGRESS |
| SR-004 | Supply forms: add field validation + draft count badge | Jack | TODO |
| SR-005 | Admin: add status badges to tables (verified/pending/flagged) | Jack | TODO |
| SR-006 | Expand mock data.js: 10 funding + 10 equipment + 10 services entries | Jack | DONE |
| SR-007 | Write acceptance criteria for SR-001 → SR-006 | Alisia | IN PROGRESS |

## JIRA Integration Requirements

### 1. Credentials Needed
```bash
# JIRA Instance Configuration
export JIRA_URL="https://your-company.atlassian.net"
export JIRA_PROJECT_KEY="SR"

# Authentication
export JIRA_USER_EMAIL="your-email@company.com"
export JIRA_API_TOKEN="your-api-token"
```

### 2. OpenClaw Configuration
Need to configure in OpenClaw:
- JIRA API integration settings
- Webhook setup for status updates
- Authentication mechanism

### 3. Migration Steps
1. **Phase 1**: JIRA Project Setup
   - Create SR project in JIRA
   - Define issue types (Task, Bug, Story, Epic)
   - Set up workflows

2. **Phase 2**: Data Migration  
   - Export current backlog from `backlog.md`
   - Import into JIRA
   - Map statuses (TODO → To Do, IN PROGRESS → In Progress, etc.)

3. **Phase 3**: Integration Setup
   - Configure OpenClaw ↔ JIRA sync
   - Set up automated status updates
   - Test webhook notifications

## Immediate Action Items

1. **From Ahmad**: Provide JIRA credentials and project details
2. **From Team**: Pause current backlog updates until JIRA migration
3. **Documentation**: Update all references from backlog.md to JIRA

## Risk Assessment

- **Risk**: Data inconsistency during migration
- **Mitigation**: Maintain backup of `backlog.md` until JIRA fully operational
- **Timeline**: 2-3 days for full migration after credentials provided

## Contact Information

- **Jack**: Working on prototype tasks via current system
- **Alisia**: Writing acceptance criteria via MCP Bridge
- **Ahmad**: Decision maker for JIRA setup

---
*This document created 2026-04-12 as requested by Ahmad Saad*
*Last updated: 2026-04-12*