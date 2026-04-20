# WORKING.md – Aktiver Task
Updated: 2026-04-20

## Aktueller Task
**TASK:** K-13 — Provider dashboard: show view/contact stats per listing
**PHASE:** Implementation
**PRIORITY:** High
**Status:** 🔄 IN PROGRESS

### Was zu tun ist:
- File: `/sandbox/.openclaw-data/workspace/github/jacknemo-platform/src/public/provider-dashboard.html`
- Die `getMine()` API gibt bereits `view_count` und `contact_count` zurück.
- In der Listings-Tabelle eine neue Spalte "Stats" hinzufügen: 👁 {view_count} | 📞 {contact_count}
- Branch: DEV
- Test: backend muss laufen (check via curl localhost:3001/api/listings/mine)
- Commit + push nach erfolgreichem Test

### Acceptance Criteria:
1. Provider dashboard zeigt Stats-Spalte mit view_count und contact_count
2. Keine Console-Errors
3. Responsive auf Mobile (flex/grid)

## Task Queue
1. [K-13] Provider dashboard stats — IN PROGRESS
2. [K-1] PostgreSQL real DB — BLOCKED (waiting for Ahmad credentials)
3. Neue Features: auf ACs von Alisia warten

## Zuletzt abgeschlossen
- K-12: Listing view/contact count increment
- K-11: Admin listing feature/unfeature
- K-10: Provider ratings system
- K-9: Persist backend startup on pod restart
- K-8: SSE / live notifications stub
- K-7: Listing update endpoint full field support
- K-6: Frontend dashboards rewritten
- K-5: Backend routes integrated
- K-2: Onboarding referral codes
