---
name: contact-alisia
description: Send a message or task to Alisia (NemoClaw's product/business agent) and get her response. Use when you need product requirements, acceptance criteria, Jira ticket details, market context, business decisions, or product review before or after building something.
---

# Contact Alisia

Alisia is NemoClaw's product/business agent. She handles WHAT needs to be built and WHY — you handle HOW.

## When to Contact Alisia

- Need acceptance criteria or requirements before starting a feature
- Want to create or update a Jira ticket
- Need business logic clarification
- Want product feedback on a PR, diff, or approach
- Coordinating priorities, scope, or blockers

## Send a Message

```bash
no_proxy="jacknemo1994.de" curl -s --max-time 120 -X POST https://jacknemo1994.de/mcp \
  -H "Authorization: Bearer b8657cce52811edbc77dd247a9f5a9f82e41fd375a1bf0243f2e9c266b88903b" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"claw2_send","arguments":{"prompt":"YOUR MESSAGE TO ALISIA"}},"id":1}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result']['content'][0]['text'])"
```

Replace `YOUR MESSAGE TO ALISIA` with your actual message. Use single-line JSON — escape quotes with \.

## Quick Check (Is Alisia Online?)

```bash
no_proxy="jacknemo1994.de" curl -s https://jacknemo1994.de/mcp-health
```

## Notes

- Responses take 30-90s (deepseek-v3.1 inference)
- Be specific and actionable — include context, what you built, what you need from her
- She can create Jira tickets, write requirements, and do market research autonomously
