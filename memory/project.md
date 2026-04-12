# Startup Radar — Project Brief

**Repo:** https://github.com/Jackclaw-hub/jacknemo-platform  
**Stack (prototype):** Static HTML/CSS/JS — no build step, no backend  
**Goal:** UX-validation prototype → production Next.js app

## Product Vision

Founders juggle disconnected sources: grants, gear, legal/design providers — all separate.
Startup Radar is a **multi-sided platform** with one workspace where founders see a unified radar of opportunities.

## The Four Sides

| Side | Who | Page |
|------|-----|------|
| **Founders** | Early-stage startup founders needing capital, gear, services | `founder.html` |
| **Equipment/Space** | Hubs (studios, labs) + solo owners with idle gear | `supply-equipment.html` |
| **Service Providers** | Agencies/freelancers with starter-friendly packages | `supply-services.html` |
| **Platform Admin** | Operators — moderate, verify, configure taxonomy | `admin.html` |

## Current Prototype File Structure

```
startup-radar-prototype/
├── index.html                ← Role selection landing
├── founder.html              ← Founder profile + radar
├── supply-equipment.html     ← Equipment & space drafts
├── supply-services.html      ← Service offer drafts
├── admin.html                ← Admin dashboard (mock)
├── css/styles.css            ← Layout, components, theme
└── js/
    ├── data.js               ← Mock catalog (funding, equipment, services, users)
    ├── founder.js            ← Profile + radar scoring + render
    ├── supply.js             ← localStorage drafts
    └── admin.js              ← Tab UI + table injection
```

## Radar Scoring (founder.js)

- **Funding:** boost if stage+sector match; adjust for geo preference (regional/remote) + city
- **Equipment:** boost if tags align with founder stage; penalize regional mismatch when local preferred
- **Services:** boost stage/sector; exclude non-starter-friendly when checkbox on; slight penalty for geo mismatch

Items below threshold are hidden. Thresholds tunable in founder.js.

## Data Shape (data.js)

- **Funding:** `{ stages[], sectors[], geo: "regional"|"remote", regions[] }`
- **Equipment:** `{ tags[], geo, city|null, hourlyRate?, dailyRate? }`
- **Services:** `{ stages[], sectors[], starterFriendly: bool, geo, city?, fromPrice }`

## What's NOT Yet Built

- Auth (founders, providers, hub admins, platform admin)
- Real backend / database
- Supply-side drafts feeding founder radar
- Payments / booking
- Email / notifications
- Hub org accounts (multi-tenancy)
- Cofounder/investor matching (beyond mock funding rows)

## Production Roadmap (priority order)

1. Auth + role-based routes
2. Single backend catalog (Postgres) — listings + radar from same source
3. Moderation (pending → approve/reject)
4. Bookings / payments (or "request quote" CRM)
5. Email / in-app notifications
6. Hub as organization (member list, branded sub-pages, analytics)

## Key Design Principles

- Geography is **contextual**: some offers regional, others remote/global
- Hubs are **distribution partners** (trust, local inventory, members)
- One founder profile → one opportunity surface (unified radar)
- Scoring is **transparent and naive** for demo; will become ML-ranked in production
