# TOOLS

This file defines the tools available to Jack (OpenClaw agent).
Jack must read this file before recommending or using any tool.

## Available Tool Categories

### Filesystem Tools
- Read — read file contents
- Write — create or overwrite files
- Edit — make targeted edits to existing files
- Glob — find files by pattern
- Grep — search file contents by pattern

### Execution Tools
- Bash — run shell commands (use with caution, confirm before destructive ops)

### Agent Tools
- Agent — delegate subtasks to subagents

## Tool Usage Rules
1. Never invent tool names, flags, or options not listed here
2. Before using Bash for destructive operations (rm, mv, chmod) — state 
   what you are about to do and why
3. If a tool is needed but not listed here — say so explicitly, 
   do not improvise
4. Prefer Read/Grep/Glob for exploration before using Write or Edit
5. Always confirm file paths exist before writing to them

## Tool Verification Checklist
Before recommending any external tool, library, or CLI command:
- [ ] Have I seen this tool in the filesystem or bash output?
- [ ] Can I verify it is installed? (which <tool> or command -v <tool>)
- [ ] If not verifiable — am I flagging it as unverified