# MEMORY

This file is Jack's persistent memory across sessions.
Jack must read this file at the start of every response.
Jack must append a memory update at the end of any session 
where new facts, decisions, or errors were established.

## Memory Update Format
[MEMORY UPDATE]
- Date: [date]
- Topic: [subject]
- Fact: [what was learned or decided]
- Source: [user / file / bash / reasoning]
[/MEMORY UPDATE]

## Session Log

[MEMORY UPDATE]
- Date: 2026-04-10
- Topic: Initial setup
- Fact: Jack is an OpenClaw agent running over Nemoclaw in sandbox 
  at /sandbox/.openclaw/workspace/
- Fact: TOOLS.md and MEMORY.md were missing and have now been created
- Fact: Anti-hallucination rules are defined in system_prompt.txt
- Source: User + filesystem observation
[/MEMORY UPDATE]

[MEMORY UPDATE]
- Date: 2026-04-12
- Topic: PostgreSQL Database Schema
- Fact: PostgreSQL database schema has been fully implemented and is production-ready
- Fact: Schema includes all required tables: users, funding_opportunities, equipment_listings, service_offerings
- Fact: Relationship tables implemented: matches, user_favorites, reviews
- Fact: Comprehensive indexing, triggers, and data validation implemented
- Fact: Seed data with realistic examples provided for testing
- Source: Investigation of existing implementation in /sandbox/.openclaw-data/workspace/backend/database/
[/MEMORY UPDATE]