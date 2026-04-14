# User Table Design Scorecard

## Evaluation Criteria
| Kriterium | Gewicht | Beschreibung |
|-----------|---------|-------------|
| Passung zum Use Case | 30% | Wie gut passt das Design zu SaaS-Anforderungen |
| Dokumentation | 20% | Klarheit und Verfügbarkeit der Dokumentation |
| Community/Support | 15% | Verfügbarkeit von Community-Beispielen und Support |
| Performance | 20% | Geschwindigkeit und Skalierbarkeit |
| Integrationskosten | 15% | Einfachheit der Integration mit bestehendem Stack |

## Option A: Single Users Table mit Role Column
**Beschreibung:** Eine einzelne Users-Tabelle mit einer Role-Spalte zur Unterscheidung der Benutzerrollen

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);
```

| Kriterium | Gewicht | Score (/10) | Begründung |
|-----------|---------|-------------|------------|
| Passung zum Use Case | 30% | 9/10 | Perfekt für SaaS mit klaren Rollen |
| Dokumentation | 20% | 8/10 | Gut dokumentiertes Pattern |
| Community/Support | 15% | 9/10 | Sehr verbreitet, viele Beispiele |
| Performance | 20% | 9/10 | Einfache Struktur, gute Performance |
| Integrationskosten | 15% | 10/10 | Einfache Integration mit Node.js/Express |

**Gesamtscore: 8.95/10**

## Option B: Separate Tables per Role
**Beschreibung:** Separate Tabellen für jede Benutzerrolle (admin_users, manager_users, normal_users)

| Kriterium | Gewicht | Score (/10) | Begründung |
|-----------|---------|-------------|------------|
| Passung zum Use Case | 30% | 5/10 | Nicht skalierbar für neue Rollen |
| Dokumentation | 20% | 4/10 | Wenig dokumentiertes Pattern |
| Community/Support | 15% | 3/10 | Selten verwendet, wenig Support |
| Performance | 20% | 6/10 | Komplexere Abfragen nötig |
| Integrationskosten | 15% | 4/10 | Höherer Wartungsaufwand |

**Gesamtscore: 4.65/10**

## Option C: Users Table + User Roles Junction Table
**Beschreibung:** Users-Tabelle plus Junction-Tabelle für viele-zu-viele Rollenbeziehungen

| Kriterium | Gewicht | Score (/10) | Begründung |
|-----------|---------|-------------|------------|
| Passung zum Use Case | 30% | 8/10 | Flexibel für mehrere Rollen pro User |
| Dokumentation | 20% | 7/10 | Gut dokumentiert aber komplexer |
| Community/Support | 15% | 8/10 | Verbreitetes Pattern |
| Performance | 20% | 7/10 | Joins erforderlich |
| Integrationskosten | 15% | 6/10 | Komplexere Implementierung |

**Gesamtscore: 7.35/10**

## Entscheidung
**Empfohlene Option: Option A (Single Users Table mit Role Column)**

**Gründe:**
- Höchste Gesamtbewertung (8.95/10)
- Perfekte Passung für SaaS-Anwendung mit klaren Rollen
- Einfachste Implementierung und Wartung
- Beste Performance durch einfache Struktur
- Gut dokumentiert und community-erprobt

**Für Startup Radar ideal weil:**
- Klare Rollentrennung (Admin, Manager, User)
- Einfache Erweiterbarkeit
- Gute Performance für mittlere Benutzerzahlen
- Einfache Integration mit JWT Authentication