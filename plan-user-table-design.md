# Plan: User Table Design Implementation

## Ziel
Design und Implementierung der Users-Tabelle für die Startup Radar SaaS-Plattform

## Technische Entscheidungen
- **Option gewählt:** Single Users Table mit Role Column (Score: 8.95/10)
- **Datenbank:** PostgreSQL
- **Spalten:** Siehe Schema unten
- **Naming Convention:** snake_case
- **Constraints:** NOT NULL wo sinnvoll, DEFAULT Werte

## Users Table Schema
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
    verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    email_verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMPTZ
);
```

## Spaltenbeschreibung
| Spalte | Typ | Beschreibung | Constraints |
|--------|-----|-------------|-------------|
| id | SERIAL | Eindeutige ID | PRIMARY KEY |
| email | VARCHAR(255) | E-Mail Adresse | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | Gehashtes Passwort | NOT NULL |
| full_name | VARCHAR(255) | Vollständiger Name | NOT NULL |
| status | VARCHAR(20) | User Status | NOT NULL, DEFAULT 'pending' |
| is_verified | BOOLEAN | E-Mail verifiziert | NOT NULL, DEFAULT FALSE |
| role | VARCHAR(20) | Benutzerrolle | NOT NULL, DEFAULT 'user' |
| created_at | TIMESTAMPTZ | Erstellungszeit | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | Update-Zeit | NOT NULL, DEFAULT NOW() |
| verified_at | TIMESTAMPTZ | Verifizierungszeit | NULLABLE |
| last_login_at | TIMESTAMPTZ | Letzter Login | NULLABLE |
| email_verification_token | VARCHAR(255) | Verifizierungstoken | NULLABLE |
| reset_password_token | VARCHAR(255) | Passwort-Reset Token | NULLABLE |
| reset_password_expires | TIMESTAMPTZ | Token Ablaufzeit | NULLABLE |

## Mögliche Statuswerte
- 'pending' - Registrierung abgeschlossen, E-Mail nicht verifiziert
- 'active' - Account aktiv und verifiziert
- 'suspended' - Account gesperrt
- 'deleted' - Account gelöscht (soft delete)

## Mögliche Rollen
- 'user' - Standard Benutzer
- 'manager' - Manager mit erweiterten Rechten
- 'admin' - Administrator mit voller Kontrolle

## Indexes (zusätzlich)
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
```

## Implementierungsschritte
1. ✅ Research zu PostgreSQL User Table Design
2. ✅ Scorecard mit 3 Optionen erstellen
3. ✅ Entscheidung für Single Table mit Role Column
4. ✅ Detailliertes Schema designen
5. SQL Schema File erstellen
6. In Datenbank implementieren
7. Testdaten einfügen
8. Integration mit Express Backend testen

## Sicherheitsaspekte
- Passwörter werden gehasht gespeichert (bcrypt)
- E-Mails werden vor Speicherung normalisiert (lowercase)
- Sensitive Daten wie Tokens werden separat gespeichert
- Timestamps für Audit Trail

## Erweiterbarkeit
- Einfache Hinzufügung neuer Rollen
- Erweiterung um zusätzliche Profile-Daten möglich
- Support für OAuth Integration vorbereitet

## Nächste Schritte
1. SQL Schema File in `/database/schema/` erstellen
2. Migration Script für Setup
3. Integration mit Express Auth Middleware
4. Test Cases schreiben