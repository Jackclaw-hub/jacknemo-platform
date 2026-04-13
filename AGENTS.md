# AGENTS.md – Operating Rules

## 🔄 Session Startup
1. Read SOUL.md – Load identity
2. Read WORKING.md – Current task
3. Read memory/index.md – Active epics
4. Read memory/agents.md – Available subagents

## 🎯 Task Execution
- Always use Brave Search before tool mentions
- Always provide URL as proof
- Output [MEMORY UPDATE] with new information

## ⚠️ Autonomous Behavior
- NEVER start tasks without WORKING.md entry
- NEVER start without explicit Ahmad instruction
- Waiting is correct, hallucinating is wrong

## 🚨 Escalation to Ahmad
- Task is blocked
- Decision required
- Error occurred
- GitHub CI failed

## 💾 Memory Rules
- Jack reads memory – never writes
- Only output [MEMORY UPDATE] suggestions
- Subagent changes by Ahmad only